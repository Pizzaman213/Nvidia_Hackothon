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
    nvidia_model: str = "llama-3.3-nemotron-super-49b-v1.5"

    # NVIDIA Cosmos Vision
    nvidia_cosmos_enabled: bool = True
    nvidia_cosmos_model: str = "nvidia/cosmos-reason1-7b"
    nvidia_cosmos_base_url: str = "https://integrate.api.nvidia.com/v1"

    # OpenAI
    openai_api_key: Optional[str] = None

    # Anthropic
    anthropic_api_key: Optional[str] = None

    # ElevenLabs
    elevenlabs_api_key: Optional[str] = None

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

    # Safety Settings
    max_session_duration_hours: int = 8
    alert_webhook_url: Optional[str] = None

    # LLM Parameters
    llm_temperature: float = 0.7
    llm_max_tokens: int = 2048

    # File Upload Limits
    max_image_size_mb: int = 10
    max_audio_duration_seconds: int = 300

    class Config:
        env_file = ".env"
        case_sensitive = False


# Global settings instance
settings = Settings()
