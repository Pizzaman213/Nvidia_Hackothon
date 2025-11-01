"""
Session Management API Endpoints
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime, timezone
import uuid

from app.database.db import get_db
from app.models.session import SessionDB, SessionCreate, SessionResponse
from app.models.activity import ActivityDB, ActivityResponse
from app.models.alert import SafetyAlertDB, AlertResponse
from app.models.message import MessageDB, MessageResponse
from app.utils.logger import setup_logger

logger = setup_logger(__name__)

router = APIRouter(prefix="/api/sessions", tags=["sessions"])


@router.post("", response_model=SessionResponse)
async def create_session(request: SessionCreate, db: Session = Depends(get_db)):
    """
    Create a new child session
    """
    logger.info(f"Creating session for child: {request.child_name or request.child_id}", extra={"extra_data": {"parent_id": request.parent_id}})
    from app.models.child import ChildDB

    # Generate unique session ID
    session_id = str(uuid.uuid4())

    # If child_id is provided, get child info from profile
    if request.child_id:
        child = db.query(ChildDB).filter(ChildDB.child_id == request.child_id).first()
        if not child:
            raise HTTPException(status_code=404, detail="Child profile not found")

        session = SessionDB(
            session_id=session_id,
            child_id=child.child_id,
            child_name=child.name,
            child_age=child.age,
            child_gender=child.gender,
            parent_id=request.parent_id,
            start_time=datetime.now(timezone.utc),
            is_active=True
        )
    else:
        # Backwards compatibility: create session without child profile
        if not request.child_name or not request.child_age:
            raise HTTPException(
                status_code=400,
                detail="Either child_id or both child_name and child_age must be provided"
            )

        session = SessionDB(
            session_id=session_id,
            child_id=None,
            child_name=request.child_name,
            child_age=request.child_age,
            child_gender=request.child_gender,
            parent_id=request.parent_id,
            start_time=datetime.now(timezone.utc),
            is_active=True
        )

    db.add(session)
    db.commit()
    db.refresh(session)
    logger.info(f"Session created successfully: {session_id}", extra={"extra_data": {"session_id": session_id, "child_name": session.child_name}})

    return SessionResponse.model_validate(session)


@router.get("/{session_id}", response_model=SessionResponse)
async def get_session(session_id: str, db: Session = Depends(get_db)):
    """
    Get session details
    """
    session = db.query(SessionDB).filter(SessionDB.session_id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    return SessionResponse.model_validate(session)


@router.post("/{session_id}/end")
async def end_session(session_id: str, db: Session = Depends(get_db)):
    """
    End a session
    """
    logger.info(f"Ending session: {session_id}")
    session = db.query(SessionDB).filter(SessionDB.session_id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    # Update session
    db.execute(
        SessionDB.__table__.update().
        where(SessionDB.session_id == session_id).
        values(
            end_time=datetime.now(timezone.utc),
            is_active=False
        )
    )

    # End any active activities
    db.execute(
        ActivityDB.__table__.update().
        where(ActivityDB.session_id == session_id).
        where(ActivityDB.end_time.is_(None)).
        values(end_time=datetime.now(timezone.utc))
    )

    db.commit()

    return {"message": "Session ended successfully"}


class SessionSummary(BaseModel):
    """Session summary with statistics"""
    session: SessionResponse
    total_messages: int
    total_activities: int
    total_alerts: int
    duration_minutes: Optional[int] = None


@router.get("/{session_id}/summary", response_model=SessionSummary)
async def get_session_summary(session_id: str, db: Session = Depends(get_db)):
    """
    Get session summary with statistics
    """
    session = db.query(SessionDB).filter(SessionDB.session_id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    # Count messages
    message_count = db.query(MessageDB).filter(MessageDB.session_id == session_id).count()

    # Count activities
    activity_count = db.query(ActivityDB).filter(ActivityDB.session_id == session_id).count()

    # Count alerts
    alert_count = db.query(SafetyAlertDB).filter(SafetyAlertDB.session_id == session_id).count()

    # Calculate duration
    duration_minutes = None
    if session.end_time is not None:
        duration = session.end_time - session.start_time
        duration_minutes = int(duration.total_seconds() / 60)
    elif session.start_time is not None:
        duration = datetime.now(timezone.utc) - session.start_time
        duration_minutes = int(duration.total_seconds() / 60)

    return SessionSummary(
        session=SessionResponse.model_validate(session),
        total_messages=message_count,
        total_activities=activity_count,
        total_alerts=alert_count,
        duration_minutes=duration_minutes
    )


@router.get("/{session_id}/activities", response_model=List[ActivityResponse])
async def get_session_activities(session_id: str, db: Session = Depends(get_db)):
    """
    Get all activities for a session
    """
    # Verify session exists
    session = db.query(SessionDB).filter(SessionDB.session_id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    activities = db.query(ActivityDB).filter(
        ActivityDB.session_id == session_id
    ).order_by(ActivityDB.start_time.desc()).all()

    return [ActivityResponse.model_validate(a) for a in activities]


@router.get("/{session_id}/messages", response_model=List[MessageResponse])
async def get_session_messages(
    session_id: str,
    limit: int = 50,
    db: Session = Depends(get_db)
):
    """
    Get conversation history for a session
    """
    # Verify session exists
    session = db.query(SessionDB).filter(SessionDB.session_id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    messages = db.query(MessageDB).filter(
        MessageDB.session_id == session_id
    ).order_by(MessageDB.timestamp.desc()).limit(limit).all()

    # Reverse to get chronological order
    return [MessageResponse.model_validate(m) for m in reversed(messages)]


@router.get("/{session_id}/alerts", response_model=List[AlertResponse])
async def get_session_alerts(session_id: str, db: Session = Depends(get_db)):
    """
    Get all alerts for a session
    """
    # Verify session exists
    session = db.query(SessionDB).filter(SessionDB.session_id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    alerts = db.query(SafetyAlertDB).filter(
        SafetyAlertDB.session_id == session_id
    ).order_by(SafetyAlertDB.timestamp.desc()).all()

    return [AlertResponse.model_validate(a) for a in alerts]


@router.get("/parent/{parent_id}", response_model=List[SessionResponse])
async def get_parent_sessions(
    parent_id: str,
    active_only: bool = False,
    db: Session = Depends(get_db)
):
    """
    Get all sessions for a parent
    """
    query = db.query(SessionDB).filter(SessionDB.parent_id == parent_id)

    if active_only:
        query = query.filter(SessionDB.is_active == True)

    sessions = query.order_by(SessionDB.start_time.desc()).all()

    return [SessionResponse.model_validate(s) for s in sessions]
