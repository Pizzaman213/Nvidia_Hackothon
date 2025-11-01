"""
Activity Models
"""
from datetime import datetime, timezone
from enum import Enum
from typing import Optional, Dict, Any
from pydantic import BaseModel, Field
from sqlalchemy import Column, String, DateTime, Integer, JSON
from app.database.db import Base


class ActivityType(str, Enum):
    """Types of activities"""
    STORY_TIME = "story_time"
    I_SPY = "i_spy"
    HOMEWORK_HELPER = "homework_helper"
    FREE_CHAT = "free_chat"
    # Legacy/alternative values
    STORY = "story"
    GAME = "game"
    HOMEWORK = "homework"
    CHAT = "chat"
    VOICE_CHAT = "voice_chat"
    IMAGE_ANALYSIS = "image_analysis"


class ActivityDB(Base):
    """Database model for activities"""
    __tablename__ = "activities"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(String, index=True, nullable=False)
    activity_type = Column(String, nullable=False)
    description = Column(String, nullable=True)
    start_time = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    end_time = Column(DateTime, nullable=True)
    details = Column(JSON, nullable=True)
    images_used = Column(Integer, default=0)


# Pydantic models for API
class ActivityCreate(BaseModel):
    """Request model for creating an activity"""
    session_id: str
    activity_type: ActivityType
    description: Optional[str] = None
    details: Optional[Dict[str, Any]] = None


class ActivityResponse(BaseModel):
    """Response model for activity"""
    id: int
    session_id: str
    activity_type: str
    description: Optional[str] = None
    start_time: datetime
    end_time: Optional[datetime] = None
    details: Optional[Dict[str, Any]] = None
    images_used: int

    class Config:
        from_attributes = True


class Activity(BaseModel):
    """Activity data model"""
    activity_type: ActivityType
    start_time: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    end_time: Optional[datetime] = None
    details: Dict[str, Any] = Field(default_factory=dict)
    images_used: int = 0
