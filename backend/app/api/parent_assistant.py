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
from app.services.llm_service import llm_service

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
    Get AI-powered parenting advice based on child's conversation history

    This endpoint analyzes the child's previous conversations and provides
    context-aware parenting advice to help parents better support their child.
    """
    # Verify session exists
    session = db.query(SessionDB).filter(
        SessionDB.session_id == request.session_id
    ).first()

    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    # Extract scalar values from ORM object
    child_age_value = session.child_age
    child_name_value = session.child_name

    # Get conversation history
    messages = []
    conversation_context = ""

    if request.include_conversation_history:
        # Get all messages from this session
        db_messages = db.query(MessageDB).filter(
            MessageDB.session_id == request.session_id
        ).order_by(MessageDB.timestamp.asc()).all()

        # Format conversation history
        conversation_parts = []
        for msg in db_messages:
            speaker = "Child" if msg.role == "child" else "AI Assistant"  # type: ignore
            emotion_note = f" [feeling: {msg.emotion}]" if msg.emotion is not None else ""
            conversation_parts.append(
                f"{speaker}{emotion_note}: {msg.content}"
            )

        conversation_context = "\n".join(conversation_parts)

    # Get safety alerts for context
    alerts = db.query(SafetyAlertDB).filter(
        SafetyAlertDB.session_id == request.session_id
    ).all()

    alert_context = ""
    if alerts:
        alert_parts = []
        for alert in alerts:
            alert_parts.append(
                f"- {alert.alert_level.upper()}: {alert.message} ({alert.ai_assessment})"
            )
        alert_context = "\n".join(alert_parts)

    # Build comprehensive prompt for the LLM
    system_prompt = f"""You are an expert child psychologist and parenting advisor.
You have access to a child's conversation history with an AI assistant and any safety alerts.

Child Information:
- Name: {session.child_name}
- Age: {session.child_age} years old

Your role is to:
1. Analyze the conversation history to understand the child's emotional state, interests, and concerns
2. Provide thoughtful, evidence-based parenting advice
3. Suggest specific, actionable steps the parent can take
4. Highlight any patterns or concerns that need attention
5. Be empathetic, supportive, and practical

Format your response as follows:
1. A brief summary of what you observed in the conversations
2. Key insights about the child's emotional state and needs
3. Specific advice addressing the parent's question
4. Concrete suggested actions the parent can take

Be warm, supportive, and focus on strengthening the parent-child relationship."""

    # Build the query
    query_parts = [
        f"Parent's Question: {request.parent_question}",
        "",
    ]

    if conversation_context:
        query_parts.append("=== Conversation History ===")
        query_parts.append(conversation_context)
        query_parts.append("")

    if alert_context:
        query_parts.append("=== Safety Alerts ===")
        query_parts.append(alert_context)
        query_parts.append("")

    query_parts.append("Please provide your parenting advice based on the above information.")

    full_query = "\n".join(query_parts)

    # Get advice from LLM
    advice = await llm_service.generate(
        message=full_query,
        child_age=getattr(session, 'child_age', 8),
        temperature=0.7,
        system_prompt=system_prompt
    )

    # Extract insights and suggestions using a follow-up call
    analysis_prompt = f"""Based on the conversation history, provide:
1. A one-sentence summary of the child's overall emotional state
2. 3 key insights about the child (as a JSON array)
3. 3 specific suggested actions for the parent (as a JSON array)

Respond ONLY with valid JSON in this format:
{{
    "summary": "brief summary here",
    "insights": ["insight 1", "insight 2", "insight 3"],
    "actions": ["action 1", "action 2", "action 3"]
}}

Conversation context:
{conversation_context[:1000] if conversation_context else "No conversation history available"}"""

    try:
        analysis_response = await llm_service.generate(
            message=analysis_prompt,
            child_age=getattr(session, 'child_age', 8),
            temperature=0.3,
            system_prompt="You are a data extraction system. Respond only with valid JSON."
        )

        # Parse JSON response
        import json
        if "```json" in analysis_response:
            analysis_response = analysis_response.split("```json")[1].split("```")[0].strip()
        elif "```" in analysis_response:
            analysis_response = analysis_response.split("```")[1].split("```")[0].strip()

        analysis_data = json.loads(analysis_response)

        return ParentAssistantResponse(
            advice=advice,
            conversation_summary=analysis_data.get("summary"),
            key_insights=analysis_data.get("insights", []),
            suggested_actions=analysis_data.get("actions", [])
        )

    except Exception as e:
        print(f"Error extracting insights: {e}")
        # Return just the advice if structured extraction fails
        return ParentAssistantResponse(
            advice=advice,
            conversation_summary=None,
            key_insights=[],
            suggested_actions=[]
        )


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
