"""
Voice Processing Service (STT/TTS)
"""
import os
from pathlib import Path
from typing import Dict, Any
from app.config import settings


class VoiceService:
    """
    Service for speech-to-text and text-to-speech processing
    """

    def __init__(self):
        self.openai_key = settings.openai_api_key
        self.elevenlabs_key = settings.elevenlabs_api_key
        self.audio_dir = Path("./audio_temp")
        self.audio_dir.mkdir(exist_ok=True)

    async def transcribe_audio(self, audio_data: bytes, filename: str = "audio.mp3") -> Dict[str, Any]:
        """
        Transcribe audio to text using Whisper

        Args:
            audio_data: Raw audio bytes
            filename: Original filename for format detection

        Returns:
            Dictionary with transcript and metadata
        """
        if not self.openai_key:
            return {
                "success": False,
                "transcript": "",
                "error": "OpenAI API key not configured for speech-to-text"
            }

        try:
            import openai

            # Save audio temporarily
            temp_path = self.audio_dir / filename
            with open(temp_path, "wb") as f:
                f.write(audio_data)

            # Transcribe with Whisper
            client = openai.OpenAI(api_key=self.openai_key)

            with open(temp_path, "rb") as audio_file:
                transcript = client.audio.transcriptions.create(
                    model="whisper-1",
                    file=audio_file,
                    language="en"
                )

            # Clean up temp file
            os.remove(temp_path)

            return {
                "success": True,
                "transcript": transcript.text,
                "language": "en"
            }

        except Exception as e:
            print(f"Transcription error: {e}")
            return {
                "success": False,
                "transcript": "",
                "error": str(e)
            }

    async def text_to_speech(
        self,
        text: str,
        voice_style: str = "friendly",
        save_path: str | None = None
    ) -> Dict[str, Any]:
        """
        Convert text to speech

        Args:
            text: Text to convert
            voice_style: Voice style (friendly, calm, excited)
            save_path: Optional path to save audio file

        Returns:
            Dictionary with audio data or file path
        """
        # Try ElevenLabs first (highest quality)
        if self.elevenlabs_key:
            return await self._tts_elevenlabs(text, voice_style, save_path)

        # Fallback to OpenAI TTS
        if self.openai_key:
            return await self._tts_openai(text, voice_style, save_path)

        # Last resort: gTTS (free but lower quality)
        return await self._tts_gtts(text, save_path)

    async def _tts_elevenlabs(
        self,
        text: str,
        voice_style: str,
        save_path: str | None
    ) -> Dict[str, Any]:
        """
        Text-to-speech using ElevenLabs

        Args:
            text: Text to convert
            voice_style: Voice style
            save_path: Optional save path

        Returns:
            Dictionary with results
        """
        try:
            from elevenlabs import generate  # type: ignore[import-untyped]

            # Map voice styles to ElevenLabs voices
            voice_map = {
                "friendly": "Bella",  # Warm, friendly voice
                "calm": "Rachel",     # Calm, soothing
                "excited": "Elli"     # Energetic
            }

            voice_name = voice_map.get(voice_style, "Bella")

            audio = generate(
                text=text,
                voice=voice_name,
                api_key=self.elevenlabs_key,
                model="eleven_monolingual_v1"
            )

            # Convert generator to bytes
            audio_bytes = b"".join(audio)

            if save_path:
                with open(save_path, "wb") as f:
                    f.write(audio_bytes)
                return {
                    "success": True,
                    "audio_path": save_path,
                    "provider": "elevenlabs"
                }

            return {
                "success": True,
                "audio_data": audio_bytes,
                "provider": "elevenlabs"
            }

        except Exception as e:
            print(f"ElevenLabs TTS error: {e}")
            # Fallback to OpenAI
            return await self._tts_openai(text, voice_style, save_path)

    async def _tts_openai(
        self,
        text: str,
        voice_style: str,
        save_path: str | None
    ) -> Dict[str, Any]:
        """
        Text-to-speech using OpenAI TTS

        Args:
            text: Text to convert
            voice_style: Voice style
            save_path: Optional save path

        Returns:
            Dictionary with results
        """
        try:
            import openai

            client = openai.OpenAI(api_key=self.openai_key)

            # Map voice styles to OpenAI voices
            voice_map = {
                "friendly": "nova",
                "calm": "shimmer",
                "excited": "alloy"
            }

            voice = voice_map.get(voice_style, "nova")

            response = client.audio.speech.create(
                model="tts-1",
                voice=voice,
                input=text
            )

            # Get audio bytes
            audio_bytes = response.content

            if save_path:
                with open(save_path, "wb") as f:
                    f.write(audio_bytes)
                return {
                    "success": True,
                    "audio_path": save_path,
                    "provider": "openai"
                }

            return {
                "success": True,
                "audio_data": audio_bytes,
                "provider": "openai"
            }

        except Exception as e:
            print(f"OpenAI TTS error: {e}")
            # Fallback to gTTS
            return await self._tts_gtts(text, save_path)

    async def _tts_gtts(self, text: str, save_path: str | None) -> Dict[str, Any]:
        """
        Text-to-speech using gTTS (free, basic)

        Args:
            text: Text to convert
            save_path: Optional save path

        Returns:
            Dictionary with results
        """
        try:
            from gtts import gTTS
            import io

            tts = gTTS(text=text, lang='en', slow=False)

            if save_path:
                tts.save(save_path)
                return {
                    "success": True,
                    "audio_path": save_path,
                    "provider": "gtts"
                }

            # Save to bytes
            audio_buffer = io.BytesIO()
            tts.write_to_fp(audio_buffer)
            audio_buffer.seek(0)

            return {
                "success": True,
                "audio_data": audio_buffer.read(),
                "provider": "gtts"
            }

        except Exception as e:
            print(f"gTTS error: {e}")
            return {
                "success": False,
                "error": str(e)
            }


# Global voice service instance
voice_service = VoiceService()
