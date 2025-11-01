"""
API endpoints for child-specific settings management
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional

from app.database.db import get_db
from app.models.child import ChildDB
from app.models.child_settings import (
    ChildSettingsDB,
    ChildSettings,
    ChildSettingsUpdate,
    ChildSettingsCreate
)
from app.utils.logger import setup_logger

logger = setup_logger(__name__)

router = APIRouter(prefix="/api/settings/child", tags=["child-settings"])


@router.get("/{child_id}", response_model=ChildSettings)
async def get_child_settings(
    child_id: str,
    db: Session = Depends(get_db)
):
    """
    Get settings for a specific child
    """
    # Find child by child_id
    child = db.query(ChildDB).filter(ChildDB.child_id == child_id).first()

    if not child:
        raise HTTPException(status_code=404, detail="Child not found")

    # Get settings for this child
    settings = db.query(ChildSettingsDB).filter(
        ChildSettingsDB.child_id == child.id
    ).first()

    if not settings:
        # Create default settings if they don't exist
        settings = ChildSettingsDB(
            child_id=child.id,
            allowed_activities=["story_time", "i_spy", "homework_helper", "free_chat"],
            session_timeout_minutes=120,
            content_filter_level="moderate",
            enable_camera=True,
            enable_microphone=True
        )
        db.add(settings)
        db.commit()
        db.refresh(settings)

    return settings


@router.put("/{child_id}", response_model=ChildSettings)
async def update_child_settings(
    child_id: str,
    settings_update: ChildSettingsUpdate,
    db: Session = Depends(get_db)
):
    """
    Update settings for a specific child
    """
    # Find child by child_id
    child = db.query(ChildDB).filter(ChildDB.child_id == child_id).first()

    if not child:
        raise HTTPException(status_code=404, detail="Child not found")

    # Get existing settings
    settings = db.query(ChildSettingsDB).filter(
        ChildSettingsDB.child_id == child.id
    ).first()

    if not settings:
        # Create new settings if they don't exist
        settings = ChildSettingsDB(
            child_id=child.id,
            allowed_activities=["story_time", "i_spy", "homework_helper", "free_chat"],
            session_timeout_minutes=120,
            content_filter_level="moderate",
            enable_camera=True,
            enable_microphone=True
        )
        db.add(settings)

    # Update fields if provided
    if settings_update.allowed_activities is not None:
        settings.allowed_activities = settings_update.allowed_activities

    if settings_update.session_timeout_minutes is not None:
        settings.session_timeout_minutes = settings_update.session_timeout_minutes

    if settings_update.content_filter_level is not None:
        settings.content_filter_level = settings_update.content_filter_level

    if settings_update.enable_camera is not None:
        settings.enable_camera = settings_update.enable_camera

    if settings_update.enable_microphone is not None:
        settings.enable_microphone = settings_update.enable_microphone

    if settings_update.quiet_hours_start is not None:
        settings.quiet_hours_start = settings_update.quiet_hours_start

    if settings_update.quiet_hours_end is not None:
        settings.quiet_hours_end = settings_update.quiet_hours_end

    db.commit()
    db.refresh(settings)

    return settings


@router.post("/{child_id}", response_model=ChildSettings)
async def create_child_settings(
    child_id: str,
    settings_create: ChildSettingsCreate,
    db: Session = Depends(get_db)
):
    """
    Create settings for a child (usually called automatically on child creation)
    """
    # Find child by child_id
    child = db.query(ChildDB).filter(ChildDB.child_id == child_id).first()

    if not child:
        raise HTTPException(status_code=404, detail="Child not found")

    # Check if settings already exist
    existing_settings = db.query(ChildSettingsDB).filter(
        ChildSettingsDB.child_id == child.id
    ).first()

    if existing_settings:
        raise HTTPException(status_code=400, detail="Settings already exist for this child")

    # Create new settings
    settings = ChildSettingsDB(
        child_id=child.id,
        allowed_activities=settings_create.allowed_activities,
        session_timeout_minutes=settings_create.session_timeout_minutes,
        content_filter_level=settings_create.content_filter_level,
        enable_camera=settings_create.enable_camera,
        enable_microphone=settings_create.enable_microphone,
        quiet_hours_start=settings_create.quiet_hours_start,
        quiet_hours_end=settings_create.quiet_hours_end
    )

    db.add(settings)
    db.commit()
    db.refresh(settings)

    return settings


@router.delete("/{child_id}")
async def delete_child_settings(
    child_id: str,
    db: Session = Depends(get_db)
):
    """
    Delete settings for a child (usually done when child is deleted via cascade)
    """
    # Find child by child_id
    child = db.query(ChildDB).filter(ChildDB.child_id == child_id).first()

    if not child:
        raise HTTPException(status_code=404, detail="Child not found")

    # Get settings
    settings = db.query(ChildSettingsDB).filter(
        ChildSettingsDB.child_id == child.id
    ).first()

    if not settings:
        raise HTTPException(status_code=404, detail="Settings not found")

    db.delete(settings)
    db.commit()

    return {"message": "Settings deleted successfully"}
