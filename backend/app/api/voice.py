"""
Voice Processing API Endpoints
"""
from fastapi import APIRouter, HTTPException, UploadFile, File
from pydantic import BaseModel

from app.services.voice_service import voice_service
from app.utils.logger import setup_logger

logger = setup_logger(__name__)

router = APIRouter(prefix="/api/voice", tags=["voice"])


class TranscriptionResponse(BaseModel):
    """Response model for transcription"""
    success: bool
    transcript: str
    language: str = "en"
    error: str | None = None


@router.post("/transcribe", response_model=TranscriptionResponse)
async def transcribe_audio(audio: UploadFile = File(...)):
    """
    Convert speech to text using Whisper
    """
    # Validate file type
    if not audio.content_type or not audio.content_type.startswith("audio/"):
        raise HTTPException(
            status_code=400,
            detail="Invalid file type. Must be audio file."
        )

    # Read audio data
    audio_bytes = await audio.read()

    # Check file size (5MB limit for audio)
    if len(audio_bytes) > 5 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Audio file too large (max 5MB)")

    # Transcribe
    result = await voice_service.transcribe_audio(
        audio_bytes,
        audio.filename or "audio.mp3"
    )

    if not result.get("success"):
        return TranscriptionResponse(
            success=False,
            transcript="",
            error=result.get("error", "Transcription failed")
        )

    return TranscriptionResponse(
        success=True,
        transcript=result["transcript"],
        language=result.get("language", "en")
    )


class TTSRequest(BaseModel):
    """Request model for text-to-speech"""
    text: str
    voice_style: str = "friendly"  # friendly, calm, excited


class TTSResponse(BaseModel):
    """Response model for text-to-speech"""
    success: bool
    audio_url: str | None = None
    provider: str | None = None
    error: str | None = None


@router.post("/synthesize", response_model=TTSResponse)
async def synthesize_speech(request: TTSRequest):
    """
    Convert text to speech
    """
    if not request.text or len(request.text) > 5000:
        raise HTTPException(
            status_code=400,
            detail="Text must be between 1 and 5000 characters"
        )

    # Generate speech
    import uuid
    audio_filename = f"{uuid.uuid4()}.mp3"
    audio_path = f"./audio_temp/{audio_filename}"

    result = await voice_service.text_to_speech(
        request.text,
        request.voice_style,
        audio_path
    )

    if not result.get("success"):
        return TTSResponse(
            success=False,
            error=result.get("error", "Speech synthesis failed")
        )

    return TTSResponse(
        success=True,
        audio_url=f"/audio/{audio_filename}",
        provider=result.get("provider")
    )
