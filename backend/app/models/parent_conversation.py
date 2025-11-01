"""
Parent Conversation Models
Stores conversation history between parent and the AI assistant
"""
from datetime import datetime, timezone
from typing import Optional
from pydantic import BaseModel
from sqlalchemy import Column, String, DateTime, Integer, Text
from app.database.db import Base


class ParentConversationDB(Base):
    """Database model for parent-assistant conversation messages"""
    __tablename__ = "parent_conversations"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(String, index=True, nullable=False)  # Links to child session for context
    parent_id = Column(String, index=True, nullable=False)
    role = Column(String, nullable=False)  # 'parent' or 'assistant'
    content = Column(Text, nullable=False)
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    # Optional structured response data (for assistant messages)
    conversation_summary = Column(Text, nullable=True)
    key_insights = Column(Text, nullable=True)  # JSON array stored as text
    suggested_actions = Column(Text, nullable=True)  # JSON array stored as text


# Pydantic models for API
class ParentMessageCreate(BaseModel):
    """Request model for creating a parent conversation message"""
    session_id: str
    parent_id: str
    role: str  # 'parent' or 'assistant'
    content: str
    conversation_summary: Optional[str] = None
    key_insights: Optional[str] = None
    suggested_actions: Optional[str] = None


class ParentMessageResponse(BaseModel):
    """Response model for parent conversation message"""
    id: int
    session_id: str
    parent_id: str
    role: str
    content: str
    timestamp: datetime
    conversation_summary: Optional[str] = None
    key_insights: Optional[str] = None
    suggested_actions: Optional[str] = None

    class Config:
        from_attributes = True
