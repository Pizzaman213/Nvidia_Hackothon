"""
NVIDIA Nemotron LLM Service
"""
import json
import requests
from typing import Dict, Any
from app.config import settings
from app.utils.prompts import (
    get_system_prompt,
    get_safety_analysis_prompt,
    get_homework_help_prompt,
    get_story_prompt,
    get_emotion_detection_prompt
)


class NemotronLLM:
    """
    Service for interacting with NVIDIA Nemotron LLM
    """

    def __init__(self):
        self.api_key = settings.nvidia_api_key
        self.base_url = settings.nvidia_base_url
        self.model = settings.nvidia_model
        self.default_temperature = settings.llm_temperature
        self.max_tokens = settings.llm_max_tokens

    async def generate(
        self,
        message: str,
        context: str = "",
        child_age: int = 8,
        temperature: float | None = None,
        system_prompt: str | None = None
    ) -> str:
        """
        Generate a response using NVIDIA Nemotron

        Args:
            message: The user's message
            context: Additional context for the conversation
            child_age: Age of the child for appropriate responses
            temperature: Sampling temperature (None = use default)
            system_prompt: Custom system prompt (None = use default)

        Returns:
            Generated response text
        """
        if system_prompt is None:
            system_prompt = get_system_prompt(child_age)

        messages = [
            {"role": "system", "content": system_prompt}
        ]

        if context:
            messages.append({
                "role": "user",
                "content": f"Context: {context}\n\nChild: {message}"
            })
        else:
            messages.append({
                "role": "user",
                "content": message
            })

        try:
            response = requests.post(
                f"{self.base_url}/chat/completions",
                headers={
                    "Authorization": f"Bearer {self.api_key}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": self.model,
                    "messages": messages,
                    "temperature": temperature or self.default_temperature,
                    "max_tokens": self.max_tokens
                },
                timeout=30
            )

            response.raise_for_status()
            result = response.json()
            return result["choices"][0]["message"]["content"]

        except requests.exceptions.RequestException as e:
            print(f"Error calling NVIDIA API: {e}")
            return "I'm having trouble connecting right now. Please try again in a moment."

    async def analyze_safety(self, message: str, child_age: int) -> Dict[str, Any]:
        """
        Analyze a message for safety concerns

        Args:
            message: The child's message to analyze
            child_age: Age of the child

        Returns:
            Dictionary with safety analysis
        """
        prompt = get_safety_analysis_prompt(message, child_age)

        try:
            response = await self.generate(
                message=prompt,
                child_age=child_age,
                temperature=0.1,  # Low temperature for consistent analysis
                system_prompt="You are a safety analysis system. Respond only with valid JSON."
            )

            # Try to parse JSON response
            try:
                # Clean up response if it has markdown code blocks
                if "```json" in response:
                    response = response.split("```json")[1].split("```")[0].strip()
                elif "```" in response:
                    response = response.split("```")[1].split("```")[0].strip()

                safety_data = json.loads(response)
                return safety_data
            except json.JSONDecodeError:
                # Fallback if JSON parsing fails
                return {
                    "is_safe": True,
                    "concern_level": "none",
                    "reason": "Unable to parse safety analysis",
                    "parent_alert": False,
                    "recommended_response": "I'm here to help! What would you like to do?"
                }

        except Exception as e:
            print(f"Error in safety analysis: {e}")
            return {
                "is_safe": True,
                "concern_level": "none",
                "reason": "Safety analysis unavailable",
                "parent_alert": False,
                "recommended_response": "I'm here to help! What would you like to do?"
            }

    async def help_with_homework(
        self,
        problem_description: str,
        child_age: int,
        image_context: str | None = None
    ) -> str:
        """
        Generate homework help response

        Args:
            problem_description: Description of the homework problem
            child_age: Age of the child
            image_context: Optional context from image analysis

        Returns:
            Helpful explanation
        """
        prompt = get_homework_help_prompt(problem_description, child_age, image_context)

        return await self.generate(
            message=prompt,
            child_age=child_age,
            temperature=0.6  # Slightly lower for educational content
        )

    async def generate_story(
        self,
        theme: str,
        child_age: int,
        length: str = "medium"
    ) -> str:
        """
        Generate a story for the child

        Args:
            theme: Story theme or topic
            child_age: Age of the child
            length: Story length (short, medium, long)

        Returns:
            Generated story
        """
        prompt = get_story_prompt(theme, child_age, length)

        return await self.generate(
            message=prompt,
            child_age=child_age,
            temperature=0.8  # Higher for creative storytelling
        )

    async def detect_emotion(self, message: str) -> str:
        """
        Detect emotion from child's message

        Args:
            message: The child's message

        Returns:
            Detected emotion (happy, sad, angry, scared, etc.)
        """
        prompt = get_emotion_detection_prompt(message)

        response = await self.generate(
            message=prompt,
            child_age=8,  # Age doesn't matter for emotion detection
            temperature=0.1,
            system_prompt="You are an emotion detection system. Respond with only one emotion word."
        )

        # Clean and return emotion
        emotion = response.strip().lower()
        valid_emotions = ["happy", "sad", "angry", "scared", "frustrated", "excited", "neutral", "concerned"]

        if emotion in valid_emotions:
            return emotion
        return "neutral"


# Global LLM service instance
llm_service = NemotronLLM()
