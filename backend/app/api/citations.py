"""
Citations API Endpoints
Provides access to source citations used in conversations
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List
from datetime import datetime

from app.database.db import get_db
from app.models.citation import CitationDB, Citation, CitationSummary
from app.utils.logger import setup_logger

logger = setup_logger(__name__)
router = APIRouter(prefix="/api/citations", tags=["citations"])


@router.get("/session/{session_id}", response_model=List[Citation])
async def get_session_citations(
    session_id: str,
    db: Session = Depends(get_db)
):
    """
    Get all citations for a specific session
    """
    logger.info(f"Fetching citations for session: {session_id}")

    citations = db.query(CitationDB).filter(
        CitationDB.session_id == session_id
    ).order_by(CitationDB.timestamp.desc()).all()

    logger.info(f"Found {len(citations)} citations for session {session_id}")

    return [Citation.from_orm(c) for c in citations]


@router.get("/session/{session_id}/summary", response_model=List[CitationSummary])
async def get_session_citations_summary(
    session_id: str,
    db: Session = Depends(get_db)
):
    """
    Get summary of citations grouped by source for a session
    """
    logger.info(f"Fetching citation summary for session: {session_id}")

    # Group by source and count usage
    results = db.query(
        CitationDB.source_type,
        CitationDB.source_title,
        CitationDB.source_url,
        func.count(CitationDB.id).label('usage_count'),
        func.max(CitationDB.timestamp).label('last_used')
    ).filter(
        CitationDB.session_id == session_id
    ).group_by(
        CitationDB.source_type,
        CitationDB.source_title,
        CitationDB.source_url
    ).all()

    summaries = []
    for result in results:
        summaries.append(CitationSummary(
            source_type=result.source_type,
            source_title=result.source_title,
            source_url=result.source_url,
            usage_count=result.usage_count,
            last_used=result.last_used
        ))

    logger.info(f"Generated {len(summaries)} citation summaries for session {session_id}")

    return summaries


@router.get("/sources", response_model=List[CitationSummary])
async def get_all_sources(
    db: Session = Depends(get_db)
):
    """
    Get all unique sources used across all sessions
    """
    logger.info("Fetching all sources")

    results = db.query(
        CitationDB.source_type,
        CitationDB.source_title,
        CitationDB.source_url,
        func.count(CitationDB.id).label('usage_count'),
        func.max(CitationDB.timestamp).label('last_used')
    ).group_by(
        CitationDB.source_type,
        CitationDB.source_title,
        CitationDB.source_url
    ).order_by(func.count(CitationDB.id).desc()).all()

    summaries = []
    for result in results:
        summaries.append(CitationSummary(
            source_type=result.source_type,
            source_title=result.source_title,
            source_url=result.source_url,
            usage_count=result.usage_count,
            last_used=result.last_used
        ))

    logger.info(f"Found {len(summaries)} unique sources")

    return summaries


@router.get("/{citation_id}", response_model=Citation)
async def get_citation(
    citation_id: int,
    db: Session = Depends(get_db)
):
    """
    Get a specific citation by ID
    """
    citation = db.query(CitationDB).filter(CitationDB.id == citation_id).first()

    if not citation:
        logger.warning(f"Citation not found: {citation_id}")
        raise HTTPException(status_code=404, detail="Citation not found")

    return Citation.from_orm(citation)
