# Auto-Discovery of Children Feature

## Overview

The application now automatically discovers and creates child profiles from existing sessions. This means parents don't need to manually create child profiles - the system will detect children from past sessions and create profiles for them automatically.

## How It Works

### Backend (Python/FastAPI)

**Endpoint:** `POST /api/children/parent/{parent_id}/auto-discover`

**Location:** [backend/app/api/children.py:66-128](backend/app/api/children.py#L66-L128)

**Functionality:**
1. Queries all sessions for the parent
2. Extracts unique children from sessions (by name)
3. Skips children who already have profiles
4. Creates new child profiles with:
   - Name, age, and gender from session data
   - Auto-assigned avatar colors
   - Default child settings (allowed activities, timeouts, etc.)

**Response:**
```json
{
  "discovered_count": 2,
  "children": [
    {
      "child_id": "uuid-here",
      "parent_id": "parent_123",
      "name": "Emma",
      "age": 7,
      "gender": "girl",
      "avatar_color": "#3B82F6",
      "created_at": "2025-10-31T12:00:00Z"
    }
  ]
}
```

### Frontend (React/TypeScript)

**API Service:** [frontend/src/services/api.ts:681-695](frontend/src/services/api.ts#L681-L695)

The `api.children.autoDiscover()` function calls the backend endpoint.

**Parent Context:** [frontend/src/contexts/ParentContext.tsx:76-160](frontend/src/contexts/ParentContext.tsx#L76-L160)

**Automatic Triggering:**
- Auto-discovery runs automatically when `refreshChildren()` is called
- This happens when:
  - Parent logs in (parentId is set)
  - Parent manually refreshes the children list
  - Dashboard is loaded

**Flow:**
1. Parent logs in → `setParentId()` is called
2. `useEffect` detects parentId change → calls `refreshChildren()`
3. `refreshChildren()` calls `autoDiscoverChildren()` first
4. Auto-discovery scans sessions and creates new profiles
5. Then fetches all children (including newly discovered)
6. Auto-selects first child if none selected

## Benefits

✅ **Zero Manual Setup** - Parents don't need to manually create profiles for children they've already used the app with

✅ **Seamless Migration** - Existing sessions from before the child profile system automatically create profiles

✅ **Smart Deduplication** - Only creates profiles for children who don't already have one (compares by name, case-insensitive)

✅ **Automatic** - Runs in the background without user intervention

## Testing

### Manual Test
1. Start the backend server
2. Have a child use the child interface (creates a session with child_name, child_age, child_gender)
3. Log in as a parent in the parent dashboard
4. The child profile should automatically appear in the children list

### Automated Test
Run the test script:
```bash
python test_auto_discover.py
```

This script will:
- Check for existing sessions
- Show current child profiles
- Run auto-discovery
- Display newly discovered children

## Technical Details

### Database Models

**Session:** Contains `child_name`, `child_age`, `child_gender`
- Used as source data for discovery

**Child:** Profile entity with `child_id`, `parent_id`, `name`, `age`, `gender`, etc.
- Created by auto-discovery

### Deduplication Logic

Children are matched by name (case-insensitive):
```python
existing_names = {child.name.lower() for child in existing_children}

for session in sessions:
    name_lower = session.child_name.lower()
    if name_lower not in existing_names and name_lower not in children_data:
        # Create new profile
```

### Error Handling

- Auto-discovery failures don't block the app (non-critical)
- Errors are logged but the parent dashboard continues to work
- If no sessions exist, auto-discovery simply returns 0 discovered children

## Future Enhancements

Potential improvements:
- **Smart Matching:** Use fuzzy name matching for slight variations (e.g., "Emma" vs "Ema")
- **Age Verification:** Prompt parent to confirm child details before creating profile
- **Manual Merge:** Allow parent to merge duplicate children if created with different name variants
- **Batch Discovery:** Show a summary notification when children are auto-discovered

## Configuration

No configuration needed - the feature works out of the box!

The auto-discovery runs automatically in the `ParentContext`, so all parent dashboard pages benefit from it automatically.
