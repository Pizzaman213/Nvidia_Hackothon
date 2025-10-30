"""
Vision Service for Image Analysis
"""
import base64
from typing import Dict, Any
from app.config import settings
from app.utils.prompts import get_image_analysis_prompt


class VisionService:
    """
    Service for analyzing images using vision models
    """

    def __init__(self):
        self.nvidia_api_key = settings.nvidia_api_key
        self.nvidia_cosmos_enabled = settings.nvidia_cosmos_enabled
        self.nvidia_cosmos_model = settings.nvidia_cosmos_model
        self.nvidia_cosmos_base_url = settings.nvidia_cosmos_base_url
        self.openai_key = settings.openai_api_key
        self.anthropic_key = settings.anthropic_api_key

    async def analyze_image(
        self,
        image_data: bytes,
        context: str,
        child_age: int,
        additional_prompt: str = ""
    ) -> Dict[str, Any]:
        """
        Analyze an image based on context

        Args:
            image_data: Raw image bytes
            context: Analysis context (homework, game, safety_check, show_tell)
            child_age: Age of the child
            additional_prompt: Additional instructions for analysis

        Returns:
            Dictionary with analysis results
        """
        # Get context-specific prompt
        base_prompt = get_image_analysis_prompt(context, child_age)

        if additional_prompt:
            full_prompt = f"{base_prompt}\n\nAdditional context: {additional_prompt}"
        else:
            full_prompt = base_prompt

        # Try NVIDIA Cosmos Vision first if enabled and API key available
        if self.nvidia_cosmos_enabled and self.nvidia_api_key:
            result = await self._analyze_with_nvidia_cosmos(image_data, full_prompt)
            if result:
                return {
                    "success": True,
                    "analysis": result,
                    "context": context,
                    "provider": "nvidia_cosmos"
                }

        # Try OpenAI GPT-4 Vision if available
        if self.openai_key:
            result = await self._analyze_with_openai(image_data, full_prompt)
            if result:
                return {
                    "success": True,
                    "analysis": result,
                    "context": context,
                    "provider": "openai"
                }

        # Fallback to Anthropic Claude if available
        if self.anthropic_key:
            result = await self._analyze_with_anthropic(image_data, full_prompt)
            if result:
                return {
                    "success": True,
                    "analysis": result,
                    "context": context,
                    "provider": "anthropic"
                }

        # If no vision API is available, return basic response
        return {
            "success": False,
            "analysis": "Image analysis is not currently available. Please configure NVIDIA, OpenAI, or Anthropic API keys.",
            "context": context,
            "provider": "none"
        }

    async def _analyze_with_nvidia_cosmos(self, image_data: bytes, prompt: str) -> str | None:
        """
        Analyze image using NVIDIA Cosmos Reason1 7B Vision Model

        Args:
            image_data: Raw image bytes
            prompt: Analysis prompt

        Returns:
            Analysis text or None if failed
        """
        try:
            import openai

            # NVIDIA uses OpenAI-compatible API
            client = openai.OpenAI(
                base_url=self.nvidia_cosmos_base_url,
                api_key=self.nvidia_api_key
            )

            # Encode image to base64
            image_base64 = base64.b64encode(image_data).decode('utf-8')

            response = client.chat.completions.create(
                model=self.nvidia_cosmos_model,
                messages=[
                    {
                        "role": "user",
                        "content": [
                            {"type": "text", "text": prompt},
                            {
                                "type": "image_url",
                                "image_url": {
                                    "url": f"data:image/jpeg;base64,{image_base64}"
                                }
                            }
                        ]
                    }
                ],
                max_tokens=512,
                temperature=0.7,
                top_p=0.9,
                stream=False
            )

            return response.choices[0].message.content

        except Exception as e:
            print(f"NVIDIA Cosmos vision error: {e}")
            return None

    async def _analyze_with_openai(self, image_data: bytes, prompt: str) -> str | None:
        """
        Analyze image using OpenAI GPT-4 Vision

        Args:
            image_data: Raw image bytes
            prompt: Analysis prompt

        Returns:
            Analysis text or None if failed
        """
        try:
            import openai

            client = openai.OpenAI(api_key=self.openai_key)

            # Encode image to base64
            image_base64 = base64.b64encode(image_data).decode('utf-8')

            response = client.chat.completions.create(
                model="gpt-4-vision-preview",
                messages=[
                    {
                        "role": "user",
                        "content": [
                            {"type": "text", "text": prompt},
                            {
                                "type": "image_url",
                                "image_url": {
                                    "url": f"data:image/jpeg;base64,{image_base64}"
                                }
                            }
                        ]
                    }
                ],
                max_tokens=500
            )

            return response.choices[0].message.content

        except Exception as e:
            print(f"OpenAI vision error: {e}")
            return None

    async def _analyze_with_anthropic(self, image_data: bytes, prompt: str) -> str | None:
        """
        Analyze image using Anthropic Claude with vision

        Args:
            image_data: Raw image bytes
            prompt: Analysis prompt

        Returns:
            Analysis text or None if failed
        """
        try:
            import anthropic

            client = anthropic.Anthropic(api_key=self.anthropic_key)

            # Encode image to base64
            image_base64 = base64.b64encode(image_data).decode('utf-8')

            message = client.messages.create(
                model="claude-3-opus-20240229",
                max_tokens=500,
                messages=[
                    {
                        "role": "user",
                        "content": [
                            {
                                "type": "image",
                                "source": {
                                    "type": "base64",
                                    "media_type": "image/jpeg",
                                    "data": image_base64,
                                },
                            },
                            {
                                "type": "text",
                                "text": prompt
                            }
                        ],
                    }
                ],
            )

            # Extract text from content blocks
            for block in message.content:
                if hasattr(block, 'text'):
                    return getattr(block, 'text')

            return None

        except Exception as e:
            print(f"Anthropic vision error: {e}")
            return None

    async def analyze_homework(
        self,
        image_data: bytes,
        child_age: int
    ) -> Dict[str, Any]:
        """
        Analyze homework image specifically

        Args:
            image_data: Raw image bytes
            child_age: Age of the child

        Returns:
            Homework analysis
        """
        result = await self.analyze_image(image_data, "homework", child_age)

        return {
            "subject": self._detect_subject(result.get("analysis", "")),
            "analysis": result.get("analysis", ""),
            "can_help": result.get("success", False)
        }

    async def identify_objects(self, image_data: bytes) -> Dict[str, Any]:
        """
        Identify objects in image for games like "I Spy"

        Args:
            image_data: Raw image bytes

        Returns:
            List of identified objects
        """
        result = await self.analyze_image(image_data, "game", child_age=8)

        # Extract objects from analysis
        analysis_text = result.get("analysis", "")

        return {
            "objects": self._extract_objects(analysis_text),
            "description": analysis_text
        }

    async def safety_check_image(self, image_data: bytes) -> Dict[str, Any]:
        """
        Check image for safety concerns

        Args:
            image_data: Raw image bytes

        Returns:
            Safety analysis
        """
        result = await self.analyze_image(image_data, "safety_check", child_age=8)

        analysis = result.get("analysis", "").lower()

        # Simple keyword detection for concerns
        concern_keywords = ["danger", "unsafe", "concern", "injury", "inappropriate"]
        has_concern = any(keyword in analysis for keyword in concern_keywords)

        return {
            "is_safe": not has_concern,
            "analysis": result.get("analysis", ""),
            "concerns": [kw for kw in concern_keywords if kw in analysis]
        }

    def _detect_subject(self, analysis: str) -> str:
        """
        Detect subject area from analysis text

        Args:
            analysis: Analysis text

        Returns:
            Subject name
        """
        analysis_lower = analysis.lower()

        subjects = {
            "math": ["math", "arithmetic", "algebra", "geometry", "calculation", "equation"],
            "reading": ["reading", "story", "comprehension", "text", "paragraph"],
            "science": ["science", "biology", "chemistry", "physics", "experiment"],
            "writing": ["writing", "essay", "composition", "grammar"],
            "social_studies": ["history", "geography", "social studies", "map"]
        }

        for subject, keywords in subjects.items():
            if any(keyword in analysis_lower for keyword in keywords):
                return subject

        return "general"

    def _extract_objects(self, analysis: str) -> list[str]:
        """
        Extract object list from analysis text

        Args:
            analysis: Analysis text

        Returns:
            List of objects
        """
        # Simple extraction - split by common separators
        # This is basic; real implementation might use NLP
        objects = []

        # Look for lists in the text
        lines = analysis.split("\n")
        for line in lines:
            # Check if line looks like a list item
            if line.strip().startswith("-") or line.strip().startswith("•"):
                obj = line.strip().lstrip("-•").strip()
                if obj and len(obj) < 50:  # Reasonable object name length
                    objects.append(obj)

        return objects[:20]  # Limit to 20 objects


# Global vision service instance
vision_service = VisionService()
