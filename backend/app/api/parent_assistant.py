"""
Parent Assistant API Endpoint
Provides AI-powered parenting advice based on child's conversation history
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime, timezone

from app.database.db import get_db
from app.models.session import SessionDB
from app.models.message import MessageDB
from app.models.alert import SafetyAlertDB
from app.models.parent_conversation import ParentConversationDB
from app.services.llm_service import llm_service
from app.services.rag_service import rag_service
from app.utils.logger import setup_logger
import json

logger = setup_logger(__name__)

router = APIRouter(prefix="/api/parent-assistant", tags=["parent-assistant"])


class ParentAssistantRequest(BaseModel):
    """Request model for parent assistant"""
    session_id: str
    parent_question: str
    include_conversation_history: bool = True
    child_name: Optional[str] = None  # For general advice without a session
    child_age: Optional[int] = None   # For general advice without a session


class ParentAssistantResponse(BaseModel):
    """Response model for parent assistant"""
    advice: str
    conversation_summary: Optional[str] = None
    key_insights: List[str] = []
    suggested_actions: List[str] = []
    citations: List[dict] = []  # Sources used for advice


@router.post("", response_model=ParentAssistantResponse)
async def get_parenting_advice(
    request: ParentAssistantRequest,
    db: Session = Depends(get_db)
):
    """
    Get AI-powered parenting advice with conversational context

    This endpoint maintains a conversation history between the parent and AI assistant,
    providing context-aware parenting advice. It does NOT access the child's conversations
    for privacy reasons.
    """
    # Check if this is a general advice request (no session)
    is_general_advice = request.session_id == "general-advice" or not request.session_id

    # Verify session exists (unless it's general advice)
    session = None
    if not is_general_advice:
        session = db.query(SessionDB).filter(
            SessionDB.session_id == request.session_id
        ).first()

        if not session:
            raise HTTPException(status_code=404, detail="Session not found")

    # Get child's conversation history with the AI
    child_conversation_context = ""

    # Determine child name and age
    # Priority: request parameters > session info > defaults
    if session:
        # If we have a session, prefer session's child info but allow override from request
        child_name = request.child_name or session.child_name
        child_age = request.child_age or session.child_age
    else:
        # For general advice, use provided parameters or defaults
        child_name = request.child_name or "your child"
        child_age = request.child_age or 8

    if session:

        # Get child-AI messages from this session (last 50 messages)
        child_messages = db.query(MessageDB).filter(
            MessageDB.session_id == request.session_id
        ).order_by(MessageDB.timestamp.desc()).limit(50).all()

        if child_messages:
            conversation_parts = []
            for msg in reversed(child_messages):  # Reverse to get chronological order
                speaker = child_name if msg.role == "child" else "AI"
                emotion_tag = f" [{msg.emotion}]" if msg.emotion else ""
                conversation_parts.append(f"{speaker}{emotion_tag}: {msg.content}")

            child_conversation_context = "\n".join(conversation_parts)

    # Get parent's conversation history (parent-assistant conversations only)
    parent_conversation_context = ""

    if request.include_conversation_history and session:
        # Get previous parent-assistant conversations for this session
        parent_messages = db.query(ParentConversationDB).filter(
            ParentConversationDB.session_id == request.session_id,
            ParentConversationDB.parent_id == session.parent_id
        ).order_by(ParentConversationDB.timestamp.asc()).all()

        # Format conversation history (only parent-assistant exchanges)
        if parent_messages:
            conversation_parts = []
            for msg in parent_messages:
                speaker = "Parent" if msg.role == "parent" else "AI Assistant"
                conversation_parts.append(f"{speaker}: {msg.content}")

            parent_conversation_context = "\n".join(conversation_parts)

    # Get safety alerts for context
    alert_context = ""
    if session:
        alerts = db.query(SafetyAlertDB).filter(
            SafetyAlertDB.session_id == request.session_id
        ).all()

        if alerts:
            alert_parts = []
            for alert in alerts:
                alert_parts.append(
                    f"- {alert.alert_level.upper()}: {alert.message} ({alert.ai_assessment})"
                )
            alert_context = "\n".join(alert_parts)

    # Retrieve relevant knowledge from RAG service
    # Extract key topics from the parent's question to improve retrieval
    rag_context = ""
    citations = []
    try:
        # Use the parent's question + recent conversation context for better retrieval
        retrieval_query = f"{request.parent_question}"

        # If we have child conversation context, include a summary for better matching
        if child_conversation_context:
            # Get last few exchanges for context (up to 500 chars)
            recent_context = child_conversation_context[-500:] if len(child_conversation_context) > 500 else child_conversation_context
            retrieval_query = f"{request.parent_question}\n\nContext: {recent_context}"

        # Retrieve relevant documents from knowledge base
        relevant_docs = await rag_service.retrieve_relevant_context(
            query=retrieval_query,
            n_results=5  # Get top 5 most relevant documents
        )

        if relevant_docs:
            # Build context from retrieved documents
            rag_parts = []
            for i, doc in enumerate(relevant_docs, 1):
                # Only include docs with reasonable similarity (>30%)
                if doc['similarity_score'] > 30:
                    source_info = doc['metadata'].get('source_title', 'Unknown Source')
                    source_url = doc['metadata'].get('source_url', '')

                    rag_parts.append(f"[Source {i}: {source_info}]\n{doc['text']}")

                    # Store citation info
                    citations.append({
                        'source': source_info,
                        'url': source_url,
                        'relevance': doc['similarity_score'],
                        'source_type': doc['metadata'].get('source_type', 'unknown')
                    })

            if rag_parts:
                rag_context = "\n\n".join(rag_parts)
                logger.info(f"Retrieved {len(rag_parts)} relevant documents from knowledge base")

    except Exception as e:
        logger.warning(f"RAG retrieval failed, continuing without external knowledge: {e}")

    # Build comprehensive prompt for the LLM
    system_prompt = f"""You are an expert child psychologist and parenting advisor having a conversation with a parent.

