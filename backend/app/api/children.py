"""
API endpoints for child profile management
"""
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Query
from sqlalchemy.orm import Session
from typing import List
import uuid
import os
import base64
from pathlib import Path

from app.database.db import get_db
from app.models.child import ChildDB, ChildCreate, ChildUpdate, ChildResponse
from app.models.child_settings import ChildSettingsDB
from app.utils.logger import setup_logger

logger = setup_logger(__name__)

router = APIRouter(prefix="/api/children", tags=["children"])


@router.post("", response_model=ChildResponse)
async def create_child(
    child_data: ChildCreate,
    parent_id: str = Query(..., description="Parent ID for the child"),
    db: Session = Depends(get_db)
):
    """
    Create a new child profile for a parent
    """
    # Generate unique child ID
    child_id = str(uuid.uuid4())

    # Create child profile
    db_child = ChildDB(
        child_id=child_id,
        parent_id=parent_id,
        name=child_data.name,
        age=child_data.age,
        gender=child_data.gender,
        avatar_color=child_data.avatar_color or "#3B82F6",
        profile_picture_url=child_data.profile_picture_url,
        emergency_contact=child_data.emergency_contact
    )

    db.add(db_child)
    db.commit()
    db.refresh(db_child)

    # Create default settings for the child
    default_settings = ChildSettingsDB(
        child_id=db_child.id,
        allowed_activities=["story_time", "i_spy", "homework_helper", "free_chat"],
        session_timeout_minutes=120,
        content_filter_level="moderate",
        enable_camera=True,
        enable_microphone=True
    )

    db.add(default_settings)
    db.commit()

    return db_child


@router.post("/parent/{parent_id}/auto-discover")
async def auto_discover_children(
    parent_id: str,
    db: Session = Depends(get_db)
):
    """
    Auto-discover children from existing sessions and create child profiles
    """
    from app.models.session import SessionDB

    # Find all unique children from sessions for this parent
    sessions = db.query(SessionDB).filter(SessionDB.parent_id == parent_id).all()

    discovered_children = []
    # Include both active and deleted children to prevent recreation
    existing_children = db.query(ChildDB).filter(ChildDB.parent_id == parent_id).all()
    existing_names = {child.name.lower() for child in existing_children}

    # Group sessions by child name
    children_data = {}
    for session in sessions:
        name_lower = session.child_name.lower()
        if name_lower not in existing_names and name_lower not in children_data:
            children_data[name_lower] = {
                'name': session.child_name,
                'age': session.child_age,
                'gender': session.child_gender
            }

    # Create child profiles for discovered children
    avatar_colors = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899", "#14B8A6", "#F97316"]

    for idx, (name_lower, data) in enumerate(children_data.items()):
        child_id = str(uuid.uuid4())
        db_child = ChildDB(
            child_id=child_id,
            parent_id=parent_id,
            name=data['name'],
            age=data['age'],
            gender=data['gender'],
            avatar_color=avatar_colors[idx % len(avatar_colors)]
        )
        db.add(db_child)
        db.commit()
        db.refresh(db_child)

        # Create default settings for discovered child
        default_settings = ChildSettingsDB(
            child_id=db_child.id,
            allowed_activities=["story_time", "i_spy", "homework_helper", "free_chat"],
            session_timeout_minutes=120,
            content_filter_level="moderate",
            enable_camera=True,
            enable_microphone=True
        )
        db.add(default_settings)
        discovered_children.append(db_child)

    db.commit()

    return {
        "discovered_count": len(discovered_children),
        "children": discovered_children
    }


@router.get("/parent/{parent_id}", response_model=List[ChildResponse])
async def get_parent_children(
    parent_id: str,
    db: Session = Depends(get_db)
):
    """
    Get all active (non-deleted) children for a parent
    """
    children = db.query(ChildDB).filter(
        ChildDB.parent_id == parent_id,
        ChildDB.deleted_at.is_(None)
    ).all()
    return children


@router.get("/{child_id}", response_model=ChildResponse)
async def get_child(
    child_id: str,
    db: Session = Depends(get_db)
):
    """
    Get a specific child profile (only if not deleted)
    """
    child = db.query(ChildDB).filter(
        ChildDB.child_id == child_id,
        ChildDB.deleted_at.is_(None)
    ).first()

    if not child:
        raise HTTPException(status_code=404, detail="Child not found")

    return child


@router.put("/{child_id}", response_model=ChildResponse)
async def update_child(
    child_id: str,
    child_data: ChildUpdate,
    db: Session = Depends(get_db)
):
    """
    Update a child profile (only if not deleted)
    """
    child = db.query(ChildDB).filter(
        ChildDB.child_id == child_id,
        ChildDB.deleted_at.is_(None)
    ).first()

    if not child:
        raise HTTPException(status_code=404, detail="Child not found")

    # Update fields if provided
    if child_data.name is not None:
        child.name = child_data.name
    if child_data.age is not None:
        child.age = child_data.age
    if child_data.gender is not None:
        child.gender = child_data.gender
    if child_data.avatar_color is not None:
        child.avatar_color = child_data.avatar_color
    if child_data.profile_picture_url is not None:
        child.profile_picture_url = child_data.profile_picture_url
    if child_data.emergency_contact is not None:
        child.emergency_contact = child_data.emergency_contact

    db.commit()
    db.refresh(child)

    return child


@router.post("/{child_id}/upload-profile-picture", response_model=ChildResponse)
async def upload_profile_picture(
    child_id: str,
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """
    Upload a profile picture for a child.
    Accepts image files and stores them as base64 data URLs.
    """
    child = db.query(ChildDB).filter(
        ChildDB.child_id == child_id,
        ChildDB.deleted_at.is_(None)
    ).first()

    if not child:
        raise HTTPException(status_code=404, detail="Child not found")

    # Validate file type
    if not file.content_type or not file.content_type.startswith('image/'):
        raise HTTPException(status_code=400, detail="File must be an image")

    # Read file content
    try:
        contents = await file.read()

        # Convert to base64 data URL
        base64_image = base64.b64encode(contents).decode('utf-8')
        data_url = f"data:{file.content_type};base64,{base64_image}"

        # Update child profile with data URL
        child.profile_picture_url = data_url

        db.commit()
        db.refresh(child)

        return child

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to upload image: {str(e)}")


@router.delete("/{child_id}")
async def delete_child(
    child_id: str,
    db: Session = Depends(get_db)
):
    """
    Soft delete a child profile (sets deleted_at timestamp)
    """
    from datetime import datetime, timezone

    child = db.query(ChildDB).filter(
        ChildDB.child_id == child_id,
        ChildDB.deleted_at.is_(None)
    ).first()

    if not child:
        raise HTTPException(status_code=404, detail="Child not found")

    # Soft delete - set deleted_at timestamp
    child.deleted_at = datetime.now(timezone.utc)
    db.commit()

    return {"message": "Child profile deleted successfully"}


@router.get("/{child_id}/sessions")
async def get_child_sessions(
    child_id: str,
    active_only: bool = False,
    db: Session = Depends(get_db)
):
    """
    Get all sessions for a specific child
    """
    from app.models.session import SessionDB

    query = db.query(SessionDB).filter(SessionDB.child_id == child_id)

    if active_only:
        query = query.filter(SessionDB.is_active == True)

    sessions = query.order_by(SessionDB.start_time.desc()).all()

    return sessions


@router.get("/{child_id}/summary")
async def get_child_summary(
    child_id: str,
    db: Session = Depends(get_db)
):
    """
    Get summary statistics for a child (only if not deleted)
    """
    from app.models.session import SessionDB
    from app.models.activity import ActivityDB
    from app.models.alert import SafetyAlertDB

    child = db.query(ChildDB).filter(
        ChildDB.child_id == child_id,
        ChildDB.deleted_at.is_(None)
    ).first()

    if not child:
        raise HTTPException(status_code=404, detail="Child not found")

    # Get session count
    total_sessions = db.query(SessionDB).filter(SessionDB.child_id == child_id).count()
    active_sessions = db.query(SessionDB).filter(
        SessionDB.child_id == child_id,
        SessionDB.is_active == True
    ).count()

    # Get activity count from sessions
    session_ids = db.query(SessionDB.session_id).filter(SessionDB.child_id == child_id).all()
    session_ids = [s[0] for s in session_ids]

    total_activities = db.query(ActivityDB).filter(
        ActivityDB.session_id.in_(session_ids)
    ).count() if session_ids else 0

    # Get alert count
    total_alerts = db.query(SafetyAlertDB).filter(
        SafetyAlertDB.session_id.in_(session_ids)
    ).count() if session_ids else 0

    unresolved_alerts = db.query(SafetyAlertDB).filter(
        SafetyAlertDB.session_id.in_(session_ids),
        SafetyAlertDB.resolved == False
    ).count() if session_ids else 0

    return {
        "child": child,
        "stats": {
            "total_sessions": total_sessions,
            "active_sessions": active_sessions,
            "total_activities": total_activities,
            "total_alerts": total_alerts,
            "unresolved_alerts": unresolved_alerts
        }
    }
