"""
Image Analysis API Endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, timezone

from app.database.db import get_db
from app.models.session import SessionDB
from app.models.message import MessageDB
from app.models.activity import ActivityDB
from app.services.vision_service import vision_service
from app.services.llm_service import llm_service
from app.services.safety_service import safety_service
from app.services.notification_service import notification_service
from app.models.alert import AlertLevel, SafetyAlert

router = APIRouter(prefix="/api/images", tags=["images"])


class ImageAnalysisRequest(BaseModel):
    """Request model for image analysis"""
    session_id: str
    context: str  # homework, game, safety_check, show_tell
    child_age: int
    prompt: Optional[str] = ""


class ImageAnalysisResponse(BaseModel):
    """Response model for image analysis"""
    analysis: str
    detected_objects: Optional[List[str]] = None
    safety_alert: Optional[str] = None
    ai_response: str


@router.post("/analyze", response_model=ImageAnalysisResponse)
async def analyze_image(
    session_id: str,
    context: str,
    child_age: int,
    prompt: str = "",
    image: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """
    Analyze uploaded image (homework, game, safety check, show and tell)
    """
    # Verify session exists
    session = db.query(SessionDB).filter(SessionDB.session_id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    # Read image data
    image_bytes = await image.read()

    # Check image size (10MB limit)
    if len(image_bytes) > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Image too large (max 10MB)")

    # Safety check first
    safety_check = await safety_service.check_image_safety(image_bytes)

    if not safety_check["is_safe"]:
        # Create urgent alert
        alert = SafetyAlert(
            level=AlertLevel.URGENT,
            timestamp=datetime.now(timezone.utc),
            message="Inappropriate image detected",
            context=f"Image upload in {context} context",
            ai_assessment="Image failed safety check",
            requires_action=True
        )

        parent_id = str(session.parent_id)
        await notification_service.notify_parent(parent_id, alert)

        # Save alert to database
        from app.models.alert import SafetyAlertDB
        db_alert = SafetyAlertDB(
            session_id=session_id,
            alert_level=alert.level,
            timestamp=alert.timestamp,
            message=alert.message,
            context=alert.context,
            ai_assessment=alert.ai_assessment,
            requires_action=alert.requires_action,
            parent_notified=True
        )
        db.add(db_alert)
        db.commit()

        return ImageAnalysisResponse(
            analysis="I can't analyze this image.",
            safety_alert="Image contains inappropriate content",
            ai_response="I can't help with this image. Let's try something else!"
        )

    # Analyze image based on context
    analysis_result = await vision_service.analyze_image(
        image_bytes,
        context,
        child_age,
        prompt
    )

    if not analysis_result.get("success"):
        raise HTTPException(
            status_code=503,
            detail="Image analysis service unavailable. Please configure vision API."
        )

    analysis_text = analysis_result.get("analysis", "")

    # Generate child-friendly response based on context
    if context == "homework":
        ai_response = await llm_service.help_with_homework(
            prompt or "Help me understand this problem",
            child_age,
            analysis_text
        )
    elif context == "game":
        objects = await vision_service.identify_objects(image_bytes)
        ai_response = f"I can see lots of fun things! {analysis_text}"
        analysis_result["detected_objects"] = objects.get("objects", [])
    elif context == "safety_check":
        safety_result = await vision_service.safety_check_image(image_bytes)
        if not safety_result["is_safe"]:
            ai_response = "I see something that might need attention. Let me tell a grown-up."
            # Alert parent
            alert = SafetyAlert(
                level=AlertLevel.WARNING,
                timestamp=datetime.now(timezone.utc),
                message="Potential safety concern in image",
                context=f"Safety check: {analysis_text}",
                ai_assessment=", ".join(safety_result.get("concerns", [])),
                requires_action=True
            )
            parent_id = str(session.parent_id)
            await notification_service.notify_parent(parent_id, alert)
        else:
            ai_response = "Everything looks good! What would you like to do next?"
    else:  # show_tell
        ai_response = await llm_service.generate(
            message=f"The child is showing me: {analysis_text}. {prompt}",
            context="The child wants to show me something",
            child_age=child_age,
            temperature=0.8
        )

    # Log message
    message = MessageDB(
        session_id=session_id,
        timestamp=datetime.now(timezone.utc),
        role="assistant",
        content=ai_response,
        has_image=True
    )
    db.add(message)

    # Update activity
    active_activity = db.query(ActivityDB).filter(
        ActivityDB.session_id == session_id,
        ActivityDB.end_time.is_(None)
    ).first()

    if active_activity:
        # Increment image count - using SQL update to avoid type issues
        db.execute(
            ActivityDB.__table__.update().
            where(ActivityDB.id == active_activity.id).
            values(images_used=(active_activity.images_used or 0) + 1)
        )
    else:
        # Create new activity
        activity = ActivityDB(
            session_id=session_id,
            activity_type="image_analysis",
            start_time=datetime.now(timezone.utc),
            details={"context": context},
            images_used=1
        )
        db.add(activity)

    db.commit()

    return ImageAnalysisResponse(
        analysis=analysis_text,
        detected_objects=analysis_result.get("detected_objects"),
        safety_alert=analysis_result.get("safety_concern"),
        ai_response=ai_response
    )


@router.post("/homework-help")
async def homework_help(
    session_id: str,
    child_age: int,
    question: str = "",
    image: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """
    Specialized endpoint for homework help with image
    """
    return await analyze_image(
        session_id=session_id,
        context="homework",
        child_age=child_age,
        prompt=question,
        image=image,
        db=db
    )
