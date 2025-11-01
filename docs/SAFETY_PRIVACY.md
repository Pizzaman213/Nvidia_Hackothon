# Safety & Privacy Guide

Our commitments, policies, and technical implementations for protecting children and families.

---

## Table of Contents

- [Privacy Commitments](#privacy-commitments)
- [Safety Features](#safety-features)
- [Data Collection & Storage](#data-collection--storage)
- [Third-Party Services](#third-party-services)
- [Compliance & Legal](#compliance--legal)
- [Parent Controls](#parent-controls)
- [Best Practices](#best-practices)

---

## Privacy Commitments

### Our Core Principles

1. **Children's Privacy First**
   - Minimal data collection
   - No data selling or sharing
   - Parent transparency and control
   - Designed with COPPA in mind

2. **No Constant Surveillance**
   - Camera activates ONLY when child clicks button
   - No background video recording
   - No audio recording without consent
   - Privacy-preserving design

3. **Local-First Storage**
   - Data stays on your infrastructure
   - No mandatory cloud storage
   - SQLite local database
   - Full data ownership

4. **Transparency**
   - Open source code (MIT License)
   - Clear data practices
   - Parent visibility of all conversations
   - AI reasoning transparency

5. **Security**
   - HTTPS encryption for all API calls
   - API keys stored securely (environment variables)
   - No credentials in code
   - Regular security updates

---

## Privacy by Design

### What We Collect

**Child Data (Minimal):**
- Name, age, gender (for personalization)
- Emergency contact (optional)
- Profile picture (optional, user-uploaded)

**Conversation Data:**
- Message content and timestamps
- Activity logs (homework, stories, games)
- Images (only when explicitly captured)
- Safety alerts

**Parent Data:**
- Email and hashed password
- Children profiles linked to account
- Settings and preferences

### What We DO NOT Collect

- Location data
- Device identifiers beyond session
- Behavioral tracking across sites
- Third-party cookies
- Payment information
- Social media connections

### Where Data Is Stored

**Local SQLite Database:**
- Location: `backend/data/babysitter.db`
- All conversations, sessions, and profiles
- Full parent control and ownership

**ChromaDB Vector Database:**
- Public domain knowledge base only
- No personal data stored
- CDC, CPSC, NIH documents

**No Cloud Storage:**
- All data stays local by default
- No automatic cloud sync
- No third-party storage

---

## Safety Features

### 1. Multi-Layer Safety Monitoring

**Layer 1: Keyword Detection (Fast - <50ms)**

Monitors for urgent keywords:
- **Emergency:** 911, emergency, fire, poison, can't breathe
- **Injury:** hurt, bleeding, broken bone, fell down
- **Illness:** very sick, throwing up, can't move
- **Fear:** scared, stranger, someone's here, help me

**Layer 2: AI Context Analysis (Accurate - ~500ms)**

Uses NVIDIA Nemotron to:
- Understand context and intent
- Distinguish real concerns from casual mentions
- Assess severity based on conversation
- Reduce false positives

**Example:**
```
"I'm hurt" in "I'm hurt that my friend didn't invite me"
→ Emotional concern, WARNING level

"I'm hurt" in "I fell off my bike and I'm hurt"
→ Physical injury, URGENT level
```

**Layer 3: Pattern Recognition**

Monitors for:
- Escalating distress over time
- Repeated concerning mentions
- Unusual conversation patterns
- Long periods of distress

---

### 2. Alert System

**INFO (Blue) - Informational**
- Examples: "Child started new activity", "Session active for 1 hour"
- Action: None required
- Notification: Dashboard only

**WARNING (Yellow) - Monitor Situation**
- Examples: "Child mentioned feeling sad", "Asked about scary topic"
- Action: Review when convenient
- Notification: Dashboard badge

**URGENT (Orange) - Check Soon**
- Examples: "Child mentioned getting hurt", "Expressed fear"
- Action: Check within 15 minutes
- Notification: Dashboard + browser alert

**EMERGENCY (Red) - Immediate Action**
- Examples: "Emergency button pressed", "Can't breathe", "Fire"
- Action: Respond immediately
- Notification: All channels + audio

---

### 3. Content Filtering

**Age-Appropriate Responses:**

**Ages 3-7 (Strict):**
- Very simple language
- Only clearly safe topics
- No scary content
- Heavy moderation

**Ages 8-12 (Moderate):**
- Age-appropriate complexity
- Guided discussions
- Educational approach
- Balanced moderation

**Ages 13+ (Relaxed):**
- More mature language
- Real-world topics with education
- Critical thinking encouraged
- Light moderation

**Always Filtered:**
- Violence and gore
- Sexual content
- Illegal activities
- Self-harm
- Dangerous instructions
- Hate speech

---

### 4. Camera Privacy

**Privacy-First Design:**

1. Camera ONLY activates when child clicks button
2. No background video streaming
3. No automatic capture
4. All images analyzed for safety
5. Parent notification of camera usage

**Safety Checks:**
- Detect dangerous objects (knives, weapons, chemicals)
- Identify unsafe situations
- Check for inappropriate content
- Alert parents if concerns detected

**Image Storage:**
- Not stored unless needed for homework
- Auto-delete after session ends
- Parent can view all captured images

---

### 5. Emergency Features

**Emergency Button:**

What happens:
1. Child clicks red "Emergency" button
2. Instant EMERGENCY alert created
3. Parent notified (< 1 second)
4. Emergency contact info displayed
5. Full conversation context saved

**Works even without active session**

**Emergency Detection:**

AI also detects emergencies in conversation:
- "I can't breathe"
- "There's a fire"
- "Someone's breaking in"
- "I need 911"

Automatic EMERGENCY alert triggered.

---

## Data Collection & Storage

### Data We Collect

| Category | Required | Purpose |
|----------|----------|---------|
| Child name | Yes | Personalization |
| Child age | Yes | Age-appropriate responses |
| Gender | No | Personalization (optional) |
| Emergency contact | No | Safety feature |
| Conversation messages | Yes | Context, parent review |
| Images captured | Only when taken | Homework, games |
| Safety alerts | Auto-generated | Parent notification |
| Parent email | Yes | Authentication |

### Data Retention

**Active Data:**
- Conversations: Indefinite (until manually deleted)
- Sessions: Indefinite (for history)
- Alerts: Indefinite (for trend tracking)

**Temporary Data:**
- Audio files: 24 hours
- Images: End of session (unless saved)
- WebSocket connections: Until disconnect

**Parent Control:**
- Delete individual messages
- Delete entire sessions
- Delete child profiles
- Purge all data (manual database deletion)

---

## Third-Party Services

### NVIDIA API

**What we send:**
- Message text for conversation
- Images for vision analysis
- System prompts for context

**What we DON'T send:**
- Full names or personal identifiers
- Location data
- Contact information

**NVIDIA Policy:**
- Enterprise data not used for training
- Encrypted transmission
- See: https://www.nvidia.com/en-us/ai-data-science/foundation-models/

### OpenAI API

**What we send:**
- Audio files (Whisper STT)
- Images (vision fallback)
- Text (TTS)

**What we DON'T send:**
- Personal identifiable information
- Full conversation context

**OpenAI Policy:**
- API data not used for training (as of March 2023)
- 30-day retention, then deleted
- See: https://openai.com/policies/privacy-policy

### ElevenLabs (Optional)

**What we send:** Text for voice synthesis only

**What we DON'T send:** Any other data

### Anthropic (Optional)

**What we send:** Images (vision fallback)

**What we DON'T send:** Personal information

---

## Data Security

### Encryption

**In Transit:**
- HTTPS for all API calls
- WSS (WebSocket Secure)
- TLS 1.2+ required

**At Rest:**
- Database: File system encryption (optional)
- Passwords: bcrypt hashing (cost factor 12)
- API keys: Environment variables only

### Access Control

**Authentication:**
- Parent login required for dashboard
- Session-based authentication
- No child authentication (easy access by design)

**Authorization:**
- Parents: Full access to their children's data
- Babysitters: Read-only access
- Children: No access to settings

**API Security:**
- CORS restrictions
- Input validation
- SQL injection prevention (ORM)

---

## Compliance & Legal

### COPPA (Children's Online Privacy Protection Act)

**Our Approach:**

We designed with COPPA principles:
- Minimal data collection
- Parental consent (implicit through setup)
- Parent access and control
- Data security measures
- No marketing to children

**Note:** For production use with children under 13, consult legal counsel about COPPA compliance.

### Public Domain Sources

**Knowledge Base:**

All RAG sources are U.S. government works:
- CDC (Centers for Disease Control)
- CPSC (Consumer Product Safety Commission)
- NIH (National Institutes of Health)

**Legal Basis:**
- 17 USC § 105: U.S. government works not subject to copyright
- Public domain, free to use
- Full attribution provided

### Open Source License

**MIT License:**
- Free to use, modify, distribute
- No warranty or liability
- Must include license and copyright notice

---

## Parent Controls

### Per-Child Settings

**Allowed Activities:**
- Enable/disable Story Time
- Enable/disable Homework Helper
- Enable/disable I Spy Game
- Enable/disable Free Chat

**Content Filter Level:**
- Strict (Ages 3-7)
- Moderate (Ages 8-12)
- Relaxed (Ages 13+)

**Session Settings:**
- Timeout duration (15, 30, 60, 120 minutes)
- Quiet hours (restrict usage times)

**Device Permissions:**
- Enable/disable camera
- Enable/disable microphone

### Monitoring Options

**Real-Time:**
- Live conversation feed
- Instant alert notifications
- Activity updates
- WebSocket connection

**Historical:**
- All past sessions
- Full transcripts
- Activity logs
- Alert history

**Transparency:**
- AI reasoning (thinking tags)
- Source citations
- Confidence scores

---

## Best Practices

### For Parents

**Setup:**
1. Create accurate child profiles (correct age)
2. Set appropriate content filter level
3. Configure emergency contact
4. Test emergency button with child
5. Review settings regularly

**Monitoring:**
1. Check alerts daily
2. Review conversations periodically
3. Look for patterns
4. Address concerns promptly
5. Maintain open communication

**Privacy:**
1. Don't share login credentials
2. Use strong passwords
3. Log out on shared devices
4. Review access permissions
5. Update settings as child grows

**Communication:**
1. Tell children they're being monitored (age-appropriate)
2. Explain the emergency button
3. Set clear usage rules
4. Discuss appropriate sharing
5. Maintain trust and openness

### For Children

**Safety:**
1. Use only with parent's permission
2. Tell parents about concerns
3. Don't share personal information
4. Use emergency button if needed
5. Ask parents if unsure

**Privacy:**
1. Know conversations are saved
2. Parents can review messages
3. Camera only works when clicked
4. Be honest with AI

### For Babysitters

**Monitoring:**
1. Check alerts every 15-30 minutes
2. Respond to URGENT/EMERGENCY immediately
3. Document incidents
4. Contact parents with concerns
5. Know emergency procedures

**Privacy:**
1. Don't share what you see
2. Access only assigned children
3. Don't modify settings
4. Respect children's privacy

---

## Data Breach Protocol

In the unlikely event of a data breach:

1. **Immediate Actions:**
   - Identify scope
   - Contain affected systems
   - Notify parents within 72 hours

2. **Investigation:**
   - Determine cause
   - Assess compromised data
   - Implement fixes

3. **Prevention:**
   - Update security measures
   - Regular security audits

---

## Common Questions

**Q: Can the AI see my child through the camera constantly?**
A: No! The camera only activates when your child clicks the camera button. No background streaming.

**Q: Who can see my child's conversations?**
A: Only you (the parent) and authorized babysitters. We don't share data with third parties.

**Q: Is the data encrypted?**
A: Yes, all transmission uses HTTPS encryption. You can also enable file system encryption for local storage.

**Q: Can I delete conversation history?**
A: Yes, you can delete individual messages, sessions, or entire child profiles.

**Q: What if I don't trust the AI's advice?**
A: Always verify important information. Check citations in the Sources tab. For medical/legal matters, consult professionals.

**Q: How do I know alerts are accurate?**
A: We use multi-layer analysis to reduce false positives. Review alerts in context and use your judgment.

**Q: What happens if I stop using the app?**
A: Data stays in your local database. You can manually delete the database file to remove all data.

---

## Commitment to Improvement

We are committed to:
- Regular security updates
- Privacy-preserving enhancements
- Transparent communication
- User feedback incorporation
- Best practices compliance
- Continuous monitoring

**Last updated: November 2024**

---

**Your family's privacy and safety are our top priorities.**

For questions: See [User Guide](USER_GUIDE.md) or [Documentation Index](README.md)