Child Information:
- Name: {child_name}
- Age: {child_age} years old

IMPORTANT: When referring to the child, ALWAYS use their actual name "{child_name}", NOT placeholders like "[Child's Name]" or "your child". Be specific and personal in your advice.

Your role is to:
1. Have a natural, ongoing conversation with the parent about parenting topics
2. Remember and reference previous parts of your conversation with the parent
3. Analyze the child's conversations with the AI to provide informed advice
4. Provide thoughtful, evidence-based parenting advice grounded in authoritative sources
5. Suggest specific, actionable steps the parent can take
6. Be empathetic, supportive, and practical
7. When available, cite authoritative sources (CDC, NIH, CPSC) to support your recommendations

You have access to:
- The child's recent conversations with the AI assistant (including detected emotions)
- Your previous conversations with THIS parent
- Safety alerts that were flagged
- Basic child information (name, age)
- Evidence-based child care knowledge from authoritative public health sources (CDC, NIH, CPSC)

Context awareness:
- If the parent mentions a different child or age than what's in the child information above, acknowledge the discrepancy and ask for clarification
- The child information provided ({child_name}, {child_age} years old) is the current context for this conversation
- Reference the child by name ({child_name}) to make your advice more personal and relevant

When authoritative sources are provided:
- Integrate evidence-based recommendations naturally into your advice
- Reference the sources when making specific safety or health recommendations
- Balance evidence-based guidance with personalized insights from the child's conversations
- Don't overuse citations - mention sources when they add credibility to important points

Use all this context to provide personalized, informed advice. Reference specific things {child_name} said when relevant.
Be warm, supportive, and maintain conversational continuity by referencing earlier parts of your discussion with the parent."""

    # Build the query with conversation history
    query_parts = []

    # Add a reminder about the current child's information at the start
    query_parts.append(f"=== Current Context ===")
    query_parts.append(f"You are discussing {child_name}, who is {child_age} years old.")
    query_parts.append(f"Remember to use {child_name}'s actual name in your responses.")
    query_parts.append("")

    # Include evidence-based knowledge FIRST for better context
    if rag_context:
        query_parts.append("=== Evidence-Based Knowledge from Authoritative Sources ===")
        query_parts.append("Use this information to support your recommendations when relevant:")
        query_parts.append(rag_context)
        query_parts.append("")

    # Include child's conversation context
    if child_conversation_context:
        query_parts.append(f"=== {child_name}'s Recent Conversations with AI ===")
        query_parts.append(child_conversation_context)
        query_parts.append("")

    # Include parent-assistant conversation history
    if parent_conversation_context:
        query_parts.append("=== Your Previous Conversation with AI Assistant ===")
        query_parts.append(parent_conversation_context)
        query_parts.append("")

    if alert_context:
        query_parts.append("=== Safety Alerts ===")
        query_parts.append(alert_context)
        query_parts.append("")

    query_parts.append(f"Parent: {request.parent_question}")

    full_query = "\n".join(query_parts)

    # Save parent's question to conversation history (only if we have a real session)
    if session:
        parent_message = ParentConversationDB(
            session_id=request.session_id,
            parent_id=session.parent_id,
            role="parent",
            content=request.parent_question
        )
        db.add(parent_message)
        db.commit()

    # Get advice from LLM
    advice = await llm_service.generate(
        message=full_query,
        child_age=child_age,
        temperature=0.7,
        system_prompt=system_prompt
    )

    # Extract insights and suggestions using a follow-up call
    analysis_prompt = f"""Based on this parenting conversation, provide:
1. A one-sentence summary of the main topic discussed
2. 3 key insights from the advice given (as a JSON array)
3. 3 specific suggested actions for the parent (as a JSON array)

Respond ONLY with valid JSON in this format:
{{
    "summary": "brief summary here",
    "insights": ["insight 1", "insight 2", "insight 3"],
    "actions": ["action 1", "action 2", "action 3"]
}}

