#!/usr/bin/env python3
"""
Test script to verify auto-discovery of children from sessions
"""
import requests
from requests import HTTPError

# Configuration
BASE_URL = "http://localhost:8000"
PARENT_ID = "test_parent_123"

def test_auto_discover():
    """Test the auto-discovery endpoint"""
    print("=" * 80)
    print("Testing Auto-Discovery of Children")
    print("=" * 80)
    print()

    # First, check if we have any existing sessions for this parent
    print(f"1. Checking existing sessions for parent: {PARENT_ID}")
    try:
        response = requests.get(f"{BASE_URL}/api/sessions/parent/{PARENT_ID}")
        response.raise_for_status()
        sessions = response.json()
        print(f"   Found {len(sessions)} existing sessions")

        if sessions:
            print("\n   Sessions:")
            for session in sessions[:5]:  # Show first 5
                print(f"     - {session.get('child_name', 'N/A')} (age {session.get('child_age', 'N/A')})")
        else:
            print("\n   ⚠️  No sessions found. Auto-discovery needs existing sessions.")
            print("   Try starting a child session first using the child interface.")
            return
    except Exception as e:
        print(f"   ❌ Error fetching sessions: {e}")
        return

    print()

    # Check current children
    print(f"2. Checking current child profiles for parent: {PARENT_ID}")
    try:
        response = requests.get(f"{BASE_URL}/api/children/parent/{PARENT_ID}")
        response.raise_for_status()
        children_before = response.json()
        print(f"   Found {len(children_before)} existing child profiles")

        if children_before:
            print("\n   Existing children:")
            for child in children_before:
                print(f"     - {child.get('name', 'N/A')} (age {child.get('age', 'N/A')})")
    except Exception as e:
        print(f"   ❌ Error fetching children: {e}")
        return

    print()

    # Run auto-discovery
    print(f"3. Running auto-discovery...")
    try:
        response = requests.post(f"{BASE_URL}/api/children/parent/{PARENT_ID}/auto-discover")
        response.raise_for_status()
        result = response.json()

        print(f"   ✅ Auto-discovery complete!")
        print(f"   Discovered {result.get('discovered_count', 0)} new children")

        if result.get('discovered_count', 0) > 0:
            print("\n   Newly discovered children:")
            for child in result.get('children', []):
                print(f"     - {child.get('name', 'N/A')} (age {child.get('age', 'N/A')}, gender: {child.get('gender', 'N/A')})")
                print(f"       ID: {child.get('child_id', 'N/A')}")
                print(f"       Avatar color: {child.get('avatar_color', 'N/A')}")
        else:
            print("\n   ℹ️  No new children to discover (all children from sessions already have profiles)")
    except HTTPError as e:
        print(f"   ❌ Error during auto-discovery: {e}")
        if e.response is not None:
            print(f"   Response: {e.response.text}")
        return
    except Exception as e:
        print(f"   ❌ Error during auto-discovery: {e}")
        return

    print()

    # Check children after discovery
    print(f"4. Checking child profiles after auto-discovery...")
    try:
        response = requests.get(f"{BASE_URL}/api/children/parent/{PARENT_ID}")
        response.raise_for_status()
        children_after = response.json()
        print(f"   Found {len(children_after)} total child profiles")

        if children_after:
            print("\n   All children:")
            for child in children_after:
                print(f"     - {child.get('name', 'N/A')} (age {child.get('age', 'N/A')}, ID: {child.get('child_id', 'N/A')})")
    except Exception as e:
        print(f"   ❌ Error fetching children: {e}")
        return

    print()
    print("=" * 80)
    print("Test Complete!")
    print("=" * 80)
    print()
    print("💡 The frontend will automatically run auto-discovery whenever a parent")
    print("   logs in or refreshes the children list in the dashboard.")

if __name__ == "__main__":
    test_auto_discover()
