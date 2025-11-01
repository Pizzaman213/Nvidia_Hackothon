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
from app.utils.logger import setup_logger
import json

logger = setup_logger(__name__)

router = APIRouter(prefix="/api/parent-assistant", tags=["parent-assistant"])


class ParentAssistantRequest(BaseModel):
    """Request model for parent assistant"""
    session_id: str
    parent_question: str
    include_conversation_history: bool = True


class ParentAssistantResponse(BaseModel):
    """Response model for parent assistant"""
    advice: str
    conversation_summary: Optional[str] = None
    key_insights: List[str] = []
    suggested_actions: List[str] = []


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
    child_name = "your child"
    child_age = 8

    if session:
        child_name = session.child_name
        child_age = session.child_age

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

    # Build comprehensive prompt for the LLM
    system_prompt = f"""You are an expert child psychologist and parenting advisor having a conversation with a parent.

Child Information:
- Name: {child_name}
- Age: {child_age} years old

Your role is to:
1. Have a natural, ongoing conversation with the parent about parenting topics
2. Remember and reference previous parts of your conversation with the parent
3. Analyze the child's conversations with the AI to provide informed advice
4. Provide thoughtful, evidence-based parenting advice
5. Suggest specific, actionable steps the parent can take
6. Be empathetic, supportive, and practical

You have access to:
- The child's recent conversations with the AI assistant (including detected emotions)
- Your previous conversations with THIS parent
- Safety alerts that were flagged
- Basic child information (name, age)

Use all this context to provide personalized, informed advice. Reference specific things the child said when relevant.
Be warm, supportive, and maintain conversational continuity by referencing earlier parts of your discussion with the parent."""

    # Build the query with conversation history
    query_parts = []

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
            suggested_actions=analysis_data.get("actions", [])
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
            suggested_actions=[]
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
                    "suggested_actions": json.loads(msg.suggested_actions) if msg.suggested_actions else []
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
