#!/usr/bin/env python3
"""
Create test data for demonstrating auto-discovery
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from datetime import datetime, timezone
from app.database.db import SessionLocal
from app.models.session import SessionDB
import uuid

def create_test_sessions():
    """Create some test sessions with different children"""

    parent_id = "test_parent_123"

    test_sessions = [
        {
            "child_name": "Emma",
            "child_age": 7,
            "child_gender": "girl"
        },
        {
            "child_name": "Liam",
            "child_age": 5,
            "child_gender": "boy"
        },
        {
            "child_name": "Sophia",
            "child_age": 9,
            "child_gender": "girl"
        }
    ]

    print("Creating test sessions...")
    print(f"Parent ID: {parent_id}")
    print()

    db = SessionLocal()
    try:
        for session_data in test_sessions:
            session = SessionDB(
                session_id=str(uuid.uuid4()),
                parent_id=parent_id,
                child_name=session_data["child_name"],
                child_age=session_data["child_age"],
                child_gender=session_data["child_gender"],
                start_time=datetime.now(timezone.utc),
                is_active=False
            )
            db.add(session)
            print(f"  ✓ Created session for {session_data['child_name']} (age {session_data['child_age']})")

        db.commit()
    finally:
        db.close()

    print()
    print("✓ Test sessions created!")
    print()
    print("Now you can:")
    print(f"  1. Log in as parent ID: {parent_id}")
    print("  2. The children will be auto-discovered from these sessions")
    print()
    print("Or test the auto-discover endpoint directly:")
    print(f"  curl -X POST http://localhost:8000/api/children/parent/{parent_id}/auto-discover")

if __name__ == "__main__":
    create_test_sessions()
