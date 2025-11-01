"""
Activities API Endpoints
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional
from datetime import datetime, timezone

from app.database.db import get_db
from app.models.activity import ActivityDB, ActivityCreate, ActivityResponse
from app.utils.logger import setup_logger

logger = setup_logger(__name__)

router = APIRouter(prefix="/api/activities", tags=["activities"])


@router.post("", response_model=ActivityResponse)
async def create_activity(request: ActivityCreate, db: Session = Depends(get_db)):
    """
    Create a new activity

    This endpoint will:
    1. End any previous active activities for this session
    2. Create a new activity with the given details
    """
    # End any previous active activities for this session
    active_activities = db.query(ActivityDB).filter(
        ActivityDB.session_id == request.session_id,
        ActivityDB.end_time.is_(None)
    ).all()

    for active in active_activities:
        active.end_time = datetime.now(timezone.utc)  # type: ignore[assignment]

    # Create new activity
    activity = ActivityDB(
        session_id=request.session_id,
        activity_type=request.activity_type.value,
        description=request.description,
        start_time=datetime.now(timezone.utc),
        details=request.details
    )

    db.add(activity)
    db.commit()
    db.refresh(activity)

    return ActivityResponse.model_validate(activity)


@router.get("/{session_id}", response_model=list[ActivityResponse])
async def get_activities(
    session_id: str,
    page: int = 1,
    page_size: int = 20,
    db: Session = Depends(get_db)
):
    """
    Get all activities for a session with pagination
    """
    offset = (page - 1) * page_size

    activities = db.query(ActivityDB).filter(
        ActivityDB.session_id == session_id
    ).order_by(ActivityDB.start_time.desc()).offset(offset).limit(page_size).all()

    return [ActivityResponse.model_validate(a) for a in activities]


@router.put("/{activity_id}/end")
async def end_activity(activity_id: int, db: Session = Depends(get_db)):
    """
    End an activity
    """
    activity: Optional[ActivityDB] = db.query(ActivityDB).filter(ActivityDB.id == activity_id).first()
    if not activity:
        raise HTTPException(status_code=404, detail="Activity not found")

    activity.end_time = datetime.now(timezone.utc)  # type: ignore[assignment]
    db.commit()

    return {"message": "Activity ended successfully"}
