"""
Alerts API Endpoints
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.database.db import get_db
from app.models.alert import SafetyAlertDB, AlertCreate, AlertResponse

router = APIRouter(prefix="/api/alerts", tags=["alerts"])


@router.post("", response_model=AlertResponse)
async def create_alert(request: AlertCreate, db: Session = Depends(get_db)):
    """
    Create a new safety alert
    """
    alert = SafetyAlertDB(
        session_id=request.session_id,
        alert_level=request.alert_level,
        message=request.message,
        context=request.context,
        ai_assessment=request.ai_assessment,
        requires_action=request.requires_action
    )

    db.add(alert)
    db.commit()
    db.refresh(alert)

    return AlertResponse.model_validate(alert)


@router.get("/{session_id}", response_model=List[AlertResponse])
async def get_alerts(session_id: str, db: Session = Depends(get_db)):
    """
    Get all alerts for a session
    """
    alerts = db.query(SafetyAlertDB).filter(
        SafetyAlertDB.session_id == session_id
    ).order_by(SafetyAlertDB.timestamp.desc()).all()

    return [AlertResponse.model_validate(a) for a in alerts]


@router.get("/{session_id}/unresolved", response_model=List[AlertResponse])
async def get_unresolved_alerts(session_id: str, db: Session = Depends(get_db)):
    """
    Get unresolved alerts for a session
    """
    alerts = db.query(SafetyAlertDB).filter(
        SafetyAlertDB.session_id == session_id,
        SafetyAlertDB.resolved == False
    ).order_by(SafetyAlertDB.timestamp.desc()).all()

    return [AlertResponse.model_validate(a) for a in alerts]


@router.put("/{alert_id}/resolve")
async def resolve_alert(alert_id: int, db: Session = Depends(get_db)):
    """
    Mark an alert as resolved
    """
    alert = db.query(SafetyAlertDB).filter(SafetyAlertDB.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")

    alert.resolved = True  # type: ignore[assignment]
    db.commit()

    return {"message": "Alert resolved successfully"}
