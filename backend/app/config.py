"""
Configuration module for AI Babysitter Backend
"""
from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    """Application settings loaded from environment variables"""

    # NVIDIA Nemotron
    nvidia_api_key: str = ""
    nvidia_base_url: str = "https://integrate.api.nvidia.com/v1"
    nvidia_model: str = "nvidia/llama-3.3-nemotron-super-49b-v1.5"

    # NVIDIA Vision (Llama 3.2 Vision)
    # Uses the same NVIDIA_API_KEY as Nemotron LLM
    nvidia_cosmos_enabled: bool = True
    nvidia_cosmos_model: str = "meta/llama-3.2-11b-vision-instruct"
    nvidia_cosmos_base_url: str = "https://integrate.api.nvidia.com/v1"

    # OpenAI
    openai_api_key: Optional[str] = None

    # Anthropic
    anthropic_api_key: Optional[str] = None

    # ElevenLabs
    elevenlabs_api_key: Optional[str] = None

    # NVIDIA Riva TTS (Local Server)
    # Requires local Riva TTS server running (see setup_riva_local.sh)
    nvidia_riva_enabled: bool = False  # Enable after setting up local Riva
    nvidia_riva_local_url: str = "localhost:50051"  # Local gRPC endpoint
    nvidia_riva_voice: str = "English-US-Female-1"  # Default voice
    nvidia_riva_sample_rate: int = 22050  # Audio sample rate

    # Default TTS Provider
    # Options: "nvidia_riva", "elevenlabs", "openai", "gtts"
    default_tts_provider: str = "gtts"

    # Database
    database_url: str = "sqlite:///./babysitter.db"

    # Redis
    redis_url: str = "redis://localhost:6379/0"

    # Security
    secret_key: str = "dev-secret-key-change-in-production"
    algorithm: str = "HS256"

    # Server
    host: str = "0.0.0.0"
    port: int = 8000
    debug: bool = True
    cors_origins: str = "*"  # Comma-separated list or "*" for all

    # Logging Configuration
    logging_enabled: bool = True
    log_level: str = "INFO"
    log_to_file: bool = True
    log_to_console: bool = True
    log_format: str = "text"  # "text" or "json"
    log_requests: bool = True

    # Safety Settings
    max_session_duration_hours: int = 8
    alert_webhook_url: Optional[str] = None

    # LLM Parameters
    llm_temperature: float = 0.7
    llm_max_tokens: int = 2048

    # File Upload Limits
    max_image_size_mb: int = 10
    max_audio_duration_seconds: int = 300

    model_config = {
        "env_file": ".env",
        "case_sensitive": False,
        "extra": "ignore"
    }


# Global settings instance
settings = Settings()
