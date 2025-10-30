"""
Chat API Endpoints
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, timezone

from app.database.db import get_db
from app.models.session import SessionDB
from app.models.message import MessageDB
from app.models.activity import ActivityDB
from app.services.llm_service import llm_service
from app.services.safety_service import safety_service
from app.services.voice_service import voice_service
from app.services.notification_service import notification_service

router = APIRouter(prefix="/api/chat", tags=["chat"])


class ChatRequest(BaseModel):
    """Request model for chat"""
    session_id: str
    message: str
    child_age: int
    voice_output: bool = False


class ChatResponse(BaseModel):
    """Response model for chat"""
    response: str
    audio_url: Optional[str] = None
    requires_camera: bool = False
    safety_status: str
    emotion: Optional[str] = None


@router.post("", response_model=ChatResponse)
async def chat(request: ChatRequest, db: Session = Depends(get_db)):
    """
    Main conversation endpoint
    Receives text/voice transcript, returns AI response
    """
    # Verify session exists
    session = db.query(SessionDB).filter(SessionDB.session_id == request.session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    if session.is_active is False:
        raise HTTPException(status_code=400, detail="Session is not active")

    # Safety check
    safety_result = await safety_service.assess_message_safety(
        request.message,
        request.child_age,
        request.session_id
    )

    # Detect emotion
    emotion = await llm_service.detect_emotion(request.message)

    # Send alert to parent if needed
    if safety_result["requires_parent_notification"] and safety_result["alert"]:
        parent_id = str(session.parent_id)
        await notification_service.notify_parent(parent_id, safety_result["alert"])

        # Save alert to database
        from app.models.alert import SafetyAlertDB
        alert = safety_result["alert"]
        db_alert = SafetyAlertDB(
            session_id=request.session_id,
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

    # Get conversation context (last few messages)
    recent_messages = db.query(MessageDB).filter(
        MessageDB.session_id == request.session_id
    ).order_by(MessageDB.timestamp.desc()).limit(5).all()

    context_parts = []
    for msg in reversed(recent_messages):
        context_parts.append(f"{msg.role}: {msg.content}")
    context = "\n".join(context_parts) if context_parts else ""

    # Generate response with LLM
    ai_response = await llm_service.generate(
        message=request.message,
        context=context,
        child_age=request.child_age,
        temperature=0.7
    )

    # Check if response suggests using camera
    requires_camera = any(phrase in ai_response.lower() for phrase in [
        "show me", "can you show", "take a picture", "let me see", "photo"
    ])

    # Convert to speech if requested
    audio_url = None
    if request.voice_output:
        voice_result = await voice_service.text_to_speech(
            ai_response,
            voice_style="friendly"
        )
        if voice_result.get("success") and voice_result.get("audio_path"):
            audio_url = f"/audio/{voice_result['audio_path'].split('/')[-1]}"

    # Log messages
    child_message = MessageDB(
        session_id=request.session_id,
        timestamp=datetime.now(timezone.utc),
        role="child",
        content=request.message,
        emotion=emotion
    )
    db.add(child_message)

    assistant_message = MessageDB(
        session_id=request.session_id,
        timestamp=datetime.now(timezone.utc),
        role="assistant",
        content=ai_response,
        audio_url=audio_url
    )
    db.add(assistant_message)

    # Update or create activity
    active_activity = db.query(ActivityDB).filter(
        ActivityDB.session_id == request.session_id,
        ActivityDB.end_time.is_(None)
    ).first()

    if not active_activity:
        activity = ActivityDB(
            session_id=request.session_id,
            activity_type="chat",
            start_time=datetime.now(timezone.utc),
            details={"messages": 1}
        )
        db.add(activity)
    else:
        # Update message count
        current_details = active_activity.details or {}
        if isinstance(current_details, dict):
            current_details["messages"] = current_details.get("messages", 0) + 1
            # Use flag_modified to ensure SQLAlchemy tracks the change
            from sqlalchemy.orm.attributes import flag_modified
            flag_modified(active_activity, "details")

    db.commit()

    # Send activity update to parent
    parent_id = str(session.parent_id)
    await notification_service.send_activity_update(parent_id, {
        "session_id": request.session_id,
        "activity": "chat",
        "last_message": request.message[:50] + "..." if len(request.message) > 50 else request.message
    })

    return ChatResponse(
        response=ai_response,
        audio_url=audio_url,
        requires_camera=requires_camera,
        safety_status=safety_result["concern_level"],
        emotion=emotion
    )


class StoryRequest(BaseModel):
    """Request model for story generation"""
    session_id: str
    theme: str
    child_age: int
    length: str = "medium"
    voice_output: bool = False


@router.post("/story", response_model=ChatResponse)
async def generate_story(request: StoryRequest, db: Session = Depends(get_db)):
    """
    Generate a story for the child
    """
    # Verify session exists
    session = db.query(SessionDB).filter(SessionDB.session_id == request.session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    # Generate story
    story = await llm_service.generate_story(
        theme=request.theme,
        child_age=request.child_age,
        length=request.length
    )

    # Convert to speech if requested
    audio_url = None
    if request.voice_output:
        voice_result = await voice_service.text_to_speech(
            story,
            voice_style="friendly"
        )
        if voice_result.get("success") and voice_result.get("audio_path"):
            audio_url = f"/audio/{voice_result['audio_path'].split('/')[-1]}"

    # Log activity
    activity = ActivityDB(
        session_id=request.session_id,
        activity_type="story",
        start_time=datetime.now(timezone.utc),
        end_time=datetime.now(timezone.utc),
        details={"theme": request.theme, "length": request.length}
    )
    db.add(activity)

    # Log message
    message = MessageDB(
        session_id=request.session_id,
        timestamp=datetime.now(timezone.utc),
        role="assistant",
        content=story,
        audio_url=audio_url
    )
    db.add(message)
    db.commit()

    return ChatResponse(
        response=story,
        audio_url=audio_url,
        requires_camera=False,
        safety_status="none",
        emotion="happy"
    )
