"""
Child-specific settings model

Each child profile can have individual safety and activity settings,
allowing parents to configure different rules for each child.
"""

from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, JSON, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.database.db import Base
from pydantic import BaseModel
from typing import List, Optional


class ChildSettingsDB(Base):
    """Database model for child-specific settings"""
    __tablename__ = "child_settings"

    id = Column(Integer, primary_key=True, index=True)
    child_id = Column(Integer, ForeignKey("children.id", ondelete="CASCADE"), unique=True, nullable=False)

    # Activity permissions
    allowed_activities = Column(JSON, nullable=False, default=["story_time", "i_spy", "homework_helper", "free_chat"])

    # Safety settings
    session_timeout_minutes = Column(Integer, nullable=False, default=120)
    content_filter_level = Column(String, nullable=False, default="moderate")  # strict, moderate, relaxed

    # Device permissions
    enable_camera = Column(Boolean, nullable=False, default=True)
    enable_microphone = Column(Boolean, nullable=False, default=True)

    # Quiet hours (optional)
    quiet_hours_start = Column(String, nullable=True)  # Format: "HH:MM" (24-hour)
    quiet_hours_end = Column(String, nullable=True)    # Format: "HH:MM" (24-hour)

    # Timestamps
    created_at = Column(DateTime, nullable=False, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, nullable=False, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    # Relationship to child
    child = relationship("ChildDB", back_populates="settings")


# Pydantic models for API

class ChildSettingsBase(BaseModel):
    """Base model for child settings"""
    allowed_activities: List[str] = ["story_time", "i_spy", "homework_helper", "free_chat"]
    session_timeout_minutes: int = 120
    content_filter_level: str = "moderate"
    enable_camera: bool = True
    enable_microphone: bool = True
    quiet_hours_start: Optional[str] = None
    quiet_hours_end: Optional[str] = None


class ChildSettingsCreate(ChildSettingsBase):
    """Model for creating child settings"""
    child_id: int


class ChildSettingsUpdate(BaseModel):
    """Model for updating child settings (all fields optional)"""
    allowed_activities: Optional[List[str]] = None
    session_timeout_minutes: Optional[int] = None
    content_filter_level: Optional[str] = None
    enable_camera: Optional[bool] = None
    enable_microphone: Optional[bool] = None
    quiet_hours_start: Optional[str] = None
    quiet_hours_end: Optional[str] = None


class ChildSettings(ChildSettingsBase):
    """Model for child settings response"""
    id: int
    child_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
