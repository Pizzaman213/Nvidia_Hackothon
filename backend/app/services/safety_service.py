"""
Safety Detection and Alert Service
"""
from datetime import datetime, timezone
from typing import Dict, Any
from app.models.alert import SafetyAlert, AlertLevel
from app.services.llm_service import llm_service
from app.utils.logger import setup_logger

logger = setup_logger(__name__)


class SafetyService:
    """
    Service for detecting safety concerns and managing alerts
    """

    # Keywords that trigger immediate safety checks
    CONCERN_KEYWORDS = [
        "hurt", "pain", "bleeding", "fell", "sick", "scared", "afraid",
        "stranger", "alone", "help", "emergency", "broken", "fire",
        "blood", "crying", "can't breathe", "chest pain", "dizzy"
    ]

    URGENT_KEYWORDS = [
        "emergency", "911", "can't breathe", "chest pain", "bleeding badly",
        "unconscious", "fire", "smoke", "poison", "overdose"
    ]

    async def assess_message_safety(
        self,
        message: str,
        child_age: int,
        session_id: str,
        db_session=None
    ) -> Dict[str, Any]:
        """
        Assess if a message from the child contains safety concerns

        Args:
            message: The child's message
            child_age: Age of the child
            session_id: Current session ID
            db_session: Optional database session to fetch conversation history

        Returns:
            Dictionary with safety assessment and potential alert
        """
        logger.info(
            f"Assessing message safety for session {session_id}",
            extra={
                "extra_data": {
                    "session_id": session_id,
                    "child_age": child_age,
                    "message_length": len(message)
                }
            }
        )

        message_lower = message.lower()

        # Quick keyword check for immediate concerns
        has_urgent_keyword = any(keyword in message_lower for keyword in self.URGENT_KEYWORDS)
        has_concern_keyword = any(keyword in message_lower for keyword in self.CONCERN_KEYWORDS)

        if has_urgent_keyword:
            logger.warning(
                f"URGENT keyword detected in message for session {session_id}",
                extra={
                    "extra_data": {
                        "session_id": session_id,
                        "keywords_matched": [kw for kw in self.URGENT_KEYWORDS if kw in message_lower]
                    }
                }
            )
        elif has_concern_keyword:
            logger.info(
                f"Concern keyword detected in message for session {session_id}",
                extra={
                    "extra_data": {
                        "session_id": session_id,
                        "keywords_matched": [kw for kw in self.CONCERN_KEYWORDS if kw in message_lower]
                    }
                }
            )

        # Fetch conversation history for context-aware assessment
        conversation_context = ""
        if db_session:
            from app.models.message import MessageDB
            recent_messages = db_session.query(MessageDB).filter(
                MessageDB.session_id == session_id
            ).order_by(MessageDB.timestamp.desc()).limit(10).all()

            if recent_messages:
                context_parts = []
                for msg in reversed(recent_messages):
                    context_parts.append(f"{msg.role}: {msg.content}")
                conversation_context = "\n".join(context_parts)
                logger.debug(f"Retrieved {len(recent_messages)} messages for context")

        # Use LLM for detailed analysis with conversation context
        logger.debug("Performing detailed safety analysis with LLM")
        safety_analysis = await llm_service.analyze_safety(
            message,
            child_age,
            conversation_context=conversation_context
        )

        # Determine alert level
        alert_level = self._determine_alert_level(
            safety_analysis,
            has_urgent_keyword,
            has_concern_keyword
        )

        logger.info(
            f"Safety analysis complete: level={alert_level.value}, is_safe={safety_analysis.get('is_safe')}",
            extra={
                "extra_data": {
                    "session_id": session_id,
                    "alert_level": alert_level.value,
                    "concern_level": safety_analysis.get("concern_level"),
                    "is_safe": safety_analysis.get("is_safe")
                }
            }
        )

        # Create alert if needed with enhanced AI assessment
        alert = None
        if safety_analysis.get("parent_alert") or alert_level != AlertLevel.INFO:
            # Generate comprehensive AI assessment based on conversation history
            ai_assessment = await self._generate_contextual_assessment(
                message=message,
                safety_analysis=safety_analysis,
                conversation_context=conversation_context,
                child_age=child_age
            )

            alert = SafetyAlert(
                level=alert_level,
                timestamp=datetime.now(timezone.utc),
                message=f"Child said: '{message}'",
                context=safety_analysis.get("reason", "Safety check triggered"),
                ai_assessment=ai_assessment,
                requires_action=alert_level in [AlertLevel.URGENT, AlertLevel.EMERGENCY]
            )

            logger.warning(
                f"Safety alert created: {alert_level.value}",
                extra={
                    "extra_data": {
                        "session_id": session_id,
                        "alert_level": alert_level.value,
                        "requires_action": alert.requires_action,
                        "alert_message": alert.message
                    }
                }
            )

        return {
            "is_safe": safety_analysis.get("is_safe", True),
            "concern_level": safety_analysis.get("concern_level", "none"),
            "alert": alert,
            "recommended_response": safety_analysis.get("recommended_response"),
            "requires_parent_notification": alert is not None
        }

    async def assess_emotional_state(
        self,
        message: str,
        session_id: str
    ) -> Dict[str, Any]:
        """
        Assess the child's emotional state

        Args:
            message: The child's message
            session_id: Current session ID

        Returns:
            Dictionary with emotion and any concerns
        """
        logger.debug(f"Assessing emotional state for session {session_id}")
        emotion = await llm_service.detect_emotion(message)
        logger.info(
            f"Emotion detected: {emotion}",
            extra={
                "extra_data": {
                    "session_id": session_id,
                    "emotion": emotion
                }
            }
        )

        # Negative emotions may warrant parent notification
        concerning_emotions = ["sad", "scared", "angry", "frustrated"]
        is_concerning = emotion in concerning_emotions

        alert = None
        if is_concerning:
            # Check if this is serious enough for an alert
            message_lower = message.lower()
            serious_indicators = ["hate", "everyone hates me", "hurt myself", "go away", "leave me alone forever"]

            if any(indicator in message_lower for indicator in serious_indicators):
                alert = SafetyAlert(
                    level=AlertLevel.WARNING,
                    timestamp=datetime.now(timezone.utc),
                    message=f"Child expressing {emotion} emotion",
                    context=f"Message: '{message}'",
                    ai_assessment=f"Child seems {emotion}. May need attention.",
                    requires_action=False
                )
                logger.warning(
                    f"Emotional concern alert created for session {session_id}",
                    extra={
                        "extra_data": {
                            "session_id": session_id,
                            "emotion": emotion,
                            "serious_indicators": [ind for ind in serious_indicators if ind in message_lower]
                        }
                    }
                )

        return {
            "emotion": emotion,
            "is_concerning": is_concerning,
            "alert": alert
        }

    async def _generate_contextual_assessment(
        self,
        message: str,
        safety_analysis: Dict[str, Any],
        conversation_context: str,
        child_age: int
    ) -> str:
        """
        Generate a comprehensive AI assessment based on conversation history

        Args:
            message: The current message that triggered the alert
            safety_analysis: The safety analysis results
            conversation_context: Previous conversation history
            child_age: Age of the child

        Returns:
            Detailed AI assessment for parent notification
        """
        # Build a prompt for generating contextual assessment
        assessment_prompt = f"""You are analyzing a safety concern from a {child_age}-year-old child's conversation with an AI assistant.

Current message that triggered the alert: "{message}"

Safety analysis results:
- Concern level: {safety_analysis.get('concern_level', 'unknown')}
- Reason: {safety_analysis.get('reason', 'No specific reason provided')}

"""

        if conversation_context:
            assessment_prompt += f"""Recent conversation history:
{conversation_context}

"""

        assessment_prompt += """Based on the conversation history and the current message, provide a detailed assessment for the parent that includes:

1. What the child said or indicated that raised concern
2. Context from previous messages (if relevant)
3. Specific recommendation for the parent (e.g., "Check on child immediately", "Monitor conversation", "Ask child about...", etc.)
4. Level of urgency

Keep your assessment clear, actionable, and focused on the parent's need to understand the situation quickly.

Provide your assessment in 2-3 sentences, focusing on what the parent needs to know and do."""

        try:
            logger.debug("Generating contextual safety assessment")
            assessment = await llm_service.generate(
                message=assessment_prompt,
                child_age=child_age,
                temperature=0.3,  # Lower temperature for consistent, focused assessments
                system_prompt="You are a child safety assessment system. Provide clear, actionable assessments for parents."
            )

            # Clean up the assessment (remove any extra formatting)
            assessment = assessment.strip()

            # If the assessment is too long, truncate it
            if len(assessment) > 500:
                assessment = assessment[:497] + "..."

            logger.debug(f"Generated contextual assessment: {assessment[:100]}...")
            return assessment

        except Exception as e:
            logger.error(
                f"Failed to generate contextual assessment: {str(e)}",
                exc_info=True,
                extra={
                    "extra_data": {
                        "child_age": child_age,
                        "error_type": type(e).__name__
                    }
                }
            )
            # Fallback to the original recommended response if generation fails
            return safety_analysis.get(
                "recommended_response",
                "Immediate parent notification required. Please check on your child."
            )

    def _determine_alert_level(
        self,
        safety_analysis: Dict[str, Any],
        has_urgent_keyword: bool,
        has_concern_keyword: bool
    ) -> AlertLevel:
        """
        Determine the appropriate alert level based on analysis

        Args:
            safety_analysis: LLM safety analysis results
            has_urgent_keyword: Whether urgent keywords were detected
            has_concern_keyword: Whether concern keywords were detected

        Returns:
            AlertLevel enum value
        """
        concern_level = safety_analysis.get("concern_level", "none")

        # Map concern levels to alert levels
        if has_urgent_keyword or concern_level == "critical":
            return AlertLevel.EMERGENCY

        if concern_level == "high":
            return AlertLevel.URGENT

        if concern_level == "medium" or has_concern_keyword:
            return AlertLevel.WARNING

        if concern_level == "low":
            return AlertLevel.INFO

        return AlertLevel.INFO

    async def check_image_safety(self, image_data: bytes) -> Dict[str, Any]:
        """
        Check if an image is safe and appropriate

        Args:
            image_data: Raw image bytes

        Returns:
            Dictionary with safety status
        """
        logger.info("Performing image safety check")

        # Basic image safety check
        # In a production environment, this should integrate with:
        # - OpenAI Moderation API (for GPT-4V analysis)
        # - AWS Rekognition Content Moderation
        # - Google Cloud Vision Safe Search
        # - Azure Content Moderator

        try:
            # Check image size (prevent extremely large files)
            image_size_mb = len(image_data) / (1024 * 1024)
            logger.debug(f"Image size: {image_size_mb:.2f} MB")

            if image_size_mb > 10:
                logger.warning(f"Image rejected: too large ({image_size_mb:.2f} MB)")
                return {
                    "is_safe": False,
                    "concerns": ["Image file too large"],
                    "moderation_labels": ["file_size"]
                }

            # Basic validation - check if it's actually an image
            try:
                from PIL import Image
                import io

                img = Image.open(io.BytesIO(image_data))
                img.verify()
                logger.debug("Image validation passed")
            except Exception as img_error:
                logger.warning(f"Image validation failed: {str(img_error)}")
                return {
                    "is_safe": False,
                    "concerns": ["Invalid image file"],
                    "moderation_labels": ["invalid_file"]
                }

            # For now, return safe by default
            # TODO: CRITICAL SECURITY - Implement actual AI-based image moderation
            # Current implementation does NOT check image content for safety!
            # This should be implemented before production use.
            #
            # Recommended implementation:
            # - Use OpenAI's moderation API or GPT-4V for content analysis
            # - Check for inappropriate content, violence, etc.
            # - Return is_safe=False with specific concerns if issues found
            #
            # Example:
            # if settings.openai_api_key:
            #     moderation_result = await self._moderate_image_with_gpt4v(image_data)
            #     return moderation_result

            logger.debug("Image safety check passed (basic validation only)")
            return {
                "is_safe": True,
                "concerns": [],
                "moderation_labels": []
            }

        except Exception as e:
            # Log error but don't block image processing
            logger.error(
                f"Error in image safety check: {str(e)}",
                exc_info=True,
                extra={
                    "extra_data": {
                        "error_type": type(e).__name__,
                        "image_size_bytes": len(image_data)
                    }
                }
            )
            return {
                "is_safe": True,  # Default to safe on error
                "concerns": [],
                "moderation_labels": []
            }

    async def create_activity_alert(
        self,
        session_id: str,
        activity_type: str,
        duration_minutes: int
    ) -> SafetyAlert | None:
        """
        Create alerts based on activity patterns

        Args:
            session_id: Session ID
            activity_type: Type of activity
            duration_minutes: How long the activity has been going on

        Returns:
            Alert if needed, None otherwise
        """
        logger.debug(
            f"Checking activity duration for session {session_id}",
            extra={
                "extra_data": {
                    "session_id": session_id,
                    "activity_type": activity_type,
                    "duration_minutes": duration_minutes
                }
            }
        )

        # Alert if child has been on too long
        if duration_minutes > 120:  # 2 hours
            logger.info(
                f"Extended session alert created for session {session_id}",
                extra={
                    "extra_data": {
                        "session_id": session_id,
                        "activity_type": activity_type,
                        "duration_minutes": duration_minutes
                    }
                }
            )
            return SafetyAlert(
                level=AlertLevel.INFO,
                timestamp=datetime.now(timezone.utc),
                message=f"Child has been engaged in {activity_type} for {duration_minutes} minutes",
                context="Extended session duration",
                ai_assessment="Consider suggesting a break or checking in",
                requires_action=False
            )

        return None


# Global safety service instance
safety_service = SafetyService()
