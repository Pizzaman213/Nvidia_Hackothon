"""
Safety Detection and Alert Service
"""
from datetime import datetime, timezone
from typing import Dict, Any
from app.models.alert import SafetyAlert, AlertLevel
from app.services.llm_service import llm_service


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
        session_id: str
    ) -> Dict[str, Any]:
        """
        Assess if a message from the child contains safety concerns

        Args:
            message: The child's message
            child_age: Age of the child
            session_id: Current session ID

        Returns:
            Dictionary with safety assessment and potential alert
        """
        message_lower = message.lower()

        # Quick keyword check for immediate concerns
        has_urgent_keyword = any(keyword in message_lower for keyword in self.URGENT_KEYWORDS)
        has_concern_keyword = any(keyword in message_lower for keyword in self.CONCERN_KEYWORDS)

        # Use LLM for detailed analysis
        safety_analysis = await llm_service.analyze_safety(message, child_age)

        # Determine alert level
        alert_level = self._determine_alert_level(
            safety_analysis,
            has_urgent_keyword,
            has_concern_keyword
        )

        # Create alert if needed
        alert = None
        if safety_analysis.get("parent_alert") or alert_level != AlertLevel.INFO:
            alert = SafetyAlert(
                level=alert_level,
                timestamp=datetime.now(timezone.utc),
                message=f"Child said: '{message}'",
                context=safety_analysis.get("reason", "Safety check triggered"),
                ai_assessment=safety_analysis.get("recommended_response", ""),
                requires_action=alert_level in [AlertLevel.URGENT, AlertLevel.EMERGENCY]
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
        emotion = await llm_service.detect_emotion(message)

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

        return {
            "emotion": emotion,
            "is_concerning": is_concerning,
            "alert": alert
        }

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
        # TODO: Implement actual image moderation
        # This would use OpenAI Moderation API or similar
        # For now, return safe by default

        return {
            "is_safe": True,
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
        # Alert if child has been on too long
        if duration_minutes > 120:  # 2 hours
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
