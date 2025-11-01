"""
Emergency API Endpoints
"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, timezone

from app.database.db import get_db
from app.models.alert import SafetyAlertDB, AlertLevel, SafetyAlert
from app.models.session import SessionDB
from app.models.child import ChildDB
from app.services.notification_service import notification_service
from app.utils.logger import setup_logger

logger = setup_logger(__name__)
router = APIRouter(prefix="/api/emergency", tags=["emergency"])


class EmergencyRequest(BaseModel):
    session_id: str
    reason: Optional[str] = "Child triggered panic button"


class EmergencyRequestNoSession(BaseModel):
    child_id: str
    parent_id: str
    child_name: str
    reason: Optional[str] = "Child triggered panic button (no active session)"


@router.post("")
async def trigger_emergency(request: EmergencyRequest, db: Session = Depends(get_db)):
    """
    Trigger emergency alert (panic button)

    This endpoint is called when a child presses the emergency/panic button.
    It creates an urgent alert and immediately notifies the parent.
    """
    logger.warning(f"EMERGENCY ALERT triggered for session {request.session_id}: {request.reason}")

    # Get session to find parent_id
    session = db.query(SessionDB).filter(SessionDB.session_id == request.session_id).first()

    if not session:
        logger.error(f"Session not found for emergency alert: {request.session_id}")
        return {
            "success": False,
            "message": "Session not found",
            "alert_id": None
        }

    # Create emergency alert
    alert = SafetyAlertDB(
        session_id=request.session_id,
        alert_level=AlertLevel.EMERGENCY,
        message="EMERGENCY: Panic button pressed",
        context=request.reason,
        ai_assessment="Immediate parent notification required",
        requires_action=True,
        parent_notified=True
    )

    db.add(alert)
    db.commit()
    db.refresh(alert)

    logger.info(f"Emergency alert created with ID: {alert.id}")

    # Send immediate notification to parent via WebSocket
    try:
        # Create SafetyAlert object for notification
        alert_obj = SafetyAlert(
            level=AlertLevel.EMERGENCY,
            timestamp=alert.timestamp,
            message="EMERGENCY: Child pressed panic button",
            context=f"Child: {session.child_name} - {request.reason}",
            ai_assessment="Immediate parent notification required",
            requires_action=True
        )

        await notification_service.notify_parent(
            parent_id=session.parent_id,
            alert=alert_obj
        )
        logger.info(f"Parent {session.parent_id} notified via WebSocket")
    except Exception as e:
        logger.error(f"Failed to send WebSocket notification: {str(e)}", exc_info=True)
        # Continue anyway - alert is saved in database

    # Log emergency contact info (but don't auto-call via Twilio)
    # The child will use LOCAL device calling or WebRTC voice chat instead
    has_emergency_contact = False

    if session.child_id:
        child = db.query(ChildDB).filter(ChildDB.child_id == session.child_id).first()
        if child and child.emergency_contact:
            has_emergency_contact = True
            logger.info(f"Emergency contact available: {child.emergency_contact} for {child.name}")
            logger.info("Child will use local device calling or WebRTC voice chat")
        else:
            logger.warning(f"No emergency contact configured for child {session.child_name}")
    else:
        logger.warning(f"Session {request.session_id} has no child_id")

    return {
        "success": True,
        "message": "Emergency alert triggered and parent notified via dashboard",
        "alert_id": alert.id,
        "has_emergency_contact": has_emergency_contact
    }


@router.post("/no-session")
async def trigger_emergency_without_session(request: EmergencyRequestNoSession, db: Session = Depends(get_db)):
    """
    Trigger emergency alert without an active session

    This endpoint is called when a child presses the emergency/panic button
    but doesn't have an active session (e.g., just logged in but hasn't started an activity).
    """
    logger.warning(f"EMERGENCY ALERT (NO SESSION) triggered for child {request.child_name} ({request.child_id}): {request.reason}")

    # Create a standalone emergency alert (no session_id)
    alert = SafetyAlertDB(
        session_id=None,  # No session for this alert
        alert_level=AlertLevel.EMERGENCY,
        message=f"EMERGENCY: Panic button pressed by {request.child_name}",
        context=f"{request.reason} - No active session",
        ai_assessment="Immediate parent notification required - child needs help",
        requires_action=True,
        parent_notified=True
    )

    db.add(alert)
    db.commit()
    db.refresh(alert)

    logger.info(f"Emergency alert (no session) created with ID: {alert.id}")

    # Send immediate notification to parent via WebSocket
    try:
        # Create SafetyAlert object for notification
        alert_obj = SafetyAlert(
            level=AlertLevel.EMERGENCY,
            timestamp=alert.timestamp,
            message=f"EMERGENCY: {request.child_name} pressed panic button",
            context=f"{request.reason} - Child was not in an active session",
            ai_assessment="Immediate parent notification required - child needs help",
            requires_action=True
        )

        await notification_service.notify_parent(
            parent_id=request.parent_id,
            alert=alert_obj
        )
        logger.info(f"Parent {request.parent_id} notified via WebSocket (no-session alert)")
    except Exception as e:
        logger.error(f"Failed to send WebSocket notification: {str(e)}", exc_info=True)
        # Continue anyway - alert is saved in database

    # Check for emergency contact
    has_emergency_contact = False
    child = db.query(ChildDB).filter(ChildDB.child_id == request.child_id).first()
    if child and child.emergency_contact:
        has_emergency_contact = True
        logger.info(f"Emergency contact available: {child.emergency_contact} for {child.name}")
        logger.info("Child will use local device calling or WebRTC voice chat")
    else:
        logger.warning(f"No emergency contact configured for child {request.child_name}")

    return {
        "success": True,
        "message": "Emergency alert triggered and parent notified via dashboard (no active session)",
        "alert_id": alert.id,
        "has_emergency_contact": has_emergency_contact
    }
