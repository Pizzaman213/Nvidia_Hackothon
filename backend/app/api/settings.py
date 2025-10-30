"""
Settings API Endpoints
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional

from app.database.db import get_db

router = APIRouter(prefix="/api/settings", tags=["settings"])


# Temporary in-memory storage for settings (replace with database in production)
_settings_store = {}


class SafetySettings(BaseModel):
    allowed_activities: List[str] = ["story_time", "i_spy", "homework_helper", "free_chat"]
    quiet_hours_start: Optional[str] = None
    quiet_hours_end: Optional[str] = None
    emergency_contact: Optional[str] = None
    enable_camera: bool = True
    enable_microphone: bool = True
    session_timeout_minutes: int = 120
    content_filter_level: str = "moderate"


class NotificationPreferences(BaseModel):
    email: bool = True
    push: bool = True
    alert_threshold: str = "medium"


class ParentSettings(BaseModel):
    parent_id: str
    child_name: str = ""
    child_age: int = 8
    safety_settings: SafetySettings = SafetySettings()
    notification_preferences: NotificationPreferences = NotificationPreferences()


@router.get("/{parent_id}", response_model=ParentSettings)
async def get_settings(parent_id: str, db: Session = Depends(get_db)):
    """
    Get parent settings
    """
    # Return default settings if not found
    if parent_id not in _settings_store:
        return ParentSettings(parent_id=parent_id)

    return _settings_store[parent_id]


@router.put("/{parent_id}", response_model=ParentSettings)
async def update_settings(
    parent_id: str,
    settings: ParentSettings,
    db: Session = Depends(get_db)
):
    """
    Update parent settings
    """
    settings.parent_id = parent_id
    _settings_store[parent_id] = settings

    return settings
