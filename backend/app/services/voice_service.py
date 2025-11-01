"""
Voice Processing Service (STT/TTS)
"""
import os
import re
from pathlib import Path
from typing import Dict, Any
from app.config import settings
from app.utils.logger import setup_logger

logger = setup_logger(__name__)


class VoiceService:
    """
    Service for speech-to-text and text-to-speech processing
    """

    def __init__(self):
        self.openai_key = settings.openai_api_key
        self.elevenlabs_key = settings.elevenlabs_api_key
        self.nvidia_api_key = settings.nvidia_api_key
        self.nvidia_riva_enabled = settings.nvidia_riva_enabled
        self.nvidia_riva_local_url = settings.nvidia_riva_local_url
        self.nvidia_riva_voice = settings.nvidia_riva_voice
        self.nvidia_riva_sample_rate = settings.nvidia_riva_sample_rate
        self.default_tts_provider = settings.default_tts_provider
        self.audio_dir = Path("./audio_temp")
        self.audio_dir.mkdir(exist_ok=True)

    def clean_text_for_speech(self, text: str) -> str:
        """
        Remove emojis, asterisks, and other non-speech elements from text before TTS.
        Keeps only text that should be read aloud.

        Args:
            text: Raw text with possible emojis, asterisks, and symbols

        Returns:
            Cleaned text suitable for speech synthesis
        """
        # Remove emojis (comprehensive pattern)
        # This matches all emoji Unicode ranges
        emoji_pattern = re.compile(
            "["
            "\U0001F600-\U0001F64F"  # emoticons
            "\U0001F300-\U0001F5FF"  # symbols & pictographs
            "\U0001F680-\U0001F6FF"  # transport & map symbols
            "\U0001F1E0-\U0001F1FF"  # flags (iOS)
            "\U00002702-\U000027B0"  # dingbats
            "\U000024C2-\U0001F251"  # enclosed characters
            "\U0001F900-\U0001F9FF"  # supplemental symbols
            "\U0001FA00-\U0001FA6F"  # chess symbols
            "\U0001FA70-\U0001FAFF"  # symbols and pictographs extended-A
            "\U00002600-\U000026FF"  # miscellaneous symbols
            "\U00002700-\U000027BF"  # dingbats
            "]+",
            flags=re.UNICODE
        )

        # Remove emojis
        text = emoji_pattern.sub('', text)

        # Remove asterisks (used for markdown emphasis/bold)
        text = re.sub(r'\*', '', text)

        # Remove multiple spaces created by emoji/asterisk removal
        text = re.sub(r'\s+', ' ', text)

        # Remove standalone punctuation that may be left over
        text = re.sub(r'\s+([.!?,;:])\s+', r'\1 ', text)

        # Strip leading/trailing whitespace
        text = text.strip()

        return text

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
        Convert text to speech using the default TTS provider specified in config

        Args:
            text: Text to convert (will be cleaned of emojis and non-speech elements)
            voice_style: Voice style (friendly, calm, excited)
            save_path: Optional path to save audio file

        Returns:
            Dictionary with audio data or file path
        """
        # Clean text: remove emojis and other non-speech elements
        clean_text = self.clean_text_for_speech(text)

        # If after cleaning there's no text left, return error
        if not clean_text or not clean_text.strip():
            return {
                "success": False,
                "error": "No readable text found after cleaning"
            }

        # Use only the default TTS provider specified in config
        provider = self.default_tts_provider.lower()

        if provider == "nvidia_riva":
            if self.nvidia_riva_enabled and self.nvidia_api_key:
                return await self._tts_nvidia_riva(clean_text, voice_style, save_path)
            else:
                return {
                    "success": False,
                    "error": "NVIDIA Riva TTS is not enabled or configured. Check NVIDIA_RIVA_ENABLED and NVIDIA_API_KEY in .env"
                }

        elif provider == "elevenlabs":
            if self.elevenlabs_key:
                return await self._tts_elevenlabs(clean_text, voice_style, save_path)
            else:
                return {
                    "success": False,
                    "error": "ElevenLabs API key not configured. Set ELEVENLABS_API_KEY in .env"
                }

        elif provider == "openai":
            if self.openai_key:
                return await self._tts_openai(clean_text, voice_style, save_path)
            else:
                return {
                    "success": False,
                    "error": "OpenAI API key not configured. Set OPENAI_API_KEY in .env"
                }

        elif provider == "gtts":
            return await self._tts_gtts(clean_text, save_path)

        else:
            return {
                "success": False,
                "error": f"Unknown TTS provider: {provider}. Valid options: nvidia_riva, elevenlabs, openai, gtts"
            }

    async def _tts_nvidia_riva(
        self,
        text: str,
        voice_style: str,
        save_path: str | None
    ) -> Dict[str, Any]:
        """
        Text-to-speech using local NVIDIA Riva TTS server via gRPC

        Args:
            text: Text to convert
            voice_style: Voice style (friendly, calm, excited)
            save_path: Optional save path

        Returns:
            Dictionary with results
        """
        try:
            import grpc
            import riva.client

            # Map voice styles to NVIDIA Riva voices
            voice_map = {
                "friendly": "English-US-Female-1",
                "calm": "English-US-Male-1",
                "excited": "English-US-Female-2"
            }

            selected_voice = voice_map.get(voice_style, self.nvidia_riva_voice)

            # Create gRPC channel to local Riva server
            channel = grpc.insecure_channel(self.nvidia_riva_local_url)

            # Create Riva TTS client
            auth = riva.client.Auth(uri=self.nvidia_riva_local_url)
            tts_service = riva.client.SpeechSynthesisService(auth)

            # Synthesize speech
            req = {
                "text": text,
                "language_code": "en-US",
                "voice_name": selected_voice,
                "sample_rate_hz": self.nvidia_riva_sample_rate,
                "encoding": riva.client.AudioEncoding.LINEAR_PCM
            }

            response = tts_service.synthesize(**req)
            audio_bytes = response.audio

            # Convert PCM to WAV format
            import wave
            import io

            wav_buffer = io.BytesIO()
            with wave.open(wav_buffer, 'wb') as wav_file:
                wav_file.setnchannels(1)  # Mono
                wav_file.setsampwidth(2)  # 16-bit
                wav_file.setframerate(self.nvidia_riva_sample_rate)
                wav_file.writeframes(audio_bytes)

            wav_buffer.seek(0)
            audio_bytes = wav_buffer.read()

            if save_path:
                # Change extension to .wav if needed
                if save_path.endswith('.mp3'):
                    save_path = save_path.replace('.mp3', '.wav')

                with open(save_path, "wb") as f:
                    f.write(audio_bytes)
                return {
                    "success": True,
                    "audio_path": save_path,
                    "provider": "nvidia_riva"
                }

            return {
                "success": True,
                "audio_data": audio_bytes,
                "provider": "nvidia_riva"
            }

        except Exception as e:
            print(f"NVIDIA Riva TTS error: {e}")
            return {
                "success": False,
                "error": f"NVIDIA Riva TTS failed: {str(e)}"
            }

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
            return {
                "success": False,
                "error": f"ElevenLabs TTS failed: {str(e)}"
            }

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
            return {
                "success": False,
                "error": f"OpenAI TTS failed: {str(e)}"
            }

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
