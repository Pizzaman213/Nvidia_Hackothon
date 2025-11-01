"""
Child Profile Models
"""
from datetime import datetime, timezone
from typing import Optional
from pydantic import BaseModel, Field
from sqlalchemy import Column, String, DateTime, Integer
from sqlalchemy.orm import relationship
from app.database.db import Base


class ChildDB(Base):
    """Database model for child profiles"""
    __tablename__ = "children"

    id = Column(Integer, primary_key=True, index=True)
    child_id = Column(String, unique=True, index=True, nullable=False)
    parent_id = Column(String, index=True, nullable=False)
    name = Column(String, nullable=False)
    age = Column(Integer, nullable=False)
    gender = Column(String, nullable=True)  # 'boy', 'girl', or None for neutral
    avatar_color = Column(String, default="#3B82F6")  # Hex color for UI
    profile_picture_url = Column(String, nullable=True)  # URL to profile picture
    emergency_contact = Column(String, nullable=True)  # Phone number for emergencies
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    deleted_at = Column(DateTime, nullable=True)  # Soft deletion timestamp

    # Relationship to child-specific settings
    settings = relationship("ChildSettingsDB", back_populates="child", uselist=False, cascade="all, delete-orphan")


# Pydantic models for API
class ChildCreate(BaseModel):
    """Request model for creating a child profile"""
    name: str
    age: int
    gender: Optional[str] = None  # 'boy', 'girl', or None for neutral
    avatar_color: Optional[str] = "#3B82F6"
    profile_picture_url: Optional[str] = None
    emergency_contact: Optional[str] = None


class ChildUpdate(BaseModel):
    """Request model for updating a child profile"""
    name: Optional[str] = None
    age: Optional[int] = None
    gender: Optional[str] = None
    avatar_color: Optional[str] = None
    profile_picture_url: Optional[str] = None
    emergency_contact: Optional[str] = None


class ChildResponse(BaseModel):
    """Response model for child profile"""
    id: int
    child_id: str
    parent_id: str
    name: str
    age: int
    gender: Optional[str] = None
    avatar_color: str
    profile_picture_url: Optional[str] = None
    emergency_contact: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class Child(BaseModel):
    """Child profile data model"""
    child_id: str
    parent_id: str
    name: str
    age: int
    gender: Optional[str] = None
    avatar_color: str = "#3B82F6"
    profile_picture_url: Optional[str] = None
    emergency_contact: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))