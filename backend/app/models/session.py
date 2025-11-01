"""
Session Models
"""
from datetime import datetime, timezone
from typing import Optional
from pydantic import BaseModel, Field
from sqlalchemy import Column, String, DateTime, Integer, Boolean
from app.database.db import Base


class SessionDB(Base):
    """Database model for sessions"""
    __tablename__ = "sessions"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(String, unique=True, index=True, nullable=False)
    child_id = Column(String, index=True, nullable=True)  # Links to child profile (nullable for backwards compatibility)
    child_name = Column(String, nullable=False)  # Still store for backwards compatibility
    child_age = Column(Integer, nullable=False)
    child_gender = Column(String, nullable=True)  # 'boy', 'girl', or None for neutral
    parent_id = Column(String, index=True, nullable=False)
    start_time = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    end_time = Column(DateTime, nullable=True)
    is_active = Column(Boolean, default=True)


# Pydantic models for API
class SessionCreate(BaseModel):
    """Request model for creating a session"""
    child_id: Optional[str] = None  # ID of existing child profile
    child_name: Optional[str] = None  # Used if no child_id provided
    child_age: Optional[int] = None  # Used if no child_id provided
    child_gender: Optional[str] = None  # 'boy', 'girl', or None for neutral
    parent_id: str


class SessionResponse(BaseModel):
    """Response model for session"""
    id: int
    session_id: str
    child_id: Optional[str] = None
    child_name: str
    child_age: int
    child_gender: Optional[str] = None
    parent_id: str
    start_time: datetime
    end_time: Optional[datetime] = None
    is_active: bool

    class Config:
        from_attributes = True


class Session(BaseModel):
    """Session data model"""
    session_id: str
    child_id: Optional[str] = None
    child_name: str
    child_age: int
    child_gender: Optional[str] = None
    parent_id: str
    start_time: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    end_time: Optional[datetime] = None
    is_active: bool = True
