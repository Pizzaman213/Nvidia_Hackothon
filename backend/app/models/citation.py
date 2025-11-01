"""
Citation and Source Tracking Models
"""
from sqlalchemy import Column, Integer, String, DateTime, Text, Boolean
from sqlalchemy.sql import func
from datetime import datetime, timezone
from pydantic import BaseModel
from typing import Optional, List

from app.database.db import Base


class CitationDB(Base):
    """Database model for source citations"""
    __tablename__ = "citations"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(String, nullable=False, index=True)
    message_id = Column(Integer, nullable=True)  # Link to specific message

    # Source information
    source_type = Column(String, nullable=False)  # "cdc", "cpsc", "nih", etc.
    source_title = Column(String, nullable=False)
    source_url = Column(String, nullable=False)
    source_date = Column(String, nullable=True)  # Publication/update date

    # Content information
    relevant_excerpt = Column(Text, nullable=True)  # The actual text used
    page_section = Column(String, nullable=True)  # Section/chapter if applicable

    # Metadata
    timestamp = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    confidence_score = Column(Integer, default=0)  # 0-100, how relevant the source was

    # Legal compliance
    is_public_domain = Column(Boolean, default=True)
    license_type = Column(String, default="public_domain")  # "public_domain", "cc_by", etc.


class Citation(BaseModel):
    """Pydantic model for citations"""
    id: Optional[int] = None
    session_id: str
    message_id: Optional[int] = None

    source_type: str
    source_title: str
    source_url: str
    source_date: Optional[str] = None

    relevant_excerpt: Optional[str] = None
    page_section: Optional[str] = None

    timestamp: datetime
    confidence_score: int = 0

    is_public_domain: bool = True
    license_type: str = "public_domain"

    class Config:
        from_attributes = True


class CitationSummary(BaseModel):
    """Summary of citations for display"""
    source_type: str
    source_title: str
    source_url: str
    usage_count: int
    last_used: datetime


class MessageWithCitations(BaseModel):
    """Message with associated citations"""
    message_id: int
    content: str
    timestamp: datetime
    citations: List[Citation]