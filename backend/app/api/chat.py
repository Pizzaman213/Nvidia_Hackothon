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
from app.utils.logger import setup_logger

logger = setup_logger(__name__)
router = APIRouter(prefix="/api/chat", tags=["chat"])


def extract_thinking(text: str) -> tuple[str, Optional[str]]:
    """
    Extract <think> tags from LLM response.
    Returns (visible_response, thinking_content)
    """
    if "<think>" in text and "</think>" in text:
        # Split on </think> to separate thinking from response
        parts = text.split("</think>", 1)
        thinking_part = parts[0]
        response_part = parts[1].strip() if len(parts) > 1 else ""

        # Extract thinking content (remove <think> tag)
        thinking_content = thinking_part.replace("<think>", "").strip()

        return response_part, thinking_content

    return text, None


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
    ai_reasoning: Optional[str] = None  # <think> content for parent visibility
    sources: Optional[list] = None  # RAG source citations


@router.post("", response_model=ChatResponse)
async def chat(request: ChatRequest, db: Session = Depends(get_db)):
    """
    Main conversation endpoint
    Receives text/voice transcript, returns AI response
    """
    logger.info(
        f"Chat request received for session {request.session_id}",
        extra={
            "extra_data": {
                "session_id": request.session_id,
                "message_length": len(request.message),
                "child_age": request.child_age,
                "voice_output": request.voice_output
            }
        }
    )

    # Verify session exists
    session = db.query(SessionDB).filter(SessionDB.session_id == request.session_id).first()
    if not session:
        logger.warning(f"Session not found: {request.session_id}")
        raise HTTPException(status_code=404, detail="Session not found")

    if session.is_active is False:
        logger.warning(f"Inactive session accessed: {request.session_id}")
        raise HTTPException(status_code=400, detail="Session is not active")

    logger.debug(f"Message from child: {request.message[:100]}...")

    # Safety check with database session for conversation context
    logger.debug("Running safety assessment...")
    try:
        safety_result = await safety_service.assess_message_safety(
            request.message,
            request.child_age,
            request.session_id,
            db_session=db
        )
    except Exception as e:
        logger.error(f"Error in safety assessment: {str(e)}", exc_info=True)
        # Fallback to safe default
        safety_result = {
            "is_safe": True,
            "concern_level": "none",
            "requires_parent_notification": False,
            "alert": None
        }

    # Detect emotion
    logger.debug("Detecting emotion...")
    try:
        emotion = await llm_service.detect_emotion(request.message)
        logger.info(f"Detected emotion: {emotion}")
    except Exception as e:
        logger.error(f"Error detecting emotion: {str(e)}", exc_info=True)
        emotion = "neutral"  # Fallback to neutral

    # Send alert to parent if needed
    if safety_result["requires_parent_notification"] and safety_result["alert"]:
        parent_id = str(session.parent_id)
        logger.warning(
            f"Safety alert triggered for session {request.session_id}",
            extra={
                "extra_data": {
                    "session_id": request.session_id,
                    "parent_id": parent_id,
                    "alert_level": safety_result["alert"].level
                }
            }
        )
        try:
            await notification_service.notify_parent(parent_id, safety_result["alert"])
        except Exception as e:
            logger.error(f"Error notifying parent: {str(e)}", exc_info=True)

        # Save alert to database
        try:
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
            logger.info(f"Safety alert saved to database")
        except Exception as e:
            logger.error(f"Error saving safety alert: {str(e)}", exc_info=True)
            db.rollback()

    # Get conversation context (last few messages)
    logger.debug("Fetching conversation context...")
    recent_messages = db.query(MessageDB).filter(
        MessageDB.session_id == request.session_id
    ).order_by(MessageDB.timestamp.desc()).limit(5).all()

    context_parts = []
    for msg in reversed(recent_messages):
        context_parts.append(f"{msg.role}: {msg.content}")
    context = "\n".join(context_parts) if context_parts else ""
    logger.debug(f"Retrieved {len(recent_messages)} recent messages for context")

    # Generate response with LLM and RAG
    logger.info("Generating AI response with RAG context...")
    try:
        raw_ai_response, rag_sources = await llm_service.generate_with_rag(
            message=request.message,
            context=context,
            child_age=request.child_age,
            child_gender=session.child_gender,
            temperature=0.7,
            use_rag=True,
            n_sources=3
        )
        logger.info(f"AI response generated: {len(raw_ai_response)} characters, {len(rag_sources)} sources used")
    except Exception as e:
        logger.error(f"Error generating AI response with RAG, falling back to basic response: {str(e)}", exc_info=True)
        # Fallback: Try without RAG
        try:
            raw_ai_response = await llm_service.generate(
                message=request.message,
                context=context,
                child_age=request.child_age,
                child_gender=session.child_gender,
                temperature=0.7
            )
            rag_sources = []
            logger.info("AI response generated using fallback (no RAG)")
        except Exception as e2:
            logger.error(f"Error generating fallback response: {str(e2)}", exc_info=True)
            # Ultimate fallback - return a generic friendly response
            raw_ai_response = "I'm having a little trouble right now. Could you try asking me again?"
            rag_sources = []

    # Extract thinking from response (for parent visibility)
    ai_response, ai_reasoning = extract_thinking(raw_ai_response)
    if ai_reasoning:
        logger.debug(f"Extracted AI reasoning: {len(ai_reasoning)} characters")

    # Save citations to database if sources were used
    citation_ids = []
    if rag_sources:
        from app.models.citation import CitationDB
        for source in rag_sources:
            source_metadata = source.get('metadata', {})
            citation = CitationDB(
                session_id=request.session_id,
                source_type=source_metadata.get('source_type', 'unknown'),
                source_title=source_metadata.get('source_title', 'Unknown Source'),
                source_url=source_metadata.get('source_url', ''),
                source_date=source_metadata.get('source_date'),
                relevant_excerpt=source.get('text', '')[:500],  # Store first 500 chars
                page_section=source_metadata.get('section'),
                confidence_score=source.get('similarity_score', 0),
                is_public_domain=source_metadata.get('is_public_domain', True),
                license_type=source_metadata.get('license_type', 'public_domain')
            )
            db.add(citation)
            db.flush()  # Get the ID
            citation_ids.append(citation.id)
        logger.info(f"Saved {len(citation_ids)} citations to database")

    # Format sources for response
    formatted_sources = []
    if rag_sources:
        for source in rag_sources:
            source_metadata = source.get('metadata', {})
            formatted_sources.append({
                'title': source_metadata.get('source_title', 'Unknown'),
                'url': source_metadata.get('source_url', ''),
                'type': source_metadata.get('source_type', 'unknown'),
                'relevance': source.get('similarity_score', 0)
            })

    # Check if response suggests using camera
    requires_camera = any(phrase in ai_response.lower() for phrase in [
        "show me", "can you show", "take a picture", "let me see", "photo"
    ])
    if requires_camera:
        logger.info("AI response suggests camera usage")

    # Convert to speech if requested
    audio_url = None
    if request.voice_output:
        logger.info("Converting response to speech...")
        try:
            voice_result = await voice_service.text_to_speech(
                ai_response,
                voice_style="friendly"
            )
            if voice_result.get("success") and voice_result.get("audio_path"):
                audio_url = f"/audio/{voice_result['audio_path'].split('/')[-1]}"
                logger.info(f"Audio generated: {audio_url}")
            else:
                logger.warning("Failed to generate audio")
        except Exception as e:
            logger.error(f"Error generating voice output: {str(e)}", exc_info=True)
            # Continue without audio - text response is still valid

    # Log messages
    logger.debug("Saving messages to database...")
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
    logger.debug("Updating activity tracking...")
    active_activity = db.query(ActivityDB).filter(
        ActivityDB.session_id == request.session_id,
        ActivityDB.end_time.is_(None)
    ).first()

    if not active_activity:
        logger.info("Creating new activity record")
        activity = ActivityDB(
            session_id=request.session_id,
            activity_type="chat",
            description=f"Conversation with {session.child_name}",
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
        logger.debug(f"Updated activity message count: {current_details.get('messages', 0)}")

    try:
        db.commit()
        logger.info("Database transaction committed successfully")
    except Exception as e:
        logger.error(f"Failed to commit to database: {str(e)}", exc_info=True)
        db.rollback()
        raise

    # Send activity update to parent
    parent_id = str(session.parent_id)
    logger.debug(f"Sending activity update to parent {parent_id}")
    try:
        await notification_service.send_activity_update(parent_id, {
            "session_id": request.session_id,
            "activity": "chat",
            "last_message": request.message[:50] + "..." if len(request.message) > 50 else request.message
        })
    except Exception as e:
        logger.error(f"Error sending activity update: {str(e)}", exc_info=True)
        # Non-critical error, continue

    logger.info(
        f"Chat request completed successfully for session {request.session_id}",
        extra={
            "extra_data": {
                "session_id": request.session_id,
                "safety_status": safety_result["concern_level"],
                "emotion": emotion,
                "has_audio": bool(audio_url),
                "requires_camera": requires_camera
            }
        }
    )

    return ChatResponse(
        response=ai_response,
        audio_url=audio_url,
        requires_camera=requires_camera,
        safety_status=safety_result["concern_level"],
        emotion=emotion,
        ai_reasoning=ai_reasoning,
        sources=formatted_sources if formatted_sources else None
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
    logger.info(
        f"Story generation request for session {request.session_id}",
        extra={
            "extra_data": {
                "session_id": request.session_id,
                "theme": request.theme,
                "length": request.length,
                "child_age": request.child_age,
                "voice_output": request.voice_output
            }
        }
    )

    # Verify session exists
    session = db.query(SessionDB).filter(SessionDB.session_id == request.session_id).first()
    if not session:
        logger.warning(f"Session not found: {request.session_id}")
        raise HTTPException(status_code=404, detail="Session not found")

    if session.is_active is False:
        logger.warning(f"Inactive session accessed: {request.session_id}")
        raise HTTPException(status_code=400, detail="Session is not active")

    # Generate story
    try:
        logger.info(f"Generating story with theme: {request.theme}")
        raw_story = await llm_service.generate_story(
            theme=request.theme,
            child_age=request.child_age,
            child_gender=session.child_gender,
            length=request.length
        )
        logger.info(f"Story generated: {len(raw_story)} characters")

        # Extract thinking from story (for parent visibility)
        story, story_reasoning = extract_thinking(raw_story)
        if story_reasoning:
            logger.debug(f"Extracted story reasoning: {len(story_reasoning)} characters")
    except Exception as e:
        logger.error(f"Failed to generate story: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to generate story: {str(e)}")

    # Convert to speech if requested
    audio_url = None
    if request.voice_output:
        logger.info("Converting story to speech...")
        try:
            voice_result = await voice_service.text_to_speech(
                story,
                voice_style="friendly"
            )
            if voice_result.get("success") and voice_result.get("audio_path"):
                audio_url = f"/audio/{voice_result['audio_path'].split('/')[-1]}"
                logger.info(f"Audio generated: {audio_url}")
            else:
                logger.warning("Failed to generate audio for story")
        except Exception as e:
            logger.warning(f"Audio generation failed: {str(e)}")
            # Continue without audio - story can still be read

    # Log activity
    logger.debug("Saving story activity to database...")
    activity = ActivityDB(
        session_id=request.session_id,
        activity_type="story",
        description=f"Story about {request.theme}",
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

    try:
        db.commit()
        logger.info("Story and activity saved to database")
    except Exception as e:
        logger.error(f"Failed to save story to database: {str(e)}", exc_info=True)
        db.rollback()
        raise HTTPException(status_code=500, detail="Failed to save story")

    # Send activity update to parent
    parent_id = str(session.parent_id)
    await notification_service.send_activity_update(parent_id, {
        "session_id": request.session_id,
        "activity": "story",
        "theme": request.theme
    })

    logger.info(f"Story generation completed successfully for session {request.session_id}")

    return ChatResponse(
        response=story,
        audio_url=audio_url,
        requires_camera=False,
        safety_status="none",
        emotion="happy",
        ai_reasoning=story_reasoning
    )
