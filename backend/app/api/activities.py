"""
Activities API Endpoints
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timezone

from app.database.db import get_db
from app.models.activity import ActivityDB, ActivityCreate, ActivityResponse

router = APIRouter(prefix="/api/activities", tags=["activities"])


@router.post("", response_model=ActivityResponse)
async def create_activity(request: ActivityCreate, db: Session = Depends(get_db)):
    """
    Create a new activity
    """
    activity = ActivityDB(
        session_id=request.session_id,
        activity_type=request.activity_type.value,
        start_time=datetime.now(timezone.utc),
        details=request.details
    )

    db.add(activity)
    db.commit()
    db.refresh(activity)

    return ActivityResponse.model_validate(activity)


@router.get("/{session_id}", response_model=List[ActivityResponse])
async def get_activities(
    session_id: str,
    page: int = 1,
    page_size: int = 20,
    db: Session = Depends(get_db)
):
    """
    Get activities for a session with pagination
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
