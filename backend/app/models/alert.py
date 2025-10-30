"""
Safety Alert Models
"""
from datetime import datetime, timezone
from enum import Enum
from typing import Optional
from pydantic import BaseModel, Field
from sqlalchemy import Column, String, DateTime, Enum as SQLEnum, Boolean, Text, Integer
from app.database.db import Base


class AlertLevel(str, Enum):
    """Alert severity levels"""
    INFO = "info"
    WARNING = "warning"
    URGENT = "urgent"
    EMERGENCY = "emergency"


class SafetyAlertDB(Base):
    """Database model for safety alerts"""
    __tablename__ = "safety_alerts"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(String, index=True, nullable=False)
    alert_level = Column(SQLEnum(AlertLevel), nullable=False)
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    message = Column(String, nullable=False)
    context = Column(Text, nullable=True)
    ai_assessment = Column(Text, nullable=True)
    requires_action = Column(Boolean, default=False)
    parent_notified = Column(Boolean, default=False)
    resolved = Column(Boolean, default=False)


# Pydantic models for API
class AlertCreate(BaseModel):
    """Request model for creating an alert"""
    session_id: str
    alert_level: AlertLevel
    message: str
    context: Optional[str] = None
    ai_assessment: Optional[str] = None
    requires_action: bool = False


class AlertResponse(BaseModel):
    """Response model for safety alert"""
    id: int
    session_id: str
    alert_level: AlertLevel
    timestamp: datetime
    message: str
    context: Optional[str] = None
    ai_assessment: Optional[str] = None
    requires_action: bool
    parent_notified: bool
    resolved: bool

    class Config:
        from_attributes = True


class SafetyAlert(BaseModel):
    """Safety alert data model"""
    level: AlertLevel
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    message: str
    context: str
    ai_assessment: str
    requires_action: bool = False
