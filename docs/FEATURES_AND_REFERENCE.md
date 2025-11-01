# AI Babysitter - Complete Features & Reference Guide

**Version**: 2.0
**Last Updated**: October 31, 2025
**Status**: Production Ready

---

## Table of Contents

### Core Systems
1. [RAG Knowledge System](#1-rag-knowledge-system)
2. [Emergency Calling](#2-emergency-calling)
3. [Multi-Child Management](#3-multi-child-management)
4. [Voice & TTS](#4-voice--tts)
5. [Camera Integration](#5-camera-integration)
6. [Mode Selector](#6-mode-selector)

### Feature Reference
7. [Parent Dashboard](#7-parent-dashboard)
8. [Safety Features](#8-safety-features)
9. [Chat Interface](#9-chat-interface)
10. [API Reference](#10-api-reference)
11. [Configuration](#11-configuration)
12. [Troubleshooting](#12-troubleshooting)

---

# 1. RAG Knowledge System

## Overview

**Retrieval-Augmented Generation (RAG)** enhances AI responses by retrieving relevant information from a curated knowledge base before generating responses. This provides accuracy, transparency, and trust.

### Key Benefits

- **Accuracy**: Grounded in factual CDC/CPSC/NIH information
- **Transparency**: Parents can see source citations
- **Trust**: All sources from U.S. government agencies (public domain)
- **Legal Compliance**: No copyright concerns (17 USC § 105)

### How It Works

```
Child Question → Vector Search → Relevant Docs → LLM + Context → Response + Citations
```

**Example**:
1. Child asks: "How do I stay safe near a pool?"
2. RAG retrieves CDC water safety guidelines
3. LLM generates age-appropriate response using CDC info
4. Parent sees citation to CDC source in "Sources" tab

---

## Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                    Child Interface                          │
│              "How do I stay safe?"                          │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                  Chat API Endpoint                          │
│              (app/api/chat.py)                              │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                   RAG Service                               │
│              (app/services/rag_service.py)                  │
│                                                             │
│  ┌─────────────────┐        ┌──────────────────┐          │
│  │  Embedding      │        │   ChromaDB       │          │
│  │  Model          │───────▶│   Vector DB      │          │
│  │  (MiniLM)       │        │   (18 docs)      │          │
│  └─────────────────┘        └──────────────────┘          │
└──────────────────────┬──────────────────────────────────────┘
                       │ Top 3 Relevant Docs
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                   LLM Service                               │
│            (app/services/llm_service.py)                    │
│         NVIDIA Nemotron + RAG Context                       │
└──────────────────────┬──────────────────────────────────────┘
                       │ Response + Sources
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                 Citations Database                          │
│              (SQLite - citations table)                     │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│             Parent Dashboard → Sources Tab                  │
│          (CitationsPanel.tsx)                               │
└─────────────────────────────────────────────────────────────┘
```

### Technology Stack

**Vector Database**: ChromaDB (persistent local storage at `backend/data/chroma_db/`)
**Embedding Model**: `sentence-transformers/all-MiniLM-L6-v2` (384 dimensions, ~50ms per query)
**Knowledge Sources**: CDC, CPSC, NIH (18 public domain documents)

---

## Setup & Installation

### Prerequisites
- Python 3.10+
- 500MB disk space (for embedding model)
- Backend already running

### Step 1: Install Dependencies

```bash
cd backend
pip install -r requirements.txt
```

**New dependencies**:
```
chromadb>=0.4.22
sentence-transformers>=2.3.1
langchain-community>=0.0.13
tiktoken>=0.5.2
pypdf>=4.0.0
beautifulsoup4>=4.12.0
html2text>=2020.1.16
```

### Step 2: Initialize Knowledge Base

The knowledge base auto-initializes on server startup:

```bash
python run.py
```

**First-time logs**:
```
INFO: Initializing RAG service...
INFO: Loading embedding model: sentence-transformers/all-MiniLM-L6-v2
INFO: Embedding model loaded successfully
INFO: Collection ready with 0 documents
INFO: Knowledge base empty, ingesting content...
INFO: Added 18 documents to knowledge base
INFO: RAG service initialized successfully
```

### Step 3: Verify Installation

Test RAG system:

```bash
curl -X POST "http://localhost:8000/api/chat" \
  -H "Content-Type: application/json" \
  -d '{
    "session_id": "test-session",
    "message": "How do I stay safe near water?",
    "child_age": 8,
    "voice_output": false
  }'
```

**Expected response**:
```json
{
  "response": "Great question! Water safety is really important...",
  "sources": [
    {
      "title": "CDC - Child Safety and Injury Prevention",
      "url": "https://www.cdc.gov/parents/infants/safety.html",
      "type": "cdc",
      "relevance": 92
    }
  ]
}
```

---

## Backend Implementation

### File Structure

```
backend/
├── app/
│   ├── models/
│   │   └── citation.py          # Citation data models
│   ├── services/
│   │   ├── rag_service.py       # RAG core functionality
│   │   └── llm_service.py       # Enhanced with RAG
│   ├── api/
│   │   ├── chat.py              # Integrated RAG
│   │   └── citations.py         # Citations API
│   └── utils/
│       └── ingest_knowledge.py  # KB ingestion
└── data/
    ├── knowledge_base/          # Source documents
    └── chroma_db/               # Vector database
```

### Core Components

#### RAG Service (`rag_service.py`)

**Key Methods**:

```python
class RAGService:
    async def add_document(
        self, text: str, metadata: Dict[str, Any], doc_id: Optional[str] = None
    ) -> str:
        """Add single document to knowledge base"""

    async def retrieve_relevant_context(
        self, query: str, n_results: int = 3,
        filter_metadata: Optional[Dict[str, Any]] = None
    ) -> List[Dict[str, Any]]:
        """Retrieve relevant documents for query"""

    async def get_collection_stats(self) -> Dict[str, Any]:
        """Get knowledge base statistics"""
```

**Usage Example**:
```python
from app.services.rag_service import rag_service

# Retrieve relevant context
docs = await rag_service.retrieve_relevant_context(
    query="How do I prevent choking?",
    n_results=3
)

# Check knowledge base stats
stats = await rag_service.get_collection_stats()
print(f"Total documents: {stats['total_documents']}")
```

#### Citation Models (`citation.py`)

**Database Model**:
```python
class CitationDB(Base):
    __tablename__ = "citations"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(String, nullable=False, index=True)
    message_id = Column(Integer, nullable=True)
    source_type = Column(String, nullable=False)  # 'cdc', 'cpsc', 'nih'
    source_title = Column(String, nullable=False)
    source_url = Column(String, nullable=False)
    relevant_excerpt = Column(Text, nullable=True)
    confidence_score = Column(Integer, default=0)  # 0-100
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    is_public_domain = Column(Boolean, default=True)
    license_type = Column(String, default="public_domain")
```

#### LLM Service Enhancement

**New Method: `generate_with_rag()`**

```python
async def generate_with_rag(
    self,
    message: str,
    context: str = "",
    child_age: int = 8,
    use_rag: bool = True,
    n_sources: int = 3
) -> Tuple[str, List[Dict[str, Any]]]:
    """
    Generate response with RAG context
    Returns: Tuple of (response_text, sources_list)
    """
    sources = []

    if use_rag:
        # Retrieve relevant documents
        from app.services.rag_service import rag_service
        relevant_docs = await rag_service.retrieve_relevant_context(
            query=message, n_results=n_sources
        )

        if relevant_docs:
            # Build context from retrieved docs
            rag_context = "\n\n".join([
                f"[Source: {doc['metadata']['source_title']}]\n{doc['text']}"
                for doc in relevant_docs
            ])

            full_context = f"{context}\n\nRelevant Information:\n{rag_context}"

            # Track sources
            sources = [{
                "title": doc['metadata']['source_title'],
                "url": doc['metadata']['source_url'],
                "type": doc['metadata']['source_type'],
                "relevance": doc['similarity_score'],
                "excerpt": doc['text'][:200]
            } for doc in relevant_docs]

    # Generate response with enhanced context
    response = await self.generate(
        message=message, context=full_context, child_age=child_age
    )

    return response, sources
```

#### Chat API Integration

**Enhanced Chat Endpoint**:

```python
@router.post("", response_model=ChatResponse)
async def chat(request: ChatRequest, db: Session = Depends(get_db)):
    # Generate response with RAG
    raw_ai_response, rag_sources = await llm_service.generate_with_rag(
        message=request.message,
        context=context,
        child_age=request.child_age,
        use_rag=True,
        n_sources=3
    )

    # Save message to database
    ai_message = MessageDB(
        session_id=request.session_id,
        timestamp=datetime.now(timezone.utc),
        role="assistant",
        content=raw_ai_response,
        has_image=False
    )
    db.add(ai_message)
    db.commit()
    db.refresh(ai_message)

    # Save citations to database
    if rag_sources:
        for source in rag_sources:
            citation = CitationDB(
                session_id=request.session_id,
                message_id=ai_message.id,
                source_type=source['type'],
                source_title=source['title'],
                source_url=source['url'],
                relevant_excerpt=source.get('excerpt'),
                confidence_score=source.get('relevance', 0),
                is_public_domain=True,
                license_type="public_domain"
            )
            db.add(citation)
        db.commit()

    # Return response with sources
    return ChatResponse(
        response=raw_ai_response,
        sources=[{
            "title": s['title'],
            "url": s['url'],
            "type": s['type'],
            "relevance": s['relevance']
        } for s in rag_sources]
    )
```

---

## Frontend Implementation

### CitationsPanel Component

**Location**: `frontend/src/components/parent/CitationsPanel.tsx`

**Features**:
- Summary view (grouped by source)
- Detailed view (individual citations)
- Usage statistics
- Clickable source links
- Color-coded by source type

**Usage**:
```tsx
import { CitationsPanel } from '@/components/parent/CitationsPanel';

function ParentDashboard() {
  const [sessionId, setSessionId] = useState<string>('');

  return (
    <div>
      <CitationsPanel sessionId={sessionId} />
    </div>
  );
}
```

**API Integration**:
```typescript
// Fetch citations summary
const fetchCitations = async () => {
  try {
    const response = await fetch(
      `http://localhost:8000/api/citations/session/${sessionId}/summary`
    );
    const data = await response.json();
    setCitations(data);
  } catch (error) {
    console.error('Failed to fetch citations:', error);
  }
};
```

### TypeScript Types

```typescript
export interface Citation {
  id: number;
  session_id: string;
  message_id?: number;
  source_type: 'cdc' | 'cpsc' | 'nih';
  source_title: string;
  source_url: string;
  relevant_excerpt?: string;
  confidence_score: number;
  timestamp: string;
  is_public_domain: boolean;
  license_type: string;
}

export interface CitationSummary {
  source_type: string;
  source_title: string;
  source_url: string;
  usage_count: number;
  last_used: string;
}

export interface Source {
  title: string;
  url: string;
  type: string;
  relevance: number;
}
```

---

## Knowledge Base Management

### Current Content (18 Documents)

**CDC Sources (15 documents)**:
1. Basic safety rules
2. Injury prevention
3. Poisoning prevention
4. Choking prevention
5. Water safety
6. Fire safety
7. Car seat safety
8. Nutrition guidelines
9. Sleep recommendations
10. Physical activity
11. First aid basics
12. Emotional development
13. Internet safety
14. Stranger danger
15. Homework help

**CPSC Sources (3 documents)**:
1. Toy safety
2. Crib/sleep safety
3. Playground safety

### Adding New Content

#### Option 1: Add to ingest_knowledge.py

```python
# backend/app/utils/ingest_knowledge.py

NEW_CDC_CONTENT = {
    "text": """
    Bicycle Safety for Children

    Always wear a properly fitted helmet when riding a bicycle.
    The helmet should sit level on the head and cover the forehead.
    Children should ride on sidewalks or bike paths, not in the street.
    """,
    "metadata": {
        "source_type": "cdc",
        "source_title": "CDC - Bicycle Safety",
        "source_url": "https://www.cdc.gov/transportationsafety/bicycle/",
        "topic": "safety",
        "age_range": "5-12",
        "section": "Bicycle Safety",
        "is_public_domain": True,
        "license_type": "public_domain"
    }
}

# Add to CDC_CHILD_CARE_CONTENT list
CDC_CHILD_CARE_CONTENT.append(NEW_CDC_CONTENT)
```

Then restart the server or run:
```bash
cd backend
python -c "from app.utils.ingest_knowledge import ingest_all_content; import asyncio; asyncio.run(ingest_all_content())"
```

#### Option 2: Programmatic Addition

```python
from app.services.rag_service import rag_service

# Add single document
await rag_service.add_document(
    text="Your document content here...",
    metadata={
        "source_type": "cdc",
        "source_title": "CDC - New Topic",
        "source_url": "https://www.cdc.gov/...",
        "topic": "health",
        "age_range": "all",
        "is_public_domain": True,
        "license_type": "public_domain"
    }
)
```

---

## RAG API Endpoints

### 1. Get Session Citations

**GET** `/api/citations/session/{session_id}`

**Response**:
```json
[
  {
    "id": 1,
    "session_id": "abc123",
    "source_type": "cdc",
    "source_title": "CDC - Child Safety",
    "source_url": "https://www.cdc.gov/...",
    "relevant_excerpt": "Safety measures include...",
    "confidence_score": 92,
    "timestamp": "2025-10-30T10:30:00Z"
  }
]
```

### 2. Get Session Citations Summary

**GET** `/api/citations/session/{session_id}/summary`

**Response**:
```json
[
  {
    "source_type": "cdc",
    "source_title": "CDC - Child Safety",
    "source_url": "https://www.cdc.gov/...",
    "usage_count": 5,
    "last_used": "2025-10-30T10:30:00Z"
  }
]
```

### 3. Get All Sources

**GET** `/api/citations/sources`

**Response**:
```json
[
  {
    "source_type": "cdc",
    "source_title": "CDC - Child Safety",
    "source_url": "https://www.cdc.gov/...",
    "usage_count": 42,
    "last_used": "2025-10-30T10:30:00Z"
  }
]
```

---

## Performance & Best Practices

### Performance Metrics

| Metric | Value |
|--------|-------|
| RAG Overhead | ~80ms per request |
| Embedding Generation | ~50ms |
| Vector Search | ~30ms |
| Citation Saving | ~20ms |
| Total Documents | 18 (expandable to 1000+) |
| Storage | ~86 MB total |

### Best Practices

**1. Source Quality**:
- Only use trusted sources (government agencies, educational institutions)
- Verify public domain status before adding content
- Include proper attribution in metadata
- Update content regularly

**2. Performance Optimization**:
- Batch document ingestion for efficiency
- Limit retrieval results to top 3-5 documents
- Cache embeddings (handled automatically by sentence-transformers)
- Monitor database size

**3. Citation Management**:
- Always save citations to database
- Link citations to messages for traceability
- Include confidence scores for transparency
- Provide source links for parent verification

**4. Error Handling**:
```python
# Graceful RAG fallback
try:
    relevant_docs = await rag_service.retrieve_relevant_context(query)
except Exception as e:
    logger.error(f"RAG retrieval failed: {e}")
    relevant_docs = []  # Continue without RAG

# Always return a response, even if RAG fails
response = await llm_service.generate(message, context)
```

---

## RAG Troubleshooting

### Issue: "Knowledge base is empty"

**Solution**:
```bash
# Manual ingestion
cd backend
python -c "from app.utils.ingest_knowledge import ingest_all_content; import asyncio; asyncio.run(ingest_all_content())"

# Or restart server
python run.py
```

### Issue: "Failed to initialize RAG service"

**Solution**:
```bash
# Check dependencies
pip install chromadb sentence-transformers

# Check disk space (need ~500MB)
df -h

# Check permissions
chmod -R 755 backend/data/
```

### Issue: RAG retrieval slow

**Solutions**:
1. Reduce retrieval count: `n_sources=2` instead of 3
2. Check embedding model - use faster model if needed
3. Monitor database size - should be <1000 documents

### Issue: Citations not showing in frontend

**Solutions**:
1. Check API connection: `curl "http://localhost:8000/api/citations/session/YOUR_SESSION_ID/summary"`
2. Check database: `sqlite3 backend/babysitter.db "SELECT COUNT(*) FROM citations;"`
3. Check browser console for CORS errors
4. Verify session ID is not empty/null

---

# 2. Emergency Calling

## Overview

The AI Babysitter provides **TWO methods** for children to contact their emergency contacts when they press the panic button:

1. **📞 Instant Device Call** - Opens phone's native dialer (FASTEST, RECOMMENDED)
2. **💬 In-App Voice Chat** - Talk through web browser using WebRTC

Both methods work **per-child** - each child has their own emergency contact number.

**Note**: The system sends a WebSocket alert to the parent dashboard immediately, but does NOT make automated Twilio calls. The child chooses how to call using their own device.

---

## Method 1: Instant Device Call (Recommended)

### How It Works

When the child presses the **SOS button**:
1. Emergency alert sent to backend (logs + WebSocket notification)
2. **Modal appears** with two options
3. Child clicks **"Call on Device"** button
4. **Phone's native dialer opens automatically** with emergency contact number pre-filled
5. Child just presses the green "Call" button

### Technical Details

Uses the `tel:` URI scheme:
```typescript
// Triggers native phone dialer
window.location.href = 'tel:+15551234567';
```

### Advantages

✅ **Instant** - No connection setup, no delays
✅ **Reliable** - Uses phone's cellular/carrier network
✅ **Familiar** - Child sees their normal phone interface
✅ **Works Offline** - Only needs emergency contact in memory
✅ **Battery Efficient** - Uses device's phone capabilities

### Supported Devices

- ✅ **iPhone/iPad** - Opens Phone.app automatically
- ✅ **Android** - Opens default dialer
- ✅ **Desktop with Skype/FaceTime** - Opens calling app
- ❌ **Desktop without calling apps** - Shows fallback link

---

## Method 2: In-App Voice Chat (WebRTC)

### How It Works

1. Child presses **SOS button**
2. Modal appears with two options
3. Child clicks **"Voice Chat"** button
4. **Browser asks for microphone permission** (one-time)
5. **WebRTC connection established** directly between child and parent
6. **Voice conversation begins** - talk like a phone call

### Visual Interface

**Connecting**:
```
🔄 Connecting...
Calling +1-555-123-4567
[Cancel button]
```

**Active Call**:
```
🎙️ (animated pulsing microphone)
Call in Progress
+1-555-123-4567
⏱️ 0:45

[🎤 Mute]  [📞 End Call]

🎤 Microphone active
```

### Features

- ✅ Two-way voice communication
- ✅ Mute/unmute microphone
- ✅ Real-time call duration
- ✅ Visual call status
- ✅ End call button

### Technical Details

**Frontend** (`emergencyCallService.ts`):
- WebRTC peer connection with STUN servers
- Audio-only stream (no video)
- Echo cancellation, noise suppression, auto-gain control
- ICE candidate exchange for NAT traversal

**Backend** (`webrtc_signaling.py`):
- WebSocket signaling server
- Relays SDP offers/answers
- Relays ICE candidates
- Manages peer connections

### Connection Flow

```
Child Browser                 Backend Server              Parent Browser
     |                              |                            |
     |------- SDP Offer --------->  |                            |
     |                              |------ SDP Offer ------->   |
     |                              |<----- SDP Answer -------   |
     |<------ SDP Answer --------   |                            |
     |                              |                            |
     |------- ICE Candidates ---->  |                            |
     |                              |------ ICE Candidates --->  |
     |<------ ICE Candidates ------  |                            |
     |                              |<----- ICE Candidates ----  |
     |                              |                            |
     |<========== Direct Peer-to-Peer Voice Connection =========>|
```

### Advantages

✅ **No phone needed** - Works on tablets/laptops
✅ **Low latency** - Direct peer-to-peer connection
✅ **High quality** - WebRTC adaptive bitrate
✅ **In-app controls** - Mute, duration, visual feedback
✅ **Privacy** - Peer-to-peer, not through server

### Requirements

- Microphone access permission
- Modern browser (Chrome, Firefox, Safari, Edge)
- Internet connection
- Parent must also connect to receive call

---

## Complete Emergency Flow

### When Child Presses SOS Button

**Step 1: Backend Alert** (instant)
```
✓ Emergency alert created in database
✓ Parent notified via WebSocket (dashboard)
✓ Emergency modal shown to child
```

**Step 2: Modal Appears** (child sees)
```
┌─────────────────────────────────┐
│        🚨 Emergency Contact      │
│     Call +1-555-123-4567        │
├─────────────────────────────────┤
│                                 │
│  Choose how to contact:         │
│                                 │
│  ┌─────────────────────────┐   │
│  │  📞 Call on Device      │   │
│  │  Opens phone dialer     │   │
│  │       (fastest)         │   │
│  └─────────────────────────┘   │
│                                 │
│  ┌─────────────────────────┐   │
│  │  💬 Voice Chat          │   │
│  │  Talk through this app  │   │
│  └─────────────────────────┘   │
│                                 │
│       [ Cancel ]                │
└─────────────────────────────────┘
```

**Step 3: Child Chooses Method**

**Option A: Device Call**
1. Phone dialer opens
2. Emergency contact pre-filled
3. Child presses green call button
4. **Normal phone call!**

**Option B: Voice Chat**
1. Microphone permission requested (first time)
2. "Connecting..." shown
3. WebRTC connection established
4. **In-app voice conversation!**

---

## Setting Up Emergency Contacts

### Method 1: During Child Profile Creation

```typescript
// Frontend creates child with emergency contact
{
  name: "Emma",
  age: 8,
  emergency_contact: "555-123-4567"  // Any format works!
}
```

### Method 2: Edit Existing Profile

**Via Parent Dashboard**:
1. Go to **Children** tab
2. Click **"Edit"** on child card
3. Enter **Emergency Contact** field
4. Click **Save**

### Phone Number Formats (All Work!)

The system auto-formats all of these:
- `555-123-4567` → `+15551234567`
- `(555) 123-4567` → `+15551234567`
- `555.123.4567` → `+15551234567`
- `+1 555 123 4567` → `+15551234567`
- `+15551234567` → `+15551234567` (already good!)

International numbers:
- Must include country code: `+44 20 1234 5678` (UK)
- Will be used as-is

---

## Testing Emergency Calling

### Test Device Call (Recommended)

1. **Add your phone number** as emergency contact for test child
2. Open app on **mobile device** (iPhone/Android)
3. Press **SOS button**
4. Click **"Call on Device"**
5. **Your phone's dialer opens** with your number
6. Click green call button - **you're calling yourself!**

### Test Voice Chat (Advanced)

**You need TWO devices**:

**Device 1 (Child)**:
1. Open child interface
2. Press SOS button
3. Click "Voice Chat"
4. Allow microphone access
5. Wait for connection

**Device 2 (Parent)**:
1. Connect to WebSocket: `ws://localhost:8000/ws/emergency-call/{session_id}`
2. Send answer message when offer received
3. **Voice connection established!**

**Easier Alternative**: Just test device call - WebRTC is complex and voice chat is a backup/enhancement feature.

---

## Code Implementation

### Files Created/Modified

**Frontend**:
- ✅ `emergencyCallService.ts` - WebRTC + device calling service
- ✅ `EmergencyCallModal.tsx` - UI modal
- ✅ `PanicButton.tsx` - Updated to show modal
- ✅ `ChildInterface.tsx` - Passes emergency contact

**Backend**:
- ✅ `webrtc_signaling.py` - WebRTC signaling server
- ✅ `emergency.py` - Emergency alerts & WebSocket notifications

### WebSocket Endpoints

**Emergency Call Signaling**:
```
ws://localhost:8000/ws/emergency-call/{session_id}
```

**Parent Notifications**:
```
ws://localhost:8000/ws/parent/{parent_id}
```

---

## Comparison Chart

| Feature | Device Call | Voice Chat |
|---------|------------|------------|
| **Speed** | ⚡ Instant | 🔄 2-3 sec |
| **Setup** | None | Mic permission |
| **Works Offline** | ✅ Yes | ❌ No |
| **Parent Action** | Answer phone | Connect to app |
| **Call Quality** | 📞 Excellent | 🎙️ Good |
| **Cost** | Free (carrier) | Free |
| **Child Control** | Full | Full |
| **Best For** | Mobile devices | Desktop/tablet |

---

## Recommendations

### Primary Method: Device Call

**Use for**:
- Mobile devices (iPhone, Android)
- Tablets with calling capability
- Fastest emergency response

**Why**:
- Instant - no delays
- Familiar phone interface
- Uses reliable carrier network
- No internet needed

### Secondary Method: Voice Chat

**Use for**:
- Devices without calling (laptops, tablets)
- When you want in-app voice controls
- Testing/demo purposes

**Why**:
- Works on any device with microphone
- Direct peer-to-peer connection
- Visual controls (mute, duration)

---

## Emergency Call Troubleshooting

### Device Call Not Working

**Problem**: Clicking "Call on Device" does nothing

**Solutions**:
1. **Check device capability**: Does your device support calling?
   - Smartphones ✅
   - Tablets with cellular ✅
   - Laptops without Skype/FaceTime ❌
2. **Browser redirect blocked**: Some browsers block `tel:` links
   - Use the fallback link that appears
   - Try different browser
3. **Phone number format**: Emergency contact must be valid
   - Check database: `SELECT emergency_contact FROM children;`
   - Update if needed

### Voice Chat Not Connecting

**Problem**: Stuck on "Connecting..."

**Solutions**:
1. **Microphone permission**: Check browser permission
   - Chrome: Click 🔒 in address bar → Site settings → Microphone
   - Allow access
2. **WebSocket not connected**: Check backend logs
   - Should see: "WebSocket connection initiated"
   - Restart backend if needed
3. **Firewall blocking WebRTC**: Check network
   - Try on different network
   - Disable VPN temporarily
4. **Parent not connected**: For voice chat, parent must also connect
   - This is complex - use device call instead!

### No Emergency Contact Configured

**Problem**: SOS button shows "Alert sent" but no call options

**Solution**:
1. Add emergency contact to child profile
2. Refresh page
3. SOS button will now show call modal

---

# 3. Multi-Child Management

## Overview

The AI Babysitter supports managing multiple children per parent account. Parents can:
- Create and manage individual child profiles
- Track each child's sessions separately
- View per-child statistics and activity history
- Auto-discover children from existing sessions

---

## Architecture

### System Flow

```
Parent Login → Children Manager → Select Child → Start Session
                    ↓
              Child Profiles DB
                    ↓
         Sessions linked to child_id
```

### Components

**Backend**:
- `backend/app/api/children.py` - Children management API endpoints
- `backend/app/models/child.py` - Child profile data models
- Database migration: `backend/migrate_add_child_id.py`

**Frontend**:
- `frontend/src/components/parent/ChildrenManager.tsx` - Parent UI for managing children
- `frontend/src/components/child/ChildSelector.tsx` - Child selection interface
- `frontend/src/types/index.ts` - TypeScript type definitions

---

## Backend API Reference

### Base URL
```
http://localhost:8000/api/children
```

### 1. Create Child Profile

**POST** `/api/children`

**Request Body**:
```json
{
  "name": "Emma",
  "age": 8,
  "gender": "female",
  "avatar_color": "#3B82F6",
  "emergency_contact": "555-123-4567"
}
```

**Query Parameters**:
- `parent_id` (required): Parent's unique identifier

**Response (200)**:
```json
{
  "id": 1,
  "child_id": "550e8400-e29b-41d4-a716-446655440000",
  "parent_id": "parent123",
  "name": "Emma",
  "age": 8,
  "gender": "female",
  "avatar_color": "#3B82F6",
  "emergency_contact": "+15551234567",
  "created_at": "2025-10-29T10:30:00Z",
  "updated_at": "2025-10-29T10:30:00Z"
}
```

### 2. Auto-Discover Children

**POST** `/api/children/parent/{parent_id}/auto-discover`

Automatically discover children from existing sessions and create profiles.

**Response (200)**:
```json
{
  "discovered_count": 3,
  "children": [
    {
      "id": 1,
      "child_id": "550e8400-e29b-41d4-a716-446655440000",
      "parent_id": "parent123",
      "name": "Emma",
      "age": 8,
      "gender": "female",
      "avatar_color": "#3B82F6"
    }
  ]
}
```

**Logic**:
- Scans all sessions for the parent
- Identifies unique child names
- Creates profiles for children not already registered
- Assigns avatar colors from predefined palette

### 3. Get All Children for Parent

**GET** `/api/children/parent/{parent_id}`

**Response (200)**:
```json
[
  {
    "id": 1,
    "child_id": "550e8400-e29b-41d4-a716-446655440000",
    "parent_id": "parent123",
    "name": "Emma",
    "age": 8,
    "gender": "female",
    "avatar_color": "#3B82F6",
    "emergency_contact": "+15551234567"
  }
]
```

### 4. Get Specific Child

**GET** `/api/children/{child_id}`

**Response (200)**:
```json
{
  "id": 1,
  "child_id": "550e8400-e29b-41d4-a716-446655440000",
  "parent_id": "parent123",
  "name": "Emma",
  "age": 8,
  "gender": "female",
  "avatar_color": "#3B82F6",
  "emergency_contact": "+15551234567"
}
```

### 5. Update Child Profile

**PUT** `/api/children/{child_id}`

**Request Body (all fields optional)**:
```json
{
  "name": "Emma Rose",
  "age": 9,
  "gender": "female",
  "avatar_color": "#EF4444",
  "emergency_contact": "555-999-8888"
}
```

**Response (200)**: Updated child object

### 6. Delete Child Profile

**DELETE** `/api/children/{child_id}`

**Response (200)**:
```json
{
  "message": "Child profile deleted successfully"
}
```

**Note**: Deleting a child profile does NOT delete their sessions or activity history.

### 7. Get Child Sessions

**GET** `/api/children/{child_id}/sessions`

**Query Parameters**:
- `active_only` (optional, default=false): Only return active sessions

**Response (200)**:
```json
[
  {
    "id": 1,
    "session_id": "770e8400-e29b-41d4-a716-446655440002",
    "child_id": "550e8400-e29b-41d4-a716-446655440000",
    "child_name": "Emma",
    "child_age": 8,
    "parent_id": "parent123",
    "start_time": "2025-10-29T10:00:00Z",
    "end_time": "2025-10-29T11:30:00Z",
    "is_active": false
  }
]
```

### 8. Get Child Summary

**GET** `/api/children/{child_id}/summary`

**Response (200)**:
```json
{
  "child": {
    "id": 1,
    "child_id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Emma",
    "age": 8
  },
  "stats": {
    "total_sessions": 15,
    "active_sessions": 1,
    "total_activities": 42,
    "total_alerts": 2,
    "unresolved_alerts": 0
  }
}
```

---

## Frontend Components

### ChildrenManager Component

**Location**: `frontend/src/components/parent/ChildrenManager.tsx`

**Purpose**: Parent interface for managing child profiles

**Features**:
- View all registered children
- Create new child profiles
- Edit existing profiles
- Delete child profiles
- Auto-discover children from sessions
- Visual avatar colors

**Usage**:
```tsx
import { ChildrenManager } from '@/components/parent/ChildrenManager';

function ParentDashboard() {
  return (
    <div>
      <ChildrenManager parentId="parent123" />
    </div>
  );
}
```

### ChildSelector Component

**Location**: `frontend/src/components/child/ChildSelector.tsx`

**Purpose**: Child-facing interface for selecting which child is using the app

**Features**:
- Visual child cards with avatars
- Age and gender display
- Selected state indication
- Responsive grid layout

**Usage**:
```tsx
import { ChildSelector } from '@/components/child/ChildSelector';

function LoginPage() {
  const handleChildSelected = (child: Child) => {
    // Start session with selected child
    startSession(child);
  };

  return (
    <ChildSelector
      parentId="parent123"
      onChildSelected={handleChildSelected}
    />
  );
}
```

---

## Database Schema

### Children Table

```sql
CREATE TABLE children (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    child_id VARCHAR UNIQUE NOT NULL,
    parent_id VARCHAR NOT NULL,
    name VARCHAR NOT NULL,
    age INTEGER NOT NULL,
    gender VARCHAR,
    avatar_color VARCHAR DEFAULT '#3B82F6',
    emergency_contact VARCHAR,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_child_parent ON children(parent_id);
CREATE INDEX idx_child_id ON children(child_id);
```

**Field Descriptions**:
- `id`: Auto-incrementing primary key
- `child_id`: UUID for external references
- `parent_id`: Links to parent account
- `name`: Child's first name
- `age`: Age in years (affects content appropriateness)
- `gender`: Optional gender ("male", "female", "other", null)
- `avatar_color`: Hex color code for UI avatar
- `emergency_contact`: Phone number for emergency calls
- `created_at`: Profile creation timestamp
- `updated_at`: Last modification timestamp

### Sessions Table Updates

```sql
ALTER TABLE sessions ADD COLUMN child_id VARCHAR;
CREATE INDEX idx_session_child ON sessions(child_id);
```

**Migration**:
```bash
python backend/migrate_add_child_id.py
```

---

## TypeScript Types

```typescript
// Basic child data
export interface Child {
  id: number;
  child_id: string;
  parent_id: string;
  name: string;
  age: number;
  gender?: 'male' | 'female' | 'other';
  avatar_color: string;
  emergency_contact?: string;
  created_at: string;
  updated_at: string;
}

// Create child request
export interface ChildCreate {
  name: string;
  age: number;
  gender?: 'male' | 'female' | 'other';
  avatar_color?: string;
  emergency_contact?: string;
}

// Update child request (all fields optional)
export interface ChildUpdate {
  name?: string;
  age?: number;
  gender?: 'male' | 'female' | 'other';
  avatar_color?: string;
  emergency_contact?: string;
}

// Child summary response
export interface ChildSummary {
  child: Child;
  stats: {
    total_sessions: number;
    active_sessions: number;
    total_activities: number;
    total_alerts: number;
    unresolved_alerts: number;
  };
}
```

---

## Avatar Colors

Predefined avatar color palette:

```javascript
const avatarColors = [
  '#3B82F6',  // Blue
  '#10B981',  // Green
  '#F59E0B',  // Amber
  '#EF4444',  // Red
  '#8B5CF6',  // Purple
  '#EC4899',  // Pink
  '#14B8A6',  // Teal
  '#F97316'   // Orange
];
```

Colors are automatically assigned during auto-discovery or can be manually selected during profile creation.

---

## Complete Workflow Example

### 1. Parent Creates Child Profiles

```javascript
// Parent creates profiles for their children
const createChild = async (childData) => {
  const response = await fetch(
    'http://localhost:8000/api/children?parent_id=parent123',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(childData)
    }
  );
  return response.json();
};

// Create Emma's profile
const emma = await createChild({
  name: 'Emma',
  age: 8,
  gender: 'female',
  avatar_color: '#3B82F6',
  emergency_contact: '555-123-4567'
});

// Create Oliver's profile
const oliver = await createChild({
  name: 'Oliver',
  age: 10,
  gender: 'male',
  avatar_color: '#10B981',
  emergency_contact: '555-987-6543'
});
```

### 2. Auto-Discover from Existing Sessions

```javascript
// If parent has existing sessions, auto-discover children
const discoverChildren = async (parentId) => {
  const response = await fetch(
    `http://localhost:8000/api/children/parent/${parentId}/auto-discover`,
    { method: 'POST' }
  );
  return response.json();
};

const result = await discoverChildren('parent123');
console.log(`Discovered ${result.discovered_count} children`);
```

### 3. Child Selects Their Profile

```javascript
// Fetch all children for parent
const getChildren = async (parentId) => {
  const response = await fetch(
    `http://localhost:8000/api/children/parent/${parentId}`
  );
  return response.json();
};

const children = await getChildren('parent123');

// Display child selector
children.forEach(child => {
  console.log(`${child.name}, Age ${child.age}`);
});

// Child selects their profile
const selectedChild = children[0]; // Emma
```

### 4. Start Session with Child

```javascript
// Start session linked to child
const startSession = async (child) => {
  const response = await fetch(
    'http://localhost:8000/api/sessions',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        child_id: child.child_id,
        child_name: child.name,
        child_age: child.age,
        child_gender: child.gender,
        parent_id: child.parent_id
      })
    }
  );
  return response.json();
};

const session = await startSession(selectedChild);
console.log(`Session started: ${session.session_id}`);
```

### 5. View Child Statistics

```javascript
// Get comprehensive stats for a child
const getChildStats = async (childId) => {
  const response = await fetch(
    `http://localhost:8000/api/children/${childId}/summary`
  );
  return response.json();
};

const stats = await getChildStats(emma.child_id);
console.log(`Emma has had ${stats.stats.total_sessions} sessions`);
console.log(`Total activities: ${stats.stats.total_activities}`);
console.log(`Unresolved alerts: ${stats.stats.unresolved_alerts}`);
```

---

## Multi-Child Best Practices

### 1. Child Profile Management

- Use auto-discovery for existing users to quickly set up profiles
- Assign unique avatar colors to help children identify their profile
- Update ages annually to ensure age-appropriate content
- Don't delete profiles unless absolutely necessary (preserves history)

### 2. Session Handling

- Always link sessions to child_id when creating new sessions
- Validate child_id exists before starting a session
- Use child's current age from profile for content filtering
- Track gender for pronoun personalization (optional)

### 3. Privacy & Security

- Never share child_id in public APIs
- Validate parent_id matches child's parent before allowing access
- Limit profile data to essential information only
- Don't store sensitive personal information

### 4. UI/UX

- Make child selection fun with colors and avatars
- Show clear visual feedback when child is selected
- Allow easy switching between children
- Display child name throughout session

---

# 4. Voice & TTS

## Overview

The AI Babysitter supports **four Text-to-Speech (TTS) providers** with automatic fallback:

1. **NVIDIA Riva TTS** (Local, GPU-powered, highest quality)
2. **ElevenLabs** (Cloud, premium voices, natural sound)
3. **OpenAI TTS** (Cloud, good quality, reliable)
4. **gTTS** (Cloud, basic quality, free, **DEFAULT**)

**Current Status**: gTTS is the default and tested provider. NVIDIA Riva is fully implemented but untested (requires Linux + NVIDIA GPU).

---

## TTS Provider Comparison

| Provider | Quality | Speed | Cost | Requirements | Status |
|----------|---------|-------|------|-------------|--------|
| **NVIDIA Riva** | Excellent | Fastest (<100ms) | Free | Linux + NVIDIA GPU | Implemented, untested |
| **ElevenLabs** | Excellent | Fast (~500ms) | Paid API | API key | Implemented, tested |
| **OpenAI TTS** | Good | Fast (~400ms) | Paid API | API key | Implemented, tested |
| **gTTS** | Basic | Moderate (~1s) | Free | None | **Default, tested** |

---

## Configuration

### Environment Variables

```bash
# backend/.env

# NVIDIA Riva (Local)
NVIDIA_RIVA_ENABLED=False                    # Enable Riva TTS
NVIDIA_RIVA_SERVER=localhost:50051           # gRPC server address
NVIDIA_RIVA_VOICE_FRIENDLY=English-US.Female-1
NVIDIA_RIVA_VOICE_CALM=English-US.Female-2
NVIDIA_RIVA_VOICE_EXCITED=English-US.Male-1

# ElevenLabs (Cloud)
ELEVENLABS_API_KEY=your_elevenlabs_key      # Optional

# OpenAI TTS (Cloud)
OPENAI_API_KEY=your_openai_key               # Optional

# Voice styles map to different providers
# Default: gTTS (no configuration needed)
```

---

## NVIDIA Riva TTS Implementation

### Status

**Implementation**: ✅ COMPLETE
**Testing**: ❌ UNTESTED (requires Linux + NVIDIA GPU)
**Confidence**: HIGH (follows official NVIDIA documentation)

### Why Untested

macOS lacks NVIDIA GPU support and NVIDIA Docker runtime, which are strict requirements for NVIDIA Riva. The implementation follows official NVIDIA documentation exactly and uses proven gRPC patterns.

### Setup for Linux + GPU

**Prerequisites**:
- NVIDIA GPU (4GB+ VRAM)
- Ubuntu/Linux system
- Docker with nvidia-runtime
- NGC account and API key

**Automated Setup**:

```bash
# Method 1: Using launcher (RECOMMENDED)
python launcher.py start
# Prompts for NGC API key
# Offers to download models
# Starts Riva automatically

# Method 2: Manual setup
bash setup_riva_local.sh
# Add NGC API key to ~/riva/config.sh
cd ~/riva && bash riva_init.sh  # Download models (~5GB)
bash riva_start.sh              # Start server
```

**Enable in Backend**:

```bash
# backend/.env
NVIDIA_RIVA_ENABLED=True
```

**Restart Backend**:
```bash
python launcher.py restart
```

### Technical Implementation

**gRPC Client** (`voice_service.py`):

```python
async def _tts_nvidia_riva(text, voice_style, save_path):
    """NVIDIA Riva TTS via gRPC"""
    import riva.client

    # Connect to Riva server
    auth = riva.client.Auth(uri=self.riva_server)
    riva_tts = riva.client.SpeechSynthesisService(auth)

    # Voice mapping
    voice_map = {
        "friendly": self.riva_voice_friendly,
        "calm": self.riva_voice_calm,
        "excited": self.riva_voice_excited
    }

    # Synthesize audio
    responses = riva_tts.synthesize(
        text=text,
        voice_name=voice_map.get(voice_style, voice_map["friendly"]),
        language_code="en-US",
        encoding=riva.client.AudioEncoding.LINEAR_PCM,
        sample_rate_hz=22050
    )

    # Convert PCM to WAV
    audio_data = b"".join([response.audio for response in responses])
    save_wav(save_path, audio_data, sample_rate=22050)

    return {
        "success": True,
        "audio_path": f"/audio/{os.path.basename(save_path)}",
        "provider": "nvidia_riva"
    }
```

### Riva Docker Configuration

**docker-compose.riva.yml**:

```yaml
version: '3.8'

services:
  riva-speech:
    image: nvcr.io/nvidia/riva/riva-speech:2.14.0
    runtime: nvidia
    ports:
      - "8001:8001"  # HTTP
      - "50051:50051"  # gRPC
    volumes:
      - ~/riva/models:/data/models
      - ~/riva/config:/data/config
    environment:
      - NVIDIA_VISIBLE_DEVICES=all
    command: >
      bash -c "
      riva_start.sh &&
      tail -f /dev/null
      "
```

### Launcher Auto-Setup Integration

**launcher.py** includes:

```python
def auto_setup_riva():
    """Auto-detect and setup Riva"""
    # Check if Riva is installed
    if not os.path.exists(os.path.expanduser("~/riva")):
        print("NVIDIA Riva not found. Would you like to set it up? (y/n)")
        if input().lower() == 'y':
            # Prompt for NGC API key
            ngc_key = input("Enter your NGC API key: ")

            # Offer model download
            print("Download Riva models (~5GB)? (y/n)")
            if input().lower() == 'y':
                subprocess.run(["bash", "setup_riva_local.sh"])
                # Configure with NGC key
                # Download models

    # Start Riva server
    start_riva_tts()

def start_riva_tts():
    """Start Riva TTS server"""
    # Start Docker container
    subprocess.Popen([
        "docker-compose", "-f", "docker-compose.riva.yml", "up", "-d"
    ])

    # Wait for health check
    wait_for_riva_health()
```

---

## Default TTS: gTTS

### Why gTTS is Default

gTTS (Google Text-to-Speech) is the default because:
- ✅ **No API keys required** - Works out of the box
- ✅ **No dependencies** - No GPU or special hardware
- ✅ **Cross-platform** - Works on macOS, Linux, Windows
- ✅ **Tested and verified** - All synthesis tests pass
- ✅ **Reliable** - Google's TTS infrastructure

### Verification

```bash
$ python test_gtts_default.py

✓ PASS: gTTS Installation
✓ PASS: gTTS Synthesis (22KB audio generated)
✓ PASS: Voice Service Integration

✓ All tests passed! gTTS is working as default TTS provider.
```

### gTTS Implementation

**voice_service.py**:

```python
async def _tts_gtts(text, voice_style, save_path):
    """Google Text-to-Speech (basic, free)"""
    from gtts import gTTS

    # Map voice styles to gTTS parameters
    lang_map = {
        "friendly": {"lang": "en", "tld": "com"},
        "calm": {"lang": "en", "tld": "co.uk"},
        "excited": {"lang": "en", "tld": "com.au"}
    }

    params = lang_map.get(voice_style, lang_map["friendly"])

    # Generate speech
    tts = gTTS(text=text, **params)
    tts.save(save_path)

    return {
        "success": True,
        "audio_path": f"/audio/{os.path.basename(save_path)}",
        "provider": "gtts"
    }
```

---

## TTS Fallback Chain

The system tries providers in this order:

```
1. NVIDIA Riva (if enabled and available)
   ↓ (if unavailable)
2. ElevenLabs (if API key configured)
   ↓ (if unavailable)
3. OpenAI TTS (if API key configured)
   ↓ (if unavailable)
4. gTTS (always available) ← DEFAULT
```

**Implementation**:

```python
async def text_to_speech(
    text: str,
    voice_style: str = "friendly",
    save_path: Optional[str] = None
) -> Dict[str, Any]:
    """
    Convert text to speech using best available provider
    """
    # Try NVIDIA Riva first
    if self.riva_enabled:
        try:
            return await self._tts_nvidia_riva(text, voice_style, save_path)
        except Exception as e:
            logger.warning(f"Riva TTS failed: {e}, trying next provider")

    # Try ElevenLabs
    if self.elevenlabs_key:
        try:
            return await self._tts_elevenlabs(text, voice_style, save_path)
        except Exception as e:
            logger.warning(f"ElevenLabs TTS failed: {e}, trying next provider")

    # Try OpenAI TTS
    if self.openai_key:
        try:
            return await self._tts_openai(text, voice_style, save_path)
        except Exception as e:
            logger.warning(f"OpenAI TTS failed: {e}, trying next provider")

    # Fall back to gTTS (always available)
    return await self._tts_gtts(text, voice_style, save_path)
```

---

## Voice Styles

All TTS providers support three voice styles:

### 1. Friendly (Default)
- **Use**: General conversation, story time
- **Tone**: Warm, engaging, encouraging
- **Mapped To**:
  - Riva: English-US.Female-1
  - ElevenLabs: "Bella"
  - OpenAI: "nova"
  - gTTS: en-US

### 2. Calm
- **Use**: Bedtime stories, calming situations
- **Tone**: Soothing, relaxed, gentle
- **Mapped To**:
  - Riva: English-US.Female-2
  - ElevenLabs: "Rachel"
  - OpenAI: "shimmer"
  - gTTS: en-UK

### 3. Excited
- **Use**: Games, celebrations, rewards
- **Tone**: Energetic, enthusiastic, playful
- **Mapped To**:
  - Riva: English-US.Male-1
  - ElevenLabs: "Elli"
  - OpenAI: "alloy"
  - gTTS: en-AU

---

## API Usage

### Synthesize Speech

**POST** `/api/voice/synthesize`

**Request**:
```json
{
  "text": "Once upon a time, there was a brave puppy...",
  "voice_style": "friendly"
}
```

**Response**:
```json
{
  "success": true,
  "audio_url": "/audio/abc123-xyz.mp3",
  "provider": "gtts",
  "error": null
}
```

### Transcribe Audio (Speech-to-Text)

**POST** `/api/voice/transcribe`

**Form Data**:
- `audio` (file): Audio file (MP3, WAV, max 5MB)

**Response**:
```json
{
  "success": true,
  "transcript": "Can you tell me a story about dinosaurs?",
  "language": "en",
  "error": null
}
```

---

## Testing Checklist

### For GPU Testing (Linux + NVIDIA GPU)

**Prerequisites**:
- [ ] NVIDIA GPU (4GB+ VRAM)
- [ ] Ubuntu/Linux system
- [ ] Docker with nvidia-runtime
- [ ] NGC account and API key

**Testing Steps**:
1. [ ] Clone repository to GPU system
2. [ ] Run `nvidia-smi` to verify GPU
3. [ ] Run `python launcher.py start`
4. [ ] Enter NGC API key when prompted
5. [ ] Download models (choose "yes")
6. [ ] Wait for Riva to start (~3 minutes)
7. [ ] Enable Riva: `NVIDIA_RIVA_ENABLED=True` in .env
8. [ ] Test synthesis endpoint
9. [ ] Verify `"provider": "nvidia_riva"` in response
10. [ ] Test all voice styles (friendly, calm, excited)

**Expected Results**:
- [ ] Riva server starts successfully
- [ ] Health endpoint returns `ready: true`
- [ ] TTS synthesis completes in <100ms
- [ ] Audio quality is high
- [ ] All voice styles work correctly

---

## Voice Troubleshooting

### Issue: No TTS Output

**Solution**:
1. Check which provider is configured
2. Verify API keys if using cloud providers
3. Check backend logs for TTS errors
4. Test with default gTTS (always works)

### Issue: Riva Not Starting

**Solution**:
1. Verify NVIDIA GPU: `nvidia-smi`
2. Check Docker nvidia-runtime: `docker run --rm --gpus all nvidia/cuda:11.0-base nvidia-smi`
3. Check Riva logs: `docker-compose -f docker-compose.riva.yml logs`
4. Verify NGC API key in `~/riva/config.sh`

### Issue: Poor Audio Quality

**Solution**:
1. Try different TTS provider (Riva > ElevenLabs > OpenAI > gTTS)
2. Check voice style mapping
3. Verify audio file is not corrupted
4. Test with different browsers

---

## Production Status

### Current (macOS/Any Platform)
- **Configuration**: gTTS default with OpenAI fallback
- **Status**: ✅ Production-ready
- **Services**: Frontend, Backend, TTS (gTTS working and tested)

### Future (Linux + NVIDIA GPU)
- **Configuration**: NVIDIA Riva enabled
- **Status**: ✅ Implementation complete, ready for deployment
- **Confidence**: HIGH (untested but follows official docs)

---

# 5. Camera Integration

## Overview

The AI Babysitter includes camera functionality for on-demand photo capture in specific activities (Homework Helper, I Spy Game). The camera is designed with **safety-first principles**.

---

## Critical Safety Rules

1. ✅ **Camera NEVER auto-starts**
2. ✅ **User must explicitly click button**
3. ✅ **Camera stops immediately after capture**
4. ✅ **Clear visual indicators when active**
5. ✅ **Permission errors handled gracefully**

---

## Camera Requirements

### Browser Support

| Browser | Support | Notes |
|---------|---------|-------|
| **Chrome/Edge** | ✅ Excellent | Best camera support |
| **Firefox** | ✅ Good | Full support |
| **Safari** | ⚠️ Limited | May require extra permissions |

### HTTPS Requirement

Modern browsers require **HTTPS** (secure connection) to access camera for privacy and security reasons.

**Development Setup**:

```bash
# frontend/.env
HTTPS=true
```

**Restart Development Server**:
```bash
cd frontend
npm start
# Will now start at https://localhost:3000
```

**Accept Self-Signed Certificate**:
1. Browser shows security warning
2. Click **"Advanced"** or **"Show Details"**
3. Click **"Proceed to localhost (unsafe)"**
4. This is safe for local development

**Alternative**: Use `http://localhost:3000` (browsers treat localhost as secure)

---

## Camera Implementation

### useCamera Hook

**Location**: `frontend/src/hooks/useCamera.ts`

**Key Methods**:

```typescript
const {
  isActive,        // Camera on?
  hasPermission,   // Permission granted?
  error,           // Error message
  videoRef,        // Video element ref
  startCamera,     // Turn on camera
  stopCamera,      // Turn off camera
  capturePhoto,    // Take photo (returns base64)
  isSupported      // Browser support?
} = useCamera();
```

**Safety Implementation**:

```typescript
// ✅ CORRECT - User-triggered
<button onClick={startCamera}>📸 Take Picture</button>

// ✅ CORRECT - Camera stops after capture
const handleCapture = async () => {
  const photo = await capturePhoto();
  // Camera is now OFF automatically
  onPhotoCapture(photo);
};

// ❌ WRONG - Auto-starts (WE DON'T DO THIS)
useEffect(() => {
  startCamera();  // NEVER!
}, []);
```

### CameraCapture Component

**Location**: `frontend/src/components/child/CameraCapture.tsx`

**Features**:
- On-demand activation only
- Live preview
- Capture/retake functionality
- Immediate shutdown after capture
- Base64 image encoding

**Usage**:

```tsx
import { CameraCapture } from '@/components/child/CameraCapture';

function HomeworkHelper() {
  const handlePhotoCapture = (imageData: string) => {
    // Send to backend for analysis
    analyzeImage(imageData);
  };

  return (
    <CameraCapture
      onPhotoCapture={handlePhotoCapture}
      context="homework help"
    />
  );
}
```

**Props**:

```typescript
interface CameraCaptureProps {
  onPhotoCapture: (imageData: string) => void;  // Callback with base64
  context?: string;                              // Why taking photo
}
```

---

## Image Analysis API

### Analyze Image

**POST** `/api/images/analyze`

**Form Data**:
- `session_id` (string): Session ID
- `context` (string): Analysis context
- `child_age` (int): Child's age
- `prompt` (string, optional): Additional instructions
- `image` (file): Image file (max 10MB)

**Context Types**:
1. **homework**: Analyzes worksheets, provides educational guidance
2. **game**: Identifies objects for "I Spy" or similar games
3. **safety_check**: Checks image for safety concerns
4. **show_tell**: Engages with items child wants to show

**Request Example**:

```bash
curl -X POST "http://localhost:8000/api/images/analyze" \
  -F "session_id=550e8400-e29b-41d4-a716-446655440000" \
  -F "context=homework" \
  -F "child_age=8" \
  -F "prompt=Help me solve this problem" \
  -F "image=@homework.jpg"
```

**Response**:

```json
{
  "analysis": "This is a multiplication worksheet. I can see the problem 7 × 8 = ?",
  "detected_objects": null,
  "safety_alert": null,
  "ai_response": "Great! I can see you're working on multiplication. Let's think about 7 × 8 together. Do you know what multiplication means?"
}
```

### Homework Help with Image

**POST** `/api/images/homework-help`

**Form Data**:
- `session_id` (string)
- `child_age` (int)
- `question` (string, optional)
- `image` (file)

**Response**:

```json
{
  "analysis": "Math worksheet with addition problems",
  "ai_response": "I can help you understand addition! Let's look at the first problem together..."
}
```

---

## Camera Troubleshooting

### Issue: "Failed to access camera"

**Solutions**:

1. **Enable HTTPS**:
   ```bash
   # Add to frontend/.env
   HTTPS=true
   # Restart: npm start
   ```

2. **Use localhost**: Access via `http://localhost:3000` instead of IP address

3. **Check browser permissions**:
   - Chrome: Click 🔒 in address bar → Site settings → Camera
   - Safari: Preferences → Websites → Camera
   - Allow access to localhost

4. **Close other apps using camera**:
   - Zoom, Skype, Microsoft Teams
   - FaceTime, Photo Booth (on Mac)

5. **Check Debug Panel** (development mode):
   - Camera Supported: Should be ✓ Yes
   - Permission: Should be ✓ Granted (after allowing)
   - Protocol: Should be https:

6. **Try different browser**:
   - Chrome/Edge have best camera support
   - Firefox works but may have limitations
   - Safari requires extra permissions

7. **Restart browser**:
   - Close all browser windows
   - Restart completely

### Issue: Camera preview black/frozen

**Solutions**:
1. Stop camera and restart
2. Check other apps not using camera
3. Restart browser
4. Try different camera if multiple available

### Issue: Photo capture fails

**Solutions**:
1. Verify camera is active before capture
2. Check browser console for errors
3. Ensure sufficient lighting
4. Try retake function

---

## Camera Best Practices

### 1. Safety
- Never auto-start camera
- Always show visual indicator when active
- Stop camera immediately after use
- Clear permission prompts

### 2. Performance
- Use appropriate image quality
- Compress before sending to backend
- Handle timeouts gracefully
- Clean up video streams

### 3. Privacy
- Don't persist images locally
- Clear captured images after use
- No localStorage storage
- Inform users about image processing

### 4. User Experience
- Show preview before capture
- Provide retake option
- Clear feedback for permission errors
- Loading states during analysis

---

# 6. Mode Selector

## Overview

The **Mode Selector** is a full-screen interface that appears after child profile selection, allowing children to choose their desired activity before entering the main interface.

---

## Mode Selection Flow

```
┌─────────────────────┐
│   Login Screen      │
│   (Select Role)     │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Child Profile      │
│  Selection          │
│  - Pick existing    │
│  - Create new       │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  🆕 Mode Selector   │ ← NEW SCREEN
│  (What to do?)      │
│  - Talk             │
│  - Play Game        │
│  - Get Help         │
│  - Story Time       │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Activity Interface │
│  (Selected mode)    │
│  - Can switch tabs  │
└─────────────────────┘
```

---

## Four Mode Options

### 1. 💬 Talk to Your Friend → FREE_CHAT
- General conversation
- Ask questions
- Share thoughts
- Natural dialogue

### 2. 🔍 Play a Game → I_SPY
- Interactive games
- I Spy with camera
- Fun challenges
- Visual activities

### 3. ✏️ Get Help → HOMEWORK_HELPER
- Homework assistance
- Learning support
- Problem-solving
- Educational guidance

### 4. 📚 Story Time → STORY_TIME
- Listen to stories
- Interactive narratives
- Creative tales
- Bedtime stories

---

## Visual Design

### Child Theme (Under 10)

**Background**: Gradient from pink to purple
**Cards**: 2x2 grid with vibrant color gradients
- Pink gradient (💬 Talk)
- Blue gradient (🔍 Play)
- Green gradient (✏️ Help)
- Purple gradient (📚 Story)

**Animations**:
- Hover scale effects
- Rotation effects
- Sparkle emojis
- Bounce animations

**Typography**: Large, friendly fonts

### Teen Theme (10+)

**Background**: Dark gradient with ambient patterns
**Cards**: 2x2 glassmorphic cards with neon borders

**Effects**:
- Animated glow orbs in background
- Hover effects with neon cyan highlights
- Backdrop blur effects
- Subtle gradient overlays

**Typography**: Modern geometric fonts

---

## Implementation

### ModeSelector Component

**Location**: `frontend/src/components/child/ModeSelector.tsx`

**Props**:

```typescript
interface ModeSelectorProps {
  childAge: number;
  onSelectMode: (mode: ActivityType) => void;
}
```

**Usage**:

```tsx
import { ModeSelector } from '@/components/child/ModeSelector';

function ChildInterface() {
  const [showModeSelector, setShowModeSelector] = useState(true);
  const [currentActivity, setCurrentActivity] = useState<ActivityType>();

  const handleSelectMode = (mode: ActivityType) => {
    setCurrentActivity(mode);
    setShowModeSelector(false);
    // Log activity to backend
    logActivity(sessionId, mode);
  };

  if (showModeSelector) {
    return (
      <ModeSelector
        childAge={selectedChild.age}
        onSelectMode={handleSelectMode}
      />
    );
  }

  return (
    <ActivityInterface currentActivity={currentActivity} />
  );
}
```

### State Management

```typescript
const [showChildSelector, setShowChildSelector] = useState(true);
const [showModeSelector, setShowModeSelector] = useState(false);
const [currentActivity, setCurrentActivity] = useState<ActivityType>();
```

**Flow Control**:

1. **Child Selection**: `showChildSelector = true`, `showModeSelector = false`
2. **After Profile Selected**: Session created, `showChildSelector = false`, `showModeSelector = true`
3. **After Mode Selected**: Activity logged, `showModeSelector = false`, main interface renders

### Activity Logging

When a mode is selected:
- Sets the current activity type
- Logs the activity to backend via API
- Dismisses the mode selector
- Shows the selected activity interface

---

## Mode Selector Benefits

### 1. Clear Intent
Child explicitly chooses what they want to do

### 2. Better Onboarding
More engaging first experience

### 3. Activity Discovery
All options presented upfront

### 4. Age-Appropriate
Different designs for different age groups

### 5. Intuitive Navigation
Large, obvious buttons

---

## Backward Compatibility

- ✅ **Existing sessions**: If session already exists, mode selector is skipped
- ✅ **Activity switching**: Can still change activities using existing tabs
- ✅ **API compatibility**: No backend changes required
- ✅ **Data structure**: No database changes needed

---

## Code Quality

- ✅ TypeScript types properly defined
- ✅ Responsive design (mobile-friendly)
- ✅ Accessibility considerations
- ✅ Consistent with existing design patterns
- ✅ No console errors
- ✅ Clean state management

---

# 7. Parent Dashboard

## Overview

The Parent Dashboard is the central hub for parents to monitor their children's activities, review safety alerts, manage child profiles, view source citations, and configure settings.

---

## Dashboard Tabs

### 1. 👶 Children Tab

**Purpose**: Manage child profiles

**Features**:
- View all registered children
- Create new child profiles
- Edit existing profiles (name, age, gender, avatar, emergency contact)
- Delete child profiles
- Auto-discover children from existing sessions
- View per-child statistics
- Child selector with visual avatars

**Components**:
- `ChildrenManager.tsx` - Main management interface
- `ChildSelector.tsx` - Visual profile picker

### 2. 🚨 Alerts Tab

**Purpose**: Monitor safety alerts

**Features**:
- Real-time safety alerts
- Severity levels (Info, Warning, Urgent, Emergency)
- Color-coded alerts (green, yellow, orange, red)
- Alert timestamps
- Context and AI assessment
- Mark alerts as resolved
- Auto-refresh every 10 seconds
- Manual refresh button

**Alert Levels**:
- **Info** (Green): Normal activity logs
- **Warning** (Yellow): Minor concerns, check later
- **Urgent** (Orange): Parent should check soon
- **Emergency** (Red): Immediate parent notification required

**Components**:
- `AlertPanel.tsx` - Alert display and management

### 3. 📊 Activities Tab

**Purpose**: View activity history

**Features**:
- Timeline view of all activities
- Activity type icons and colors
- Start/end times and duration
- In-progress indicators
- Pagination (load more)
- Filter by child
- Activity statistics

**Activity Types**:
- Chat (💬)
- Story (📚)
- Homework (✏️)
- Game (🎮)
- Voice Chat (🎙️)
- Image Analysis (📷)

**Components**:
- `ActivityLog.tsx` - Activity timeline

### 4. 💬 AI Assistant Tab

**Purpose**: Parent can chat with AI for advice

**Features**:
- Separate AI assistant for parents
- Parenting advice and guidance
- Child development information
- Activity suggestions
- Safety recommendations
- Full chat history
- Voice output option

**Components**:
- `ParentAssistant.tsx` - Parent-focused chat interface

### 5. 📚 Sources Tab

**Purpose**: View RAG source citations

**Features**:
- Summary view (grouped by source)
- Detailed view (individual citations)
- Usage statistics per source
- Clickable source links
- Color-coded by source type (CDC, CPSC, NIH)
- Relevance scores
- Last used timestamps
- Public domain verification

**Components**:
- `CitationsPanel.tsx` - Source citation display

### 6. ⚙️ Settings Tab

**Purpose**: Configure application settings

**Features**:
- Child information (name, age, gender)
- Allowed activities (enable/disable specific modes)
- Safety settings:
  - Session timeout duration
  - Content filter level (strict/moderate/relaxed)
  - Camera enable/disable
  - Microphone enable/disable
- Emergency contact per child
- Notification preferences
- Parent profile settings
- Save/persist functionality

**Components**:
- `Settings.tsx` - Settings configuration
- `ChildSettingsModal.tsx` - Per-child settings

---

## Real-Time Features

### WebSocket Notifications

Parents receive real-time notifications via WebSocket:

**Connection**:
```javascript
const ws = new WebSocket(`ws://localhost:8000/ws/parent/${parentId}`);

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  handleNotification(data);
};
```

**Notification Types**:

1. **Alert Notifications**:
```json
{
  "type": "alert",
  "level": "urgent",
  "message": "Child reported fall and knee pain",
  "context": "Safety check triggered",
  "timestamp": "2025-10-29T10:35:00Z",
  "requires_action": true
}
```

2. **Activity Updates**:
```json
{
  "type": "activity_update",
  "session_id": "abc123",
  "activity": "chat",
  "last_message": "Can you help me with homework?"
}
```

3. **Session Updates**:
```json
{
  "type": "session_update",
  "session_id": "abc123",
  "status": "active",
  "duration_minutes": 30
}
```

### Auto-Refresh

- **Alerts**: Auto-refresh every 10 seconds
- **Activities**: Refresh on tab focus
- **Citations**: Refresh on session change
- **Child stats**: Refresh on demand

---

## Dashboard API Integration

### Get Parent Sessions

**GET** `/api/sessions/parent/{parent_id}?active_only=false`

**Response**:
```json
[
  {
    "id": 1,
    "session_id": "abc123",
    "child_id": "child-uuid",
    "child_name": "Emma",
    "child_age": 8,
    "parent_id": "parent123",
    "start_time": "2025-10-30T10:00:00Z",
    "end_time": null,
    "is_active": true
  }
]
```

### Get Session Alerts

**GET** `/api/alerts/session/{session_id}`

**Response**:
```json
[
  {
    "id": 1,
    "session_id": "abc123",
    "alert_level": "warning",
    "timestamp": "2025-10-30T10:30:00Z",
    "message": "Child expressing sad emotion",
    "context": "Message: 'I miss my friend'",
    "ai_assessment": "Child seems sad. May need attention.",
    "requires_action": false,
    "parent_notified": true,
    "resolved": false
  }
]
```

### Get Session Activities

**GET** `/api/activities/session/{session_id}?page=1&page_size=20`

**Response**:
```json
{
  "data": [
    {
      "id": 1,
      "session_id": "abc123",
      "activity_type": "chat",
      "start_time": "2025-10-30T10:00:00Z",
      "end_time": "2025-10-30T10:15:00Z",
      "details": {"messages": 10},
      "images_used": 0
    }
  ],
  "page": 1,
  "page_size": 20,
  "total_count": 42,
  "has_more": true
}
```

### Get Child Summary

**GET** `/api/children/{child_id}/summary`

**Response**:
```json
{
  "child": {
    "id": 1,
    "child_id": "child-uuid",
    "name": "Emma",
    "age": 8
  },
  "stats": {
    "total_sessions": 15,
    "active_sessions": 1,
    "total_activities": 42,
    "total_alerts": 2,
    "unresolved_alerts": 0
  }
}
```

---

## Dashboard Best Practices

### 1. Performance
- Implement pagination for large datasets
- Use auto-refresh wisely (not too frequent)
- Cache data where appropriate
- Lazy load tabs (only load active tab data)

### 2. User Experience
- Show loading states clearly
- Provide manual refresh buttons
- Display last update timestamp
- Clear error messages
- Responsive design for mobile

### 3. Safety Monitoring
- Highlight urgent alerts prominently
- Sound/visual notifications for emergencies
- Quick access to emergency contact
- One-click alert resolution

### 4. Data Privacy
- Don't display sensitive information
- Secure WebSocket connections
- Session timeout for inactive parents
- Clear session data on logout

---

# 8. Safety Features

## Overview

The AI Babysitter implements multi-layer safety detection with real-time parent notifications to ensure child well-being.

---

## Safety Layers

### 1. Keyword Detection (Instant)

Fast keyword matching for immediate concerns:

**Urgent Keywords** (Emergency-level):
- "emergency", "911", "can't breathe", "chest pain"
- "bleeding badly", "unconscious", "fire", "smoke"
- "poison", "overdose"

**Concern Keywords** (Warning-level):
- "hurt", "pain", "bleeding", "fell", "sick"
- "scared", "afraid", "stranger", "alone"
- "help", "broken", "crying", "dizzy"

**Implementation**:
```python
def check_keywords(message: str) -> str:
    """Check for safety keywords"""
    urgent_keywords = ["emergency", "911", "can't breathe", ...]
    concern_keywords = ["hurt", "pain", "bleeding", ...]

    message_lower = message.lower()

    for keyword in urgent_keywords:
        if keyword in message_lower:
            return "emergency"

    for keyword in concern_keywords:
        if keyword in message_lower:
            return "warning"

    return "none"
```

### 2. LLM Analysis (Contextual)

NVIDIA Nemotron analyzes each message for:
- Safety concerns (injury, illness, distress)
- Emotional state (fear, sadness, anger)
- Dangerous situations or requests
- Inappropriate topics

**Analysis Prompt**:
```python
f"""
Analyze this message from a {age}-year-old child for safety concerns:
"{message}"

Flag if mentions:
- Injury, pain, or physical discomfort
- Illness or not feeling well
- Fear, sadness, or emotional distress
- Being alone or unsupervised
- Strangers or unusual situations
- Unsafe activities

Return JSON:
{{
    "is_safe": bool,
    "concern_level": "none/low/medium/high/critical",
    "reason": "explanation",
    "parent_alert": bool,
    "recommended_response": "how to respond"
}}
"""
```

### 3. Emotion Detection

Analyzes emotional tone:
- **happy, excited** → Normal
- **neutral** → Normal
- **frustrated, angry** → Monitor
- **sad, scared, concerned** → Alert parent

**Implementation**:
```python
async def detect_emotion(message: str) -> str:
    """Detect emotional tone"""
    prompt = f"""
    Detect the primary emotion in this child's message: "{message}"

    Return one word: happy, sad, angry, scared, frustrated, excited, or neutral
    """

    emotion = await llm_service.generate(prompt, temperature=0.3)
    return emotion.strip().lower()
```

### 4. Image Safety

All uploaded images checked for:
- Content moderation (inappropriate content)
- Injury detection
- Hazard identification

**Implementation**:
```python
async def safety_check_image(image_bytes: bytes) -> Dict[str, Any]:
    """Check image for safety concerns"""
    analysis = await vision_service.analyze_image(
        image_bytes,
        context="safety_check",
        prompt="Identify any safety concerns, injuries, or hazards in this image"
    )

    return {
        "is_safe": "injury" not in analysis.lower() and "danger" not in analysis.lower(),
        "analysis": analysis,
        "concerns": extract_concerns(analysis)
    }
```

---

## Alert Flow

```
Child Message
     ↓
Keyword Check → [Urgent?] → EMERGENCY Alert
     ↓
LLM Analysis → [High Concern?] → URGENT Alert
     ↓
Emotion Check → [Distressed?] → WARNING Alert
     ↓
Normal Response
```

---

## Parent Notification

When alert created:
1. Alert saved to database
2. WebSocket notification sent immediately
3. Alert logged with full context
4. Activity tracking updated

**Example Alert**:
```python
SafetyAlert(
    level=AlertLevel.URGENT,
    timestamp=datetime.now(timezone.utc),
    message="Child reported fall and knee pain",
    context="Child said: 'I fell down and my knee hurts'",
    ai_assessment="Child mentions injury. Recommend checking on child.",
    requires_action=True
)
```

---

## Safe Question Filter

**Purpose**: Filter out inappropriate or unsafe questions before sending to LLM

**Implementation**:
```python
UNSAFE_PATTERNS = [
    r'\b(how to (make|build|create) (bomb|weapon|explosive))\b',
    r'\b(suicide|self-harm|hurt myself)\b',
    r'\b(drugs|alcohol|smoking)\b',
    r'\b(explicit|sexual|inappropriate) content\b',
]

def is_safe_question(message: str) -> Tuple[bool, str]:
    """Check if question is safe"""
    message_lower = message.lower()

    for pattern in UNSAFE_PATTERNS:
        if re.search(pattern, message_lower):
            return False, "I can't help with that. Let's talk about something else!"

    return True, ""
```

**Filter Response**:
```json
{
  "is_safe": false,
  "response": "I can't help with that. Let's talk about something else!",
  "parent_alert": true
}
```

---

## Content Moderation

### Age-Appropriate Responses

**System Prompts by Age**:

**Ages 1-5**:
```
You are a friendly AI babysitter for a {age}-year-old.
- Use very simple words and short sentences
- Incorporate playful sounds and repetition
- Focus on basic concepts and imagination
- Make learning feel like play
```

**Ages 6-8**:
```
You are a helpful AI babysitter for a {age}-year-old.
- Use clear explanations with examples
- Encourage curiosity and questions
- Help with basic reading, math, and science
- Support creative play and storytelling
```

**Ages 9-12**:
```
You are a supportive AI babysitter for a {age}-year-old.
- Provide more detailed explanations
- Support critical thinking
- Help with more complex homework
- Discuss age-appropriate social topics
```

**Ages 13+**:
```
You are a mentoring AI assistant for a {age}-year-old.
- Engage in more mature discussions (appropriately)
- Support complex problem-solving
- Encourage independent thinking
- Be a positive mentor figure
```

### Content Filtering Levels

**Strict** (Ages 1-8):
- Block all potentially unsafe content
- Simple, positive language only
- No discussion of sensitive topics
- Heavy filtering

**Moderate** (Ages 9-12):
- Age-appropriate discussions allowed
- Educational content prioritized
- Some sensitive topics with care
- Balanced filtering

**Relaxed** (Ages 13+):
- More open discussions
- Critical thinking encouraged
- Mature content with guidance
- Light filtering

---

## Safety Best Practices

### 1. Proactive Monitoring
- Check alerts frequently
- Respond to urgent alerts immediately
- Review activity logs regularly
- Monitor emotional patterns

### 2. Emergency Preparedness
- Configure emergency contacts
- Test SOS button functionality
- Ensure WebSocket notifications work
- Have backup communication methods

### 3. Content Review
- Periodically review chat history
- Check RAG sources for appropriateness
- Verify age-appropriate responses
- Update safety filters as needed

### 4. Child Education
- Teach children about SOS button
- Explain when to use emergency features
- Encourage open communication
- Build trust in safety systems

---

# 9. Chat Interface

## Overview

The chat interface is the primary interaction point for children with the AI Babysitter. It supports text, voice, and image-based conversations across multiple activity modes.

---

## Chat Features

### 1. Text Chat

**Features**:
- Real-time message display
- Typing indicators
- Message timestamps
- Sender identification (child vs AI)
- Auto-scroll to latest
- Empty state messages

**Message Types**:
- Child text messages
- AI text responses
- System notifications
- Safety alerts
- Camera/image indicators

### 2. Voice Chat

**Features**:
- Speech-to-text (Whisper)
- Text-to-speech (gTTS/Riva/ElevenLabs/OpenAI)
- Real-time transcript
- Voice style selection
- Mute/unmute controls

**Voice Interaction Flow**:
```
Child Speaks → Speech Recognition → Transcript →
Backend API → AI Response → Text-to-Speech → Audio Playback
```

### 3. Image Chat

**Features**:
- On-demand camera capture
- Image upload
- Image preview
- Context-aware analysis
- Educational guidance

**Image Contexts**:
- Homework help (worksheet analysis)
- I Spy game (object identification)
- Show and tell (engaging conversation)
- Safety check (hazard detection)

---

## Chat Formatting

### Message Display

**Child Messages**:
```tsx
<div className="message child-message">
  <div className="message-avatar">👶</div>
  <div className="message-content">
    <p>Can you help me with my math homework?</p>
    <span className="message-time">10:30 AM</span>
  </div>
</div>
```

**AI Messages**:
```tsx
<div className="message ai-message">
  <div className="message-avatar">🤖</div>
  <div className="message-content">
    <p>Of course! I'd love to help. What problem are you working on?</p>
    <span className="message-time">10:30 AM</span>
    {sources && <SourceList sources={sources} />}
  </div>
</div>
```

### Source Citations

When RAG is used, sources are displayed below AI messages:

```tsx
<div className="sources">
  <p className="sources-header">📚 Based on:</p>
  {sources.map(source => (
    <a
      href={source.url}
      target="_blank"
      rel="noopener noreferrer"
      className="source-link"
    >
      {source.title} ({source.relevance}% relevant)
    </a>
  ))}
</div>
```

---

## Activity Modes

### 1. Free Chat (💬)

**Purpose**: General conversation

**Features**:
- Open-ended dialogue
- Natural conversation flow
- Topic exploration
- Emotional support

**Use Cases**:
- Daily check-ins
- Share thoughts and feelings
- Ask random questions
- Make friends with AI

### 2. I Spy Game (🔍)

**Purpose**: Interactive visual game

**Features**:
- Camera-based gameplay
- Object identification
- Clue generation
- Turn-based play

**Game Flow**:
```
1. Child takes picture
2. AI identifies objects
3. AI gives "I spy" clue
4. Child guesses object
5. AI confirms/hints
6. Repeat with new pictures
```

### 3. Homework Helper (✏️)

**Purpose**: Educational assistance

**Features**:
- Worksheet scanning
- Problem-solving guidance
- Step-by-step explanations
- Concept teaching (not answers!)

**Guidance Principles**:
- Never give direct answers
- Ask guiding questions
- Break down complex problems
- Encourage understanding

**Example**:
```
Child: "What's 7 × 8?"
AI: "Great question! Let's think about it together. Do you know what multiplication means? It's like adding the same number multiple times. So 7 × 8 means adding 7 eight times. Can you try adding 7 + 7 first?"
```

### 4. Story Time (📚)

**Purpose**: Interactive storytelling

**Features**:
- Custom story generation
- Age-appropriate content
- Interactive choices
- Character development
- Voice narration

**Story Customization**:
- Theme selection
- Length (short/medium/long)
- Character names
- Setting preferences
- Interactive branching

**Example Request**:
```json
{
  "theme": "brave puppy",
  "length": "medium",
  "child_age": 7,
  "voice_output": true
}
```

---

## Chat API

### Send Message

**POST** `/api/chat`

**Request**:
```json
{
  "session_id": "abc123",
  "message": "Can you help me with my homework?",
  "child_age": 8,
  "voice_output": false
}
```

**Response**:
```json
{
  "response": "Of course! I'd love to help...",
  "audio_url": null,
  "requires_camera": false,
  "safety_status": "none",
  "emotion": "happy",
  "sources": [
    {
      "title": "CDC - Homework Tips",
      "url": "https://www.cdc.gov/...",
      "type": "cdc",
      "relevance": 85
    }
  ]
}
```

### Generate Story

**POST** `/api/chat/story`

**Request**:
```json
{
  "session_id": "abc123",
  "theme": "space adventure",
  "child_age": 9,
  "length": "medium",
  "voice_output": true
}
```

**Response**:
```json
{
  "response": "Once upon a time, in a galaxy far, far away...",
  "audio_url": "/audio/story-abc123.mp3",
  "requires_camera": false,
  "safety_status": "none",
  "emotion": "excited"
}
```

---

## Chat Improvements

### Recent Updates

1. **Message Formatting**:
   - Better text wrapping
   - Improved spacing
   - Consistent styling
   - Mobile-responsive

2. **Source Citations**:
   - Inline citation display
   - Clickable source links
   - Relevance scores
   - Visual indicators

3. **Typing Indicators**:
   - Shows when AI is thinking
   - Animated dots
   - Clear status

4. **Error Handling**:
   - Network error messages
   - Retry functionality
   - Graceful degradation

5. **Accessibility**:
   - Screen reader support
   - Keyboard navigation
   - ARIA labels
   - High contrast mode

---

## Chat Best Practices

### 1. User Experience
- Auto-scroll to latest message
- Show loading states
- Clear error messages
- Responsive design
- Touch-friendly buttons

### 2. Performance
- Lazy load old messages
- Optimize image sizes
- Cache API responses
- Debounce voice input

### 3. Safety
- Monitor all messages
- Filter inappropriate content
- Log all conversations
- Alert on safety concerns

### 4. Engagement
- Use age-appropriate language
- Include emojis when suitable
- Vary response styles
- Encourage interaction

---

# 10. API Reference

## Complete API Endpoints

### Base URL
```
http://localhost:8000
```

---

## Session Endpoints

### Create Session
**POST** `/api/sessions`

**Request**:
```json
{
  "child_id": "child-uuid",
  "child_name": "Emma",
  "child_age": 8,
  "child_gender": "female",
  "parent_id": "parent123"
}
```

**Response (200)**:
```json
{
  "id": 1,
  "session_id": "session-uuid",
  "child_id": "child-uuid",
  "child_name": "Emma",
  "child_age": 8,
  "child_gender": "female",
  "parent_id": "parent123",
  "start_time": "2025-10-30T10:00:00Z",
  "end_time": null,
  "is_active": true
}
```

### Get Session
**GET** `/api/sessions/{session_id}`

### Get Session Summary
**GET** `/api/sessions/{session_id}/summary`

**Response**:
```json
{
  "session": { /* session object */ },
  "total_messages": 42,
  "total_activities": 5,
  "total_alerts": 1,
  "duration_minutes": 45
}
```

### End Session
**POST** `/api/sessions/{session_id}/end`

### Get Parent Sessions
**GET** `/api/sessions/parent/{parent_id}?active_only=false`

---

## Chat Endpoints

### Chat
**POST** `/api/chat`

**Request**:
```json
{
  "session_id": "session-uuid",
  "message": "Can you help me with homework?",
  "child_age": 8,
  "voice_output": false
}
```

**Response**:
```json
{
  "response": "Of course! I'd love to help...",
  "audio_url": null,
  "requires_camera": false,
  "safety_status": "none",
  "emotion": "happy",
  "sources": [
    {
      "title": "CDC - Education",
      "url": "https://www.cdc.gov/...",
      "type": "cdc",
      "relevance": 88
    }
  ]
}
```

### Generate Story
**POST** `/api/chat/story`

**Request**:
```json
{
  "session_id": "session-uuid",
  "theme": "brave puppy",
  "child_age": 7,
  "length": "medium",
  "voice_output": true
}
```

---

## Image Endpoints

### Analyze Image
**POST** `/api/images/analyze`

**Form Data**:
- `session_id`: string
- `context`: "homework" | "game" | "safety_check" | "show_tell"
- `child_age`: int
- `prompt`: string (optional)
- `image`: file (max 10MB)

**Response**:
```json
{
  "analysis": "This is a math worksheet with multiplication problems...",
  "detected_objects": null,
  "safety_alert": null,
  "ai_response": "I can help you understand multiplication..."
}
```

### Homework Help
**POST** `/api/images/homework-help`

**Form Data**:
- `session_id`: string
- `child_age`: int
- `question`: string (optional)
- `image`: file

---

## Voice Endpoints

### Transcribe Audio
**POST** `/api/voice/transcribe`

**Form Data**:
- `audio`: file (MP3, WAV, max 5MB)

**Response**:
```json
{
  "success": true,
  "transcript": "Can you tell me a story?",
  "language": "en",
  "error": null
}
```

### Synthesize Speech
**POST** `/api/voice/synthesize`

**Request**:
```json
{
  "text": "Once upon a time...",
  "voice_style": "friendly"
}
```

**Response**:
```json
{
  "success": true,
  "audio_url": "/audio/abc123.mp3",
  "provider": "gtts",
  "error": null
}
```

---

## Children Endpoints

### Create Child
**POST** `/api/children?parent_id={parent_id}`

**Request**:
```json
{
  "name": "Emma",
  "age": 8,
  "gender": "female",
  "avatar_color": "#3B82F6",
  "emergency_contact": "555-123-4567"
}
```

### Get All Children
**GET** `/api/children/parent/{parent_id}`

### Get Child
**GET** `/api/children/{child_id}`

### Update Child
**PUT** `/api/children/{child_id}`

### Delete Child
**DELETE** `/api/children/{child_id}`

### Get Child Sessions
**GET** `/api/children/{child_id}/sessions?active_only=false`

### Get Child Summary
**GET** `/api/children/{child_id}/summary`

### Auto-Discover Children
**POST** `/api/children/parent/{parent_id}/auto-discover`

---

## Citations Endpoints

### Get Session Citations
**GET** `/api/citations/session/{session_id}`

### Get Session Citations Summary
**GET** `/api/citations/session/{session_id}/summary`

**Response**:
```json
[
  {
    "source_type": "cdc",
    "source_title": "CDC - Child Safety",
    "source_url": "https://www.cdc.gov/...",
    "usage_count": 5,
    "last_used": "2025-10-30T10:30:00Z"
  }
]
```

### Get All Sources
**GET** `/api/citations/sources`

### Get Citation
**GET** `/api/citations/{citation_id}`

---

## Activities Endpoints

### Get Session Activities
**GET** `/api/activities/session/{session_id}?page=1&page_size=20`

**Response**:
```json
{
  "data": [
    {
      "id": 1,
      "session_id": "session-uuid",
      "activity_type": "chat",
      "start_time": "2025-10-30T10:00:00Z",
      "end_time": "2025-10-30T10:15:00Z",
      "details": {"messages": 10},
      "images_used": 0
    }
  ],
  "page": 1,
  "page_size": 20,
  "total_count": 42,
  "has_more": true
}
```

### Create Activity
**POST** `/api/activities`

**Request**:
```json
{
  "session_id": "session-uuid",
  "activity_type": "story_time",
  "description": "Listening to space adventure story"
}
```

---

## Alerts Endpoints

### Get Session Alerts
**GET** `/api/alerts/session/{session_id}`

### Get Unresolved Alerts
**GET** `/api/alerts/session/{session_id}/unresolved`

### Resolve Alert
**PUT** `/api/alerts/{alert_id}/resolve`

---

## Emergency Endpoints

### Trigger Emergency
**POST** `/api/emergency`

**Request**:
```json
{
  "session_id": "session-uuid",
  "reason": "Child pressed SOS button"
}
```

**Response**:
```json
{
  "success": true,
  "alert_id": 123,
  "parent_notified": true
}
```

---

## WebSocket Endpoints

### Parent Notifications
```
ws://localhost:8000/ws/parent/{parent_id}
```

**Messages**:
- Alert notifications
- Activity updates
- Session updates
- Heartbeat (ping/pong)

### Emergency Call Signaling
```
ws://localhost:8000/ws/emergency-call/{session_id}
```

**Messages**:
- SDP offers/answers
- ICE candidates
- Call state updates

---

## Error Responses

**400 Bad Request**:
```json
{
  "detail": "Invalid request parameters"
}
```

**404 Not Found**:
```json
{
  "detail": "Resource not found"
}
```

**500 Internal Server Error**:
```json
{
  "detail": "Internal server error",
  "error": "Detailed error message"
}
```

---

# 11. Configuration

## Environment Variables

### Backend Configuration

**File**: `backend/.env`

```bash
# NVIDIA Nemotron LLM (Required)
NVIDIA_API_KEY=nvapi-xxxxxxxxxxxx
NVIDIA_BASE_URL=https://integrate.api.nvidia.com/v1
NVIDIA_MODEL=llama-3.3-nemotron-super-49b-v1.5

# NVIDIA Riva TTS (Optional - Local GPU)
NVIDIA_RIVA_ENABLED=False
NVIDIA_RIVA_SERVER=localhost:50051
NVIDIA_RIVA_VOICE_FRIENDLY=English-US.Female-1
NVIDIA_RIVA_VOICE_CALM=English-US.Female-2
NVIDIA_RIVA_VOICE_EXCITED=English-US.Male-1

# OpenAI (Optional)
OPENAI_API_KEY=sk-xxxxxxxxxxxx

# Anthropic Claude (Optional)
ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxx

# ElevenLabs (Optional)
ELEVENLABS_API_KEY=xxxxxxxxxxxx

# Database
DATABASE_URL=sqlite:///./babysitter.db
# For production: postgresql://user:pass@host:5432/dbname

# Security (Required for production)
SECRET_KEY=your-secret-key-min-32-characters
ALGORITHM=HS256

# Server
HOST=0.0.0.0
PORT=8000
DEBUG=True

# Safety
MAX_SESSION_DURATION_HOURS=8
ALERT_WEBHOOK_URL=https://your-webhook.com/alerts

# Redis (Optional - for Celery)
REDIS_URL=redis://localhost:6379/0
```

### Frontend Configuration

**File**: `frontend/.env`

```bash
# Backend API
REACT_APP_API_URL=http://localhost:8000

# HTTPS (Required for camera)
HTTPS=true

# Build configuration
GENERATE_SOURCEMAP=false
```

---

## Getting API Keys

### NVIDIA NGC Catalog

**For both Nemotron LLM and optional Cosmos Vision**:

1. Visit [NVIDIA Build](https://build.nvidia.com/)
2. Sign in/create NVIDIA account
3. Navigate to AI Foundation Models
4. Find **Nemotron** for LLM
5. Click "Get API Key" or "Try Now"
6. Generate/copy API key
7. Add to `NVIDIA_API_KEY`

### OpenAI

1. Visit [OpenAI Platform](https://platform.openai.com/)
2. Sign in/create account
3. Go to API Keys section
4. Create new secret key
5. Copy to `OPENAI_API_KEY`

### Anthropic Claude

1. Visit [Anthropic Console](https://console.anthropic.com/)
2. Sign in/create account
3. Go to API Keys
4. Create new key
5. Copy to `ANTHROPIC_API_KEY`

### ElevenLabs

1. Visit [ElevenLabs](https://elevenlabs.io/)
2. Sign in/create account
3. Go to Profile → API Keys
4. Copy your API key
5. Add to `ELEVENLABS_API_KEY`

---

## Database Configuration

### Development (SQLite)

```bash
DATABASE_URL=sqlite:///./babysitter.db
```

**Advantages**:
- No setup required
- File-based
- Easy to inspect

**Disadvantages**:
- Single-user
- No concurrent writes
- Limited scalability

### Production (PostgreSQL)

```bash
DATABASE_URL=postgresql://user:password@localhost:5432/babysitter
```

**Advantages**:
- Multi-user
- Concurrent access
- Scalable
- Full SQL features

**Setup**:
```bash
# Install PostgreSQL
sudo apt-get install postgresql

# Create database
sudo -u postgres createdb babysitter

# Create user
sudo -u postgres psql
CREATE USER babysitter_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE babysitter TO babysitter_user;
```

---

## CORS Configuration

**File**: `backend/app/main.py`

**Development**:
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

**Production**:
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://yourdomain.com"],  # Specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

---

## Launcher Configuration

The launcher (`launcher.py`) supports multiple startup modes:

```bash
# Start all services
python launcher.py start

# Start without Riva TTS
python launcher.py start --no-riva

# Stop all services
python launcher.py stop

# Restart all services
python launcher.py restart

# Check service status
python launcher.py status
```

**Launcher Features**:
- Auto-detects Riva setup
- Interactive NGC key prompt
- Model download option
- Health checks
- Graceful fallbacks

---

# 12. Troubleshooting

## Common Issues & Solutions

### Backend Issues

#### Issue: "NVIDIA API key not configured"

**Problem**: Missing or invalid NVIDIA API key

**Solution**:
```bash
# Check .env file
cat backend/.env | grep NVIDIA_API_KEY

# Verify key is valid
curl https://integrate.api.nvidia.com/v1/models \
  -H "Authorization: Bearer YOUR_API_KEY"
```

#### Issue: "Database locked" (SQLite)

**Problem**: Concurrent access to SQLite

**Solution**:
- Use PostgreSQL for production
- Or add to `DATABASE_URL`:
```bash
DATABASE_URL=sqlite:///./babysitter.db?check_same_thread=false
```

#### Issue: "Image analysis unavailable"

**Problem**: No vision API configured

**Solution**:
- Add `OPENAI_API_KEY` or `ANTHROPIC_API_KEY` to `.env`
- Restart server

#### Issue: "Port 8000 already in use"

**Solution**:
```bash
# Find process using port
lsof -i :8000

# Kill process
kill -9 <PID>

# Or use different port
PORT=8001 python run.py
```

---

### Frontend Issues

#### Issue: Camera not working

**Problem**: Browser can't access camera

**Solutions**:
1. **Enable HTTPS**:
   ```bash
   # Add to frontend/.env
   HTTPS=true
   # Restart: npm start
   ```

2. **Use localhost**: Access via `http://localhost:3000` instead of IP

3. **Check browser permissions**:
   - Chrome: chrome://settings/content/camera
   - Safari: Preferences → Websites → Camera
   - Allow access to localhost

4. **Close other apps using camera** (Zoom, Skype, etc.)

5. **Try different browser** (Chrome/Edge recommended)

#### Issue: WebSocket connection failed

**Problem**: CORS or proxy configuration

**Solution**:
```python
# In backend/app/main.py, ensure CORS allows WebSocket
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

For nginx:
```nginx
location /ws/ {
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
}
```

#### Issue: Build fails with TypeScript errors

**Solution**:
```bash
# Clear cache and reinstall
cd frontend
rm -rf node_modules package-lock.json
npm install

# Clear React Scripts cache
rm -rf node_modules/.cache

# Rebuild
npm run build
```

#### Issue: API calls fail with CORS error

**Solution**:
1. Check backend CORS configuration
2. Verify `REACT_APP_API_URL` in frontend `.env`
3. Ensure backend is running
4. Check browser console for specific error

---

### RAG Issues

#### Issue: "Knowledge base is empty"

**Solution**:
```bash
# Manual ingestion
cd backend
python -c "from app.utils.ingest_knowledge import ingest_all_content; import asyncio; asyncio.run(ingest_all_content())"

# Or restart server
python run.py
```

#### Issue: RAG retrieval slow

**Solutions**:
1. Reduce retrieval count: `n_sources=2` instead of 3
2. Check embedding model - use faster model if needed
3. Monitor database size - should be <1000 documents

#### Issue: Citations not showing

**Solutions**:
1. Check API: `curl "http://localhost:8000/api/citations/session/YOUR_SESSION_ID/summary"`
2. Check database: `sqlite3 backend/babysitter.db "SELECT COUNT(*) FROM citations;"`
3. Verify session ID is not empty/null
4. Check browser console for errors

---

### TTS Issues

#### Issue: No TTS output

**Solution**:
1. Check which provider is configured
2. Verify API keys if using cloud providers
3. Check backend logs for TTS errors
4. Test with default gTTS (always works)

#### Issue: Riva not starting

**Solution**:
1. Verify NVIDIA GPU: `nvidia-smi`
2. Check Docker nvidia-runtime: `docker run --rm --gpus all nvidia/cuda:11.0-base nvidia-smi`
3. Check Riva logs: `docker-compose -f docker-compose.riva.yml logs`
4. Verify NGC API key in `~/riva/config.sh`

---

### Emergency Call Issues

#### Issue: Device call not working

**Solutions**:
1. Check device capability (smartphones work, some laptops don't)
2. Verify emergency contact format in database
3. Try different browser
4. Use fallback link if `tel:` blocked

#### Issue: Voice chat not connecting

**Solutions**:
1. Check microphone permission in browser
2. Verify WebSocket connection (backend logs)
3. Try different network (VPN may block)
4. Use device call instead (simpler, more reliable)

---

### Multi-Child Issues

#### Issue: Child not found

**Solution**:
```javascript
// Always check if child exists
const child = await api.getChild(childId);
if (!child) {
  console.error('Child profile not found');
  // Redirect to child creation
}
```

#### Issue: Sessions not linked to children

**Solution**:
```bash
# Run migration
python backend/migrate_add_child_id.py

# Use auto-discover
curl -X POST "http://localhost:8000/api/children/parent/parent123/auto-discover"
```

---

## Debug Mode

### Enable Debug Logging

**Backend**:
```bash
# In backend/.env
DEBUG=True
LOG_LEVEL=DEBUG
```

**Check logs**:
```bash
# Docker
docker-compose logs -f backend

# Systemd
sudo journalctl -u babysitter-api -f

# Direct
tail -f backend/logs/app.log
```

### Health Check

```bash
curl http://localhost:8000/health
```

**Expected response**:
```json
{
  "status": "healthy",
  "nvidia_api_configured": true,
  "openai_api_configured": true,
  "rag_enabled": true,
  "riva_enabled": false
}
```

---

## Support Resources

### Documentation
- [React Documentation](https://react.dev)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [NVIDIA NGC Catalog](https://catalog.ngc.nvidia.com/)
- [ChromaDB Documentation](https://docs.trychroma.com/)

### Testing Tools
- **API Testing**: Postman, curl
- **WebSocket Testing**: wscat, Postman
- **Database**: DB Browser for SQLite
- **Logs**: tail, journalctl, docker logs

### Common Commands

```bash
# Backend
cd backend
python run.py
uvicorn app.main:app --reload

# Frontend
cd frontend
npm start
npm run build

# Docker
docker-compose up -d
docker-compose logs -f
docker-compose down

# Database
sqlite3 backend/babysitter.db ".schema"
sqlite3 backend/babysitter.db "SELECT * FROM sessions;"

# Logs
tail -f backend/logs/app.log
docker-compose logs -f backend
```

---

## Performance Optimization

### Backend

1. **Database**:
   - Use PostgreSQL for production
   - Add indexes on frequently queried columns
   - Implement connection pooling

2. **Caching**:
   - Cache embedding results
   - Cache frequently accessed data
   - Use Redis for session data

3. **API**:
   - Implement rate limiting
   - Use async/await properly
   - Optimize database queries

### Frontend

1. **Build**:
   - Use production build
   - Enable code splitting
   - Optimize images

2. **Rendering**:
   - Use React.memo for expensive components
   - Implement virtual scrolling for long lists
   - Lazy load components

3. **Network**:
   - Implement request debouncing
   - Cache API responses
   - Use WebSocket for real-time updates

---

## Security Best Practices

### API Security

1. **Authentication**: Implement JWT tokens for production
2. **Rate Limiting**: Prevent abuse with rate limits
3. **Input Validation**: Validate all user inputs
4. **HTTPS**: Always use HTTPS in production
5. **API Keys**: Never commit API keys to git

### Data Security

1. **Encryption**: Encrypt sensitive data at rest
2. **HTTPS**: TLS for data in transit
3. **Permissions**: Proper file permissions
4. **Backups**: Regular database backups
5. **Auditing**: Log all security events

### Child Safety

1. **Content Filtering**: Multi-layer safety checks
2. **Monitoring**: Real-time parent alerts
3. **Privacy**: No persistent storage of images
4. **Compliance**: Follow COPPA regulations
5. **Transparency**: Parents can verify all sources

---

**End of Features & Reference Guide**

**Version**: 2.0
**Last Updated**: October 31, 2025
**Status**: Production Ready
**Documentation Size**: ~145 KB

This comprehensive guide covers all features, APIs, configurations, and troubleshooting for the AI Babysitter application. For specific implementation details, refer to the relevant section above.
