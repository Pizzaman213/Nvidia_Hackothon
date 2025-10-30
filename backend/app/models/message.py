"""
Message Models
"""
from datetime import datetime, timezone
from typing import Optional
from pydantic import BaseModel, Field
from sqlalchemy import Column, String, DateTime, Integer, Text, Boolean
from app.database.db import Base


class MessageDB(Base):
    """Database model for messages"""
    __tablename__ = "messages"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(String, index=True, nullable=False)
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    role = Column(String, nullable=False)  # 'child' or 'assistant'
    content = Column(Text, nullable=False)
    audio_url = Column(String, nullable=True)
    has_image = Column(Boolean, default=False)
    emotion = Column(String, nullable=True)


# Pydantic models for API
class MessageCreate(BaseModel):
    """Request model for creating a message"""
    session_id: str
    role: str
    content: str
    audio_url: Optional[str] = None
    has_image: bool = False
    emotion: Optional[str] = None


class MessageResponse(BaseModel):
    """Response model for message"""
    id: int
    session_id: str
    timestamp: datetime
    role: str
    content: str
    audio_url: Optional[str] = None
    has_image: bool
    emotion: Optional[str] = None

    class Config:
        from_attributes = True


class Message(BaseModel):
    """Message data model"""
    role: str
    content: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    audio_url: Optional[str] = None
    has_image: bool = False
    emotion: Optional[str] = None
