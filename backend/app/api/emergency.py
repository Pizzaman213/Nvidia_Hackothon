"""
Emergency API Endpoints
"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, timezone

from app.database.db import get_db
from app.models.alert import SafetyAlertDB, AlertLevel

router = APIRouter(prefix="/api/emergency", tags=["emergency"])


class EmergencyRequest(BaseModel):
    session_id: str
    reason: Optional[str] = "Child triggered panic button"


@router.post("")
async def trigger_emergency(request: EmergencyRequest, db: Session = Depends(get_db)):
    """
    Trigger emergency alert (panic button)
    """
    # Create emergency alert
    alert = SafetyAlertDB(
        session_id=request.session_id,
        alert_level=AlertLevel.EMERGENCY,
        message="EMERGENCY: Panic button pressed",
        context=request.reason,
        ai_assessment="Immediate parent notification required",
        requires_action=True,
        parent_notified=True
    )

    db.add(alert)
    db.commit()

    # TODO: Send immediate notification to parent via WebSocket/SMS/Email

    return {
        "success": True,
        "message": "Emergency alert triggered",
        "alert_id": alert.id
    }
