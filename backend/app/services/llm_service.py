"""
NVIDIA Nemotron LLM Service
"""
import json
import requests
from typing import Dict, Any, List, Optional, Tuple
from app.config import settings
from app.utils.prompts import (
    get_system_prompt,
    get_safety_analysis_prompt,
    get_homework_help_prompt,
    get_story_prompt,
    get_emotion_detection_prompt
)
from app.utils.logger import setup_logger

logger = setup_logger(__name__)


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

        # Check if API key is properly configured
        if not self.api_key or self.api_key == "your_nvidia_api_key_here" or self.api_key == "":
            logger.error(
                "NVIDIA API key is not configured! Please set NVIDIA_API_KEY in your .env file. "
                "See NVIDIA_API_SETUP.md for instructions.",
                extra={
                    "extra_data": {
                        "base_url": self.base_url,
                        "model": self.model,
                        "has_api_key": False
                    }
                }
            )
        else:
            logger.info(
                f"NemotronLLM initialized with model: {self.model}",
                extra={
                    "extra_data": {
                        "base_url": self.base_url,
                        "model": self.model,
                        "has_api_key": True,
                        "api_key_length": len(self.api_key)
                    }
                }
            )

    async def generate_with_rag(
        self,
        message: str,
        context: str = "",
        child_age: int = 8,
        child_gender: Optional[str] = None,
        temperature: Optional[float] = None,
        system_prompt: Optional[str] = None,
        use_rag: bool = True,
        n_sources: int = 3
    ) -> Tuple[str, List[Dict[str, Any]]]:
        """
        Generate a response using NVIDIA Nemotron with RAG context

        Args:
            message: The user's message
            context: Additional conversation context
            child_age: Age of the child for appropriate responses
            child_gender: Gender preference ('boy', 'girl', or None)
            temperature: Sampling temperature (None = use default)
            system_prompt: Custom system prompt (None = use default)
            use_rag: Whether to use RAG for additional context
            n_sources: Number of knowledge base sources to retrieve

        Returns:
            Tuple of (generated response text, list of source citations)
        """
        sources = []

        if use_rag:
            try:
                # Import here to avoid circular dependency
                from app.services.rag_service import rag_service

                # Retrieve relevant context from knowledge base
                logger.info(f"Retrieving RAG context for: {message[:50]}...")
                relevant_docs = await rag_service.retrieve_relevant_context(
                    query=message,
                    n_results=n_sources
                )

                if relevant_docs:
                    logger.info(f"Found {len(relevant_docs)} relevant documents")

                    # Build RAG context
                    rag_context_parts = ["Here is relevant information from trusted sources:\n"]
                    for i, doc in enumerate(relevant_docs, 1):
                        source_info = doc['metadata']
                        rag_context_parts.append(
                            f"\n[Source {i}: {source_info.get('source_title', 'Unknown')}]\n{doc['text']}\n"
                        )
                        sources.append(doc)

                    rag_context = "\n".join(rag_context_parts)

                    # Prepend RAG context to conversation context
                    if context:
                        context = f"{rag_context}\n\n{context}"
                    else:
                        context = rag_context
                else:
                    logger.info("No relevant documents found in knowledge base")
            except Exception as e:
                logger.error(f"Error retrieving RAG context: {e}", exc_info=True)

        # Generate response with combined context
        response = await self.generate(
            message=message,
            context=context,
            child_age=child_age,
            child_gender=child_gender,
            temperature=temperature,
            system_prompt=system_prompt
        )

        return response, sources

    async def generate(
        self,
        message: str,
        context: str = "",
        child_age: int = 8,
        child_gender: Optional[str] = None,
        temperature: Optional[float] = None,
        system_prompt: Optional[str] = None
    ) -> str:
        """
        Generate a response using NVIDIA Nemotron

        Args:
            message: The user's message
            context: Additional context for the conversation
            child_age: Age of the child for appropriate responses
            child_gender: Gender preference ('boy', 'girl', or None)
            temperature: Sampling temperature (None = use default)
            system_prompt: Custom system prompt (None = use default)

        Returns:
            Generated response text
        """
        logger.info(
            "Generating LLM response",
            extra={
                "extra_data": {
                    "message_length": len(message),
                    "child_age": child_age,
                    "child_gender": child_gender,
                    "has_context": bool(context),
                    "temperature": temperature or self.default_temperature
                }
            }
        )

        if system_prompt is None:
            system_prompt = get_system_prompt(child_age, child_gender)

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

        # Check if API key is configured before making request
        if not self.api_key or self.api_key == "your_nvidia_api_key_here" or self.api_key == "":
            logger.error("Cannot generate response: NVIDIA API key is not configured")
            return "I need to be configured first! Please ask your parent to set up the NVIDIA API key. See NVIDIA_API_SETUP.md for instructions."

        # Clean the URL to remove any invisible characters (including zero-width chars)
        import re
        clean_base_url = re.sub(r'[\u200B-\u200D\uFEFF\s]+$', '', self.base_url.strip())
        api_url = f"{clean_base_url}/chat/completions"
        logger.debug(f"Sending request to NVIDIA API: {api_url}")
        logger.debug(f"URL bytes: {api_url.encode('utf-8')}")

        try:

            response = requests.post(
                api_url,
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

            # Validate response content type
            content_type = response.headers.get("Content-Type", "")
            if "application/json" not in content_type:
                logger.error(f"Non-JSON response from NVIDIA API. Content-Type: {content_type}")
                logger.debug(f"Response preview: {response.text[:200]}")
                return "Received an unexpected response format from the AI service. Please try again."

            result = response.json()

            # Validate response structure
            if "choices" not in result or not result["choices"]:
                logger.error(f"Unexpected API response structure: {result}")
                return "I received an unexpected response. Please try again."

            if not result["choices"][0].get("message") or "content" not in result["choices"][0]["message"]:
                logger.error(f"Missing message content in API response: {result}")
                return "I received an incomplete response. Please try again."

            generated_text = result["choices"][0]["message"]["content"]

            logger.info(
                "LLM response generated successfully",
                extra={
                    "extra_data": {
                        "response_length": len(generated_text),
                        "tokens_used": result.get("usage", {}).get("total_tokens", 0)
                    }
                }
            )

            return generated_text

        except requests.exceptions.Timeout:
            logger.error("NVIDIA API request timed out after 30 seconds")
            return "I'm taking a bit too long to respond. Please try again."

        except requests.exceptions.HTTPError as e:
            # Handle specific HTTP errors
            if e.response is not None:
                status_code = e.response.status_code
                if status_code == 401:
                    logger.error("NVIDIA API key is invalid or expired")
                    return "I'm having authentication issues. Please check if the NVIDIA API key is correct and active."
                elif status_code == 404:
                    logger.error(
                        f"NVIDIA API endpoint not found. URL may be incorrect.",
                        extra={
                            "extra_data": {
                                "base_url": self.base_url,
                                "api_url": api_url,
                                "url_bytes": api_url.encode('utf-8').hex()
                            }
                        }
                    )
                    return "The AI service endpoint was not found. Please check the configuration."
                elif status_code == 429:
                    logger.warning("NVIDIA API rate limit exceeded")
                    return "I'm a bit busy right now. Please wait a moment and try again."
                elif status_code == 503:
                    logger.error("NVIDIA API service unavailable")
                    return "The AI service is temporarily unavailable. Please try again in a moment."

            logger.error(
                f"HTTP error calling NVIDIA API: {str(e)}",
                exc_info=True,
                extra={
                    "extra_data": {
                        "error_type": type(e).__name__,
                        "status_code": e.response.status_code if e.response else None,
                        "model": self.model,
                        "base_url": self.base_url
                    }
                }
            )
            return "I'm having trouble connecting right now. Please try again in a moment."

        except requests.exceptions.RequestException as e:
            logger.error(
                f"Error calling NVIDIA API: {str(e)}",
                exc_info=True,
                extra={
                    "extra_data": {
                        "error_type": type(e).__name__,
                        "model": self.model,
                        "base_url": self.base_url
                    }
                }
            )
            return "I'm having trouble connecting right now. Please try again in a moment."

    async def analyze_safety(
        self,
        message: str,
        child_age: int,
        conversation_context: str = ""
    ) -> Dict[str, Any]:
        """
        Analyze a message for safety concerns

        Args:
            message: The child's message to analyze
            child_age: Age of the child
            conversation_context: Previous conversation history for context

        Returns:
            Dictionary with safety analysis
        """
        logger.info(
            "Analyzing message for safety concerns",
            extra={
                "extra_data": {
                    "message_length": len(message),
                    "child_age": child_age,
                    "has_context": bool(conversation_context)
                }
            }
        )

        prompt = get_safety_analysis_prompt(message, child_age, conversation_context)

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

                logger.info(
                    f"Safety analysis completed: {safety_data.get('concern_level', 'unknown')}",
                    extra={
                        "extra_data": {
                            "is_safe": safety_data.get("is_safe", True),
                            "concern_level": safety_data.get("concern_level", "none"),
                            "parent_alert": safety_data.get("parent_alert", False)
                        }
                    }
                )

                return safety_data

            except json.JSONDecodeError as e:
                logger.warning(
                    f"Failed to parse safety analysis JSON: {str(e)}",
                    extra={
                        "extra_data": {
                            "response_preview": response[:200]
                        }
                    }
                )
                # Fallback if JSON parsing fails
                return {
                    "is_safe": True,
                    "concern_level": "none",
                    "reason": "Unable to parse safety analysis",
                    "parent_alert": False,
                    "recommended_response": "I'm here to help! What would you like to do?"
                }

        except Exception as e:
            logger.error(
                f"Error in safety analysis: {str(e)}",
                exc_info=True,
                extra={
                    "extra_data": {
                        "error_type": type(e).__name__,
                        "child_age": child_age
                    }
                }
            )
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
        image_context: Optional[str] = None
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
        child_gender: Optional[str] = None,
        length: str = "medium"
    ) -> str:
        """
        Generate a story for the child

        Args:
            theme: Story theme or topic
            child_age: Age of the child
            child_gender: Gender preference ('boy', 'girl', or None)
            length: Story length (short, medium, long)

        Returns:
            Generated story
        """
        prompt = get_story_prompt(theme, child_age, length)

        return await self.generate(
            message=prompt,
            child_age=child_age,
            child_gender=child_gender,
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