Recent advice provided:
{advice[:1000]}"""

    try:
        analysis_response = await llm_service.generate(
            message=analysis_prompt,
            child_age=child_age,
            temperature=0.3,
            system_prompt="You are a data extraction system. Respond only with valid JSON."
        )

        # Parse JSON response
        if "```json" in analysis_response:
            analysis_response = analysis_response.split("```json")[1].split("```")[0].strip()
        elif "```" in analysis_response:
            analysis_response = analysis_response.split("```")[1].split("```")[0].strip()

        analysis_data = json.loads(analysis_response)

        # Save assistant's response to conversation history (only if we have a real session)
        if session:
            assistant_message = ParentConversationDB(
                session_id=request.session_id,
                parent_id=session.parent_id,
                role="assistant",
                content=advice,
                conversation_summary=analysis_data.get("summary"),
                key_insights=json.dumps(analysis_data.get("insights", [])),
                suggested_actions=json.dumps(analysis_data.get("actions", []))
            )
            db.add(assistant_message)
            db.commit()

        return ParentAssistantResponse(
            advice=advice,
            conversation_summary=analysis_data.get("summary"),
            key_insights=analysis_data.get("insights", []),
            suggested_actions=analysis_data.get("actions", []),
            citations=citations
        )

    except Exception as e:
        logger.error(f"Error extracting insights: {e}")

        # Save assistant's response even if structured extraction fails (only if we have a real session)
        if session:
            assistant_message = ParentConversationDB(
                session_id=request.session_id,
                parent_id=session.parent_id,
                role="assistant",
                content=advice
            )
            db.add(assistant_message)
            db.commit()

        # Return just the advice if structured extraction fails
        return ParentAssistantResponse(
            advice=advice,
            conversation_summary=None,
            key_insights=[],
            suggested_actions=[],
            citations=citations
        )


@router.get("/conversation-history/{session_id}")
async def get_conversation_history(
    session_id: str,
    db: Session = Depends(get_db)
):
    """
    Get the parent's conversation history with the AI assistant
    """
    # Verify session exists
    session = db.query(SessionDB).filter(
        SessionDB.session_id == session_id
    ).first()

    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    # Get parent's conversation messages
    messages = db.query(ParentConversationDB).filter(
        ParentConversationDB.session_id == session_id,
        ParentConversationDB.parent_id == session.parent_id
    ).order_by(ParentConversationDB.timestamp.asc()).all()

    # Format for frontend
    formatted_messages = []
    for msg in messages:
        message_data = {
            "id": str(msg.id),
            "role": msg.role,
            "content": msg.content,
            "timestamp": msg.timestamp.isoformat(),
        }

        # Add structured response data for assistant messages
        if msg.role == "assistant":
            try:
                message_data["response"] = {
                    "advice": msg.content,
                    "conversation_summary": msg.conversation_summary,
                    "key_insights": json.loads(msg.key_insights) if msg.key_insights else [],
                    "suggested_actions": json.loads(msg.suggested_actions) if msg.suggested_actions else [],
                    "citations": []  # Historical messages don't have citations stored
                }
            except:
                message_data["response"] = None

        formatted_messages.append(message_data)

    return {
        "session_id": session_id,
        "messages": formatted_messages,
        "total_messages": len(formatted_messages)
    }


@router.get("/conversation-summary/{session_id}")
async def get_conversation_summary(
    session_id: str,
    db: Session = Depends(get_db)
):
    """
    Get a summary of the child's conversation
    """
    # Verify session exists
    session = db.query(SessionDB).filter(
        SessionDB.session_id == session_id
    ).first()

    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    # Get messages
    messages = db.query(MessageDB).filter(
        MessageDB.session_id == session_id
    ).order_by(MessageDB.timestamp.asc()).all()

    if not messages:
        return {
            "summary": "No conversation history yet.",
            "message_count": 0,
            "emotions_detected": [],
            "topics_discussed": []
        }

    # Build conversation for summary
    conversation_parts = []
    emotions = set()

    for msg in messages:
        speaker = "Child" if msg.role == "child" else "AI"  # type: ignore
        conversation_parts.append(f"{speaker}: {msg.content}")
        if msg.emotion is not None:
            emotions.add(msg.emotion)

    conversation_text = "\n".join(conversation_parts[:20])  # First 20 messages

    # Get summary from LLM
    summary_prompt = f"""Summarize this conversation between a {session.child_age}-year-old child and an AI assistant.
Focus on:
- Main topics discussed
- Child's emotional state
- Any notable concerns or highlights

Conversation:
{conversation_text}

Provide a brief 2-3 sentence summary."""

    summary = await llm_service.generate(
        message=summary_prompt,
        child_age=getattr(session, 'child_age', 8),
        temperature=0.5,
        system_prompt="You are a conversation summarizer. Be concise and insightful."
    )

    return {
        "summary": summary,
        "message_count": len(messages),
        "emotions_detected": list(emotions),
        "child_name": session.child_name,
        "child_age": session.child_age
    }
