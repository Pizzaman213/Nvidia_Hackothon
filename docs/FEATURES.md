# Features Documentation

Complete reference for all AI Babysitter features with examples and technical details.

---

## Table of Contents

- [Child Features](#child-features)
- [Parent Features](#parent-features)
- [Babysitter Features](#babysitter-features)
- [AI & ML Features](#ai--ml-features)
- [Safety Features](#safety-features)
- [Integration Features](#integration-features)

---

## Child Features

### 1. Interactive Chat

**Description:** Natural conversation with AI assistant

**How it works:**
- Child types or speaks messages
- AI responds with age-appropriate answers
- Conversation flows naturally with context
- Supports follow-up questions

**Capabilities:**
- Answer factual questions
- Explain concepts simply
- Tell jokes and play word games
- Provide encouragement
- Detect emotions

**Technical Details:**
- Model: NVIDIA Nemotron (Llama 3.3 Super 49B)
- Context: Last 5 messages
- Temperature: 0.7 (balanced creativity)
- Response time: 1-3 seconds

**Example Conversations:**

```
Child: "Why is the sky blue?"
AI: "Great question! The sky looks blue because of something called
scattering. When sunlight enters our atmosphere, it hits tiny molecules
in the air. Blue light scatters more than other colors, so when you
look up, you see blue everywhere! It's like blue light is bouncing
around all over the sky."

Child: "What about at sunset?"
AI: "At sunset, the sun is lower, so light travels through more
atmosphere. More blue light gets scattered away, leaving reds and
oranges to create those beautiful sunsets you see!"
```

**API Endpoint:** `POST /api/chat`

---

### 2. Story Time Mode

**Description:** AI-generated custom stories

**Features:**
- Age-appropriate content
- Custom themes (animals, adventure, space, etc.)
- Adjustable length (short, medium, long)
- Audio narration available
- Educational themes

**How it works:**
1. Child selects "Story Time"
2. Optionally requests theme ("Tell me a story about dinosaurs")
3. AI generates unique story
4. Can be read aloud with TTS

**Story Characteristics:**
- **Ages 3-5:** Simple language, clear morals, happy endings
- **Ages 6-8:** Longer stories, mild conflict, problem-solving
- **Ages 9-12:** Complex plots, character development, educational themes
- **Ages 13+:** Sophisticated narratives, real-world connections

**Example Request:**

```
Child: "Tell me a short story about a brave little robot"
AI: [Generates a 300-word story about a robot who overcomes fear
to help a friend, with themes of courage and friendship]
```

**Technical Details:**
- Endpoint: `POST /api/chat/story`
- Parameters: `theme` (optional), `length` (short/medium/long)
- Audio: Automatic TTS generation

---

### 3. Homework Helper

**Description:** Educational assistance using camera and AI

**How it works:**
1. Child clicks camera button
2. Takes picture of homework
3. Asks specific questions
4. AI analyzes image and provides guided help

**What it helps with:**
- **Math:** Explains steps, doesn't give answers
- **Reading:** Comprehension questions, vocabulary
- **Science:** Concept explanations, experiment guidance
- **Writing:** Brainstorming, structure, grammar

**Philosophy:** Guide learning, don't do the work

**Example Workflow:**

```
Child: [Takes picture of math worksheet]
Child: "I don't understand problem 3"

AI: "I can see problem 3 is about multiplying fractions. Let's break
it down step by step:

1. First, look at the two fractions you're multiplying
2. What do you notice about the top numbers (numerators)?
3. What do you notice about the bottom numbers (denominators)?

Let me know what you see, and I'll guide you through it!"
```

**Safety Features:**
- Image analysis for inappropriate content
- Alerts parent if concerning content detected
- Only processes educational content

**Technical Details:**
- Vision Model: NVIDIA Cosmos Vision (Llama 3.2 11B Vision)
- Fallback: OpenAI Vision, Claude Vision
- Max image size: 5MB
- Supported formats: JPG, PNG, WEBP

**API Endpoint:** `POST /api/images/analyze`

---

### 4. I Spy Game

**Description:** Interactive visual game using camera

**How it works:**
1. Child takes picture of surroundings
2. AI identifies objects in the image
3. Gives clues: "I spy something red..."
4. Child guesses
5. AI confirms and asks new questions

**Educational Benefits:**
- Visual observation skills
- Object recognition
- Color and shape learning
- Descriptive language

**Example Game:**

```
Child: [Takes picture of bedroom]

AI: "Great picture! I can see lots of fun things. Let's play I Spy!

I spy with my little eye... something soft and cuddly on your bed.
What could it be?"

Child: "My teddy bear!"

AI: "That's right! Your teddy bear looks so cozy. Now you try -
pick something in the picture and give me a clue!"
```

**Technical Details:**
- Object detection: NVIDIA Cosmos Vision
- Clue generation: NVIDIA Nemotron LLM
- Interactive conversation flow

---

### 5. Free Chat Mode

**Description:** Open-ended conversation on any topic

**What children can do:**
- Ask questions about anything
- Share thoughts and feelings
- Play word games
- Learn new things
- Express creativity

**Safety Monitoring:**
- All messages analyzed for safety
- Concerning content triggers alerts
- Age-appropriate filtering
- No inappropriate responses

**Example Topics:**
- Science and nature
- Space and astronomy
- Animals and pets
- Books and stories
- Hobbies and interests
- Feelings and emotions
- School and friends

**Content Filtering:**
- **Strict (Ages 3-7):** Very simple language, only safe topics
- **Moderate (Ages 8-12):** Age-appropriate complexity, guided discussions
- **Relaxed (Ages 13+):** More mature topics with education focus

---

### 6. Voice Features

#### Speech-to-Text (STT)

**Description:** Speak naturally instead of typing

**How it works:**
1. Click microphone button
2. Speak your message
3. AI converts speech to text
4. Message sent automatically

**Technology:** OpenAI Whisper
- Accuracy: 95%+ for clear speech
- Language: English (default), multi-language support
- Noise handling: Good background noise filtering

**Best Practices:**
- Speak clearly and at normal pace
- Reduce background noise
- Use in quiet environment

#### Text-to-Speech (TTS)

**Description:** Hear AI responses read aloud

**How it works:**
- Click speaker icon on any message
- AI reads response with natural voice
- Adjustable voice styles (friendly, calm, excited)

**Voice Options:**
1. **ElevenLabs** (premium) - Most natural
2. **OpenAI TTS** - High quality
3. **gTTS** (free) - Reliable fallback

**Use Cases:**
- Story time (immersive)
- Homework help (easier to understand)
- Young children (can't read well yet)
- Accessibility

---

### 7. Emergency Button

**Description:** One-tap emergency alert

**When to use:**
- Physical injury
- Illness or pain
- Feeling scared
- Dangerous situation
- Need adult immediately

**What happens:**
1. Child clicks big red "Emergency" button
2. Instant EMERGENCY-level alert created
3. Parent gets immediate notification (WebSocket)
4. Emergency contact option presented
5. Conversation context saved for parent

**Important:** Only for real emergencies!

**Technical Details:**
- Priority: Highest
- Notification: Instant (< 1 second)
- Works even without active session
- Endpoint: `POST /api/emergency`

---

## Parent Features

### 1. Child Profile Management

**Create Profiles:**
- Name, age, gender
- Emergency contact phone
- Profile picture
- Custom settings

**Auto-Discovery:**
- Scans existing sessions
- Creates profiles for unique children
- One-click profile creation
- Prevents duplicates

**Edit Profiles:**
- Update any information
- Change settings
- Upload new pictures
- Archive/delete profiles (soft delete)

**Per-Child Settings:**
- Allowed activities
- Content filter level
- Session timeout
- Camera/microphone permissions
- Quiet hours

**API Endpoints:**
- `POST /api/children` - Create child
- `GET /api/children/parent/{parent_id}` - List children
- `PUT /api/children/{child_id}` - Update child
- `DELETE /api/children/{child_id}` - Delete child
- `POST /api/children/parent/{parent_id}/auto-discover` - Auto-discover

---

### 2. Real-Time Monitoring

**Conversation Feed:**
- See all messages as they happen
- Real-time updates via WebSocket
- Fallback: 10-second polling
- Full conversation history

**What you see:**
- Child messages
- AI responses
- Timestamps
- Activity changes
- Images captured
- AI reasoning (thinking tags)

**Privacy Balance:**
- Transparency for safety
- Respect child's learning space
- Review option (not constant surveillance)

**WebSocket Endpoint:** `WS /ws/parent/{parent_id}`

---

### 3. Safety Alerts System

**Alert Levels:**

**INFO (Blue):**
- Informational only
- Example: "Child started new activity"
- No action needed

**WARNING (Yellow):**
- Minor concern
- Example: "Child mentioned feeling sad"
- Monitor situation

**URGENT (Orange):**
- Requires attention
- Example: "Child said they got hurt"
- Check on child soon

**EMERGENCY (Red):**
- Immediate action required
- Example: "Emergency button pressed"
- Respond immediately

**Alert Information:**
- Full context
- AI assessment
- Severity level
- Timestamp
- Recommended actions
- Conversation excerpt

**Alert Management:**
- View all alerts
- Filter by level
- Mark as resolved
- Add notes

**API Endpoints:**
- `GET /api/alerts/{session_id}` - Get alerts
- `GET /api/alerts/{session_id}/unresolved` - Get unresolved
- `PUT /api/alerts/{alert_id}/resolve` - Resolve alert

---

### 4. Activity Tracking

**Activity Types:**
- Story Time
- Homework Helper
- I Spy Game
- Free Chat
- Camera usage
- Voice usage

**Activity Information:**
- Start/end time
- Duration
- Description
- Details (theme, topic, etc.)
- Images used

**Activity Log:**
- Chronological list
- Filter by child
- Filter by type
- Search by date

**API Endpoints:**
- `GET /api/activities/{session_id}` - List activities
- `POST /api/activities` - Create activity
- `PUT /api/activities/{activity_id}/end` - End activity

---

### 5. AI Parenting Assistant

**Description:** Get parenting advice from AI

**What it helps with:**
- Child development questions
- Behavioral concerns
- Educational strategies
- Health and safety questions
- Age-appropriate activities

**Features:**
- Context-aware (knows child's age)
- Trusted sources (CDC, NIH, AAP)
- Citations provided
- Suggested actions
- Conversation history

**Privacy:**
- **Does NOT** read child's specific conversations
- **Can** see general themes from alerts
- Respects child's privacy

**Example Questions:**
- "How do I handle tantrums with a 4-year-old?"
- "Is my 8-year-old ready for sleepovers?"
- "What screen time is appropriate for a 10-year-old?"
- "How can I help my child with homework struggles?"

**Response Format:**
- Understanding (context and development)
- Strategies (actionable advice)
- Citations (sources like CDC, AAP)
- Suggested actions (next steps)

**Technical Details:**
- Model: NVIDIA Nemotron with RAG
- Sources: Child development, parenting best practices
- Not medical/legal advice

**API Endpoint:** `POST /api/parent-assistant`

---

### 6. Source Citations Panel

**Description:** View sources for AI responses

**What you see:**
- Source type (CDC, CPSC, NIH, etc.)
- Document title
- Original URL
- Relevant excerpt
- Confidence score (0-100)
- Public domain status

**Why it matters:**
- Verify information
- Build trust in AI
- Learn about resources
- Share with others

**Filtering:**
- By session
- By source type
- By date
- Search by keyword

**API Endpoint:** `GET /api/citations/{session_id}`

---

### 7. Session Management

**Session Information:**
- Child name, age, gender
- Start/end time
- Duration
- Message count
- Activities performed
- Active status

**Session Actions:**
- View full conversation
- See activities
- Check alerts
- View citations
- End session remotely (if needed)

**Session History:**
- All past sessions
- Filter by child
- Filter by date
- Search conversations

**API Endpoints:**
- `GET /api/sessions/{session_id}` - Get session
- `PUT /api/sessions/{session_id}/end` - End session
- `GET /api/sessions/{session_id}/summary` - Get summary

---

### 8. Child Settings Configuration

**Allowed Activities:**
- Enable/disable Story Time
- Enable/disable Homework Helper
- Enable/disable I Spy Game
- Enable/disable Free Chat

**Content Filtering:**
- **Strict:** Ages 3-7, very safe content only
- **Moderate:** Ages 8-12, age-appropriate complexity
- **Relaxed:** Ages 13+, more mature topics with education focus

**Session Settings:**
- Timeout (auto-end after inactivity)
- Maximum session duration
- Quiet hours (restrict usage times)

**Device Permissions:**
- Enable/disable camera
- Enable/disable microphone
- Require parent approval for media

**API Endpoints:**
- `GET /api/child-settings/{child_id}` - Get settings
- `PUT /api/child-settings/{child_id}` - Update settings

---

## Babysitter Features

### 1. Read-Only Monitoring

**What babysitters can do:**
- View assigned children
- Monitor active sessions
- See conversation feeds
- Check safety alerts
- View activity logs
- Access source citations

**What babysitters CANNOT do:**
- Create/edit/delete child profiles
- Change settings
- Resolve alerts (parent-only)
- Access parent AI assistant
- Delete conversations

**Dashboard Access:**
- Same interface as parents
- Limited permissions
- Clear indication of read-only status

---

### 2. Alert Monitoring

**Alert Access:**
- View all alerts
- See severity levels
- Read AI assessments
- Check timestamps

**Response Protocol:**
1. Monitor alerts regularly (every 15-30 minutes)
2. Respond to URGENT/EMERGENCY alerts immediately
3. Contact parent for serious concerns
4. Document incidents

**Best Practices:**
- Check alerts tab frequently
- Keep parent communication open
- Know emergency procedures
- Have emergency contacts ready

---

## AI & ML Features

### 1. NVIDIA Nemotron LLM Integration

**Model:** `nvidia/llama-3.3-nemotron-super-49b-v1.5`

**Capabilities:**
- Natural language understanding
- Context-aware responses
- Age-appropriate language generation
- Reasoning and explanation
- Story generation
- Emotion detection

**Configuration:**
- Temperature: 0.7 (balanced creativity)
- Max tokens: 2048
- Top-p: 0.9
- Frequency penalty: 0.0

**Performance:**
- Response time: 1-3 seconds
- Quality: State-of-the-art
- Reliability: 99.9% uptime (NVIDIA API)

---

### 2. RAG (Retrieval-Augmented Generation)

**Knowledge Base Sources:**
- CDC (Centers for Disease Control)
- CPSC (Consumer Product Safety Commission)
- NIH (National Institutes of Health)
- AAP (American Academy of Pediatrics) - public domain content

**How it works:**
1. Embed user query (Sentence Transformers)
2. Semantic search in ChromaDB
3. Retrieve top 3 relevant documents
4. Include in LLM prompt as context
5. Track citations for transparency

**Benefits:**
- Factual accuracy
- Verifiable sources
- No hallucinations
- Public domain (no copyright issues)
- Parent visibility

**Technical Details:**
- Vector DB: ChromaDB (persistent)
- Embedding model: all-MiniLM-L6-v2 (384 dimensions)
- Similarity: Cosine similarity
- Threshold: 0.6 minimum relevance

---

### 3. Vision Analysis

**Models:**
1. **NVIDIA Cosmos Vision** (primary)
   - Model: `meta/llama-3.2-11b-vision-instruct`
   - Capabilities: Object detection, scene understanding, text OCR

2. **OpenAI Vision** (fallback)
   - Model: GPT-4 Vision
   - Capabilities: Detailed image analysis

3. **Claude Vision** (tertiary fallback)
   - Model: Claude 3 Vision
   - Capabilities: Comprehensive analysis

**Use Cases:**
- Homework analysis (math, writing, reading)
- Game interactions (I Spy)
- Safety checks (dangerous objects)
- Show-and-tell

**Safety Features:**
- Automated safety screening
- Alert on concerning content
- Age-appropriate analysis

---

### 4. Voice Processing

**Speech-to-Text:**
- Provider: OpenAI Whisper
- Accuracy: 95%+
- Languages: 50+ supported
- Formats: MP3, WAV, M4A, WebM

**Text-to-Speech:**
- Providers: ElevenLabs, OpenAI, gTTS
- Voices: Multiple options
- Styles: Friendly, calm, excited
- Languages: English (primary)

**Audio Optimization:**
- Text cleaning (remove emojis, markdown)
- Proper punctuation for natural reading
- Volume normalization

---

### 5. Safety Monitoring AI

**Multi-Layer Approach:**

**Layer 1: Keyword Screening**
- Fast pattern matching
- Urgent keywords: emergency, 911, fire, poison, can't breathe, unconscious
- Concern keywords: hurt, pain, bleeding, fell, sick, scared, stranger, help

**Layer 2: LLM Analysis**
- Context understanding
- Intent detection
- Severity assessment
- False positive reduction

**Layer 3: Alert Classification**
- INFO: Informational
- WARNING: Minor concern
- URGENT: Requires attention
- EMERGENCY: Immediate action

**Performance:**
- Response time: < 100ms (keywords), ~500ms (LLM)
- Accuracy: 90%+ (minimizing false positives/negatives)
- Parent notification: < 1 second

---

## Safety Features

### 1. Content Filtering

**Age-Based Filtering:**
- Ages 3-7: Very simple, only safe topics
- Ages 8-12: Age-appropriate complexity
- Ages 13+: Mature topics with education focus

**Topic Restrictions:**
- No violent content
- No sexual content
- No dangerous instructions
- No illegal activities
- No harmful advice

**Implementation:**
- LLM system prompts
- Response post-processing
- Keyword blacklists
- Context analysis

---

### 2. Camera Privacy

**Privacy-First Design:**
- Camera ONLY activates on button click
- No background video streaming
- No automatic image capture
- No storage of images (unless homework)
- Parent notification of camera usage

**Safety Checks:**
- All images analyzed for safety
- Concerning content triggers alerts
- Parent visibility of all images

---

### 3. Emergency Response

**Emergency Button:**
- One-tap activation
- Instant parent notification (< 1 second)
- WebSocket + push notification
- Call emergency contact option
- Conversation context saved

**Emergency Detection:**
- Keyword monitoring
- LLM-based emergency detection
- Automatic alert escalation

---

### 4. Parent Notifications

**Real-Time Alerts:**
- WebSocket for instant delivery
- Browser notifications (if enabled)
- Badge counts on tabs
- Audio alerts (optional)

**Alert Delivery:**
- Multiple connection support
- Auto-retry on failure
- Fallback to polling

---

## Integration Features

### 1. WebSocket Real-Time Communication

**Parent Connection:**
- Endpoint: `WS /ws/parent/{parent_id}`
- Keep-alive: Ping/pong every 30 seconds
- Auto-reconnect on disconnect
- Multiple concurrent connections supported

**Message Types:**
- Safety alerts
- Activity updates
- Session changes
- System notifications

---

### 2. API Documentation

**Interactive Docs:**
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc
- Try endpoints directly
- Auto-generated from code

**API Features:**
- RESTful design
- JSON request/response
- Standard HTTP status codes
- Comprehensive error messages
- Rate limiting (future)

---

### 3. Database Storage

**SQLite (Default):**
- File-based storage
- No separate database server
- Portable data
- Easy backup

**PostgreSQL (Optional):**
- Better performance at scale
- Connection pooling
- Advanced queries
- Production-ready

**Data Models:**
- Sessions, Messages, Activities
- Children, Settings
- Alerts, Citations
- Parent conversations

---

### 4. Docker Deployment

**Containerization:**
- Backend container (Python + FastAPI)
- Frontend container (React production build)
- Volume mounts for data persistence
- Docker Compose orchestration

**Benefits:**
- Easy deployment
- Consistent environments
- Simple scaling
- Isolated dependencies

**Commands:**
```bash
./launcher.sh start    # Start services
./launcher.sh stop     # Stop services
./launcher.sh logs     # View logs
./launcher.sh restart  # Restart services
```

---

## Future Features (Roadmap)

### Phase 2: Enhanced Features
- Mobile apps (iOS, Android)
- Video calling (WebRTC parent-child)
- Advanced analytics and insights
- Custom knowledge base uploads
- Multi-language support
- Offline mode (PWA)

### Phase 3: Scale & Integrate
- Cloud deployment (AWS, GCP, Azure)
- Horizontal scaling
- Advanced ML insights
- Teacher/school integration
- Curriculum alignment
- Third-party API

---

## Feature Comparison Matrix

| Feature | Child | Parent | Babysitter |
|---------|-------|--------|------------|
| Chat | ✅ | ❌ | ❌ |
| Stories | ✅ | ❌ | ❌ |
| Homework Help | ✅ | ❌ | ❌ |
| Games | ✅ | ❌ | ❌ |
| Voice | ✅ | ❌ | ❌ |
| Camera | ✅ | ❌ | ❌ |
| Emergency Button | ✅ | ❌ | ❌ |
| View Conversations | ❌ | ✅ | ✅ |
| Manage Children | ❌ | ✅ | ❌ (read-only) |
| View Alerts | ❌ | ✅ | ✅ |
| Resolve Alerts | ❌ | ✅ | ❌ |
| AI Assistant | ❌ | ✅ | ❌ |
| View Sources | ❌ | ✅ | ✅ |
| Configure Settings | ❌ | ✅ | ❌ |

---

**For implementation details, see [Technical Overview](TECHNICAL_OVERVIEW.md)**
