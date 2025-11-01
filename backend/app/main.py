"""
AI Babysitter Backend - Main FastAPI Application
"""
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pathlib import Path
import uvicorn

from app.config import settings
from app.database.db import init_db
from app.services.notification_service import notification_service
from app.utils.logger import setup_logger
from app.middleware.logging_middleware import LoggingMiddleware

# Set up logger
logger = setup_logger(__name__)

# Import routers
from app.api import chat, images, sessions, voice, activities, alerts, emergency, parent_assistant, children, citations, child_settings, webrtc_signaling
from app.api import settings as settings_router

# Create FastAPI app
app = FastAPI(
    title="AI Babysitter Backend",
    description="Backend API for AI Babysitter Assistant with NVIDIA Nemotron",
    version="1.0.0"
)

# Add logging middleware if enabled (first, so it logs everything)
if settings.logging_enabled and settings.log_requests:
    app.add_middleware(LoggingMiddleware)
    logger.info("Request logging middleware enabled")

# CORS middleware - configurable via environment
cors_origins = settings.cors_origins.split(",") if settings.cors_origins != "*" else ["*"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

if settings.logging_enabled:
    logger.info("FastAPI application initialized")
    logger.info(f"Logging configuration: level={settings.log_level}, format={settings.log_format}")

# Create audio directory for serving files
audio_dir = Path("./audio_temp")
audio_dir.mkdir(exist_ok=True)

# Mount static files for audio
app.mount("/audio", StaticFiles(directory=str(audio_dir)), name="audio")

# Include routers
app.include_router(children.router)
app.include_router(child_settings.router)
app.include_router(chat.router)
app.include_router(images.router)
app.include_router(sessions.router)
app.include_router(voice.router)
app.include_router(activities.router)
app.include_router(alerts.router)
app.include_router(emergency.router)
app.include_router(settings_router.router)
app.include_router(parent_assistant.router)
app.include_router(citations.router)
app.include_router(webrtc_signaling.router)


@app.on_event("startup")
async def startup_event():
    """Initialize database on startup"""
    logger.info("Application startup initiated")
    logger.info("Initializing database...")

    try:
        init_db()
        logger.info("Database initialized successfully")
    except Exception as e:
        logger.error(f"Failed to initialize database: {str(e)}", exc_info=True)
        raise

    # Initialize RAG knowledge base
    try:
        logger.info("Checking RAG knowledge base...")
        from app.utils.ingest_knowledge import check_knowledge_base
        result = await check_knowledge_base()
        if result.get("success"):
            logger.info("RAG knowledge base ready")
        else:
            logger.warning(f"RAG knowledge base issue: {result.get('error', 'Unknown error')}")
    except Exception as e:
        logger.warning(f"Failed to initialize RAG knowledge base: {str(e)}")
        logger.info("Application will continue without RAG features")

    # Validate NVIDIA API key configuration
    if not settings.nvidia_api_key or settings.nvidia_api_key == "your_nvidia_api_key_here":
        logger.error("")
        logger.error("=" * 80)
        logger.error("  CRITICAL: NVIDIA API KEY NOT CONFIGURED!")
        logger.error("=" * 80)
        logger.error("")
        logger.error("  The chat functionality will NOT work without a valid NVIDIA API key.")
        logger.error("")
        logger.error("  To fix this:")
        logger.error("    1. Get your free API key from: https://build.nvidia.com")
        logger.error("    2. Edit backend/.env and set: NVIDIA_API_KEY=your_actual_key")
        logger.error("    3. Restart the backend server")
        logger.error("")
        logger.error("  See NVIDIA_API_SETUP.md for detailed instructions")
        logger.error("=" * 80)
        logger.error("")
    else:
        logger.info(f"NVIDIA API key configured: ✓ (length: {len(settings.nvidia_api_key)})")

    logger.info(f"Server starting on {settings.host}:{settings.port}")
    logger.info(f"Debug mode: {settings.debug}")
    logger.info(f"OpenAI API configured: {bool(settings.openai_api_key)}")
    logger.info(f"Anthropic API configured: {bool(settings.anthropic_api_key)}")


@app.get("/")
async def root():
    """Root endpoint"""
    logger.debug("Root endpoint accessed")
    return {
        "message": "AI Babysitter Backend API",
        "version": "1.0.0",
        "status": "running",
        "docs": "/docs"
    }


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    logger.debug("Health check endpoint accessed")
    health_status = {
        "status": "healthy",
        "nvidia_api_configured": bool(settings.nvidia_api_key),
        "openai_api_configured": bool(settings.openai_api_key),
        "anthropic_api_configured": bool(settings.anthropic_api_key),
        "elevenlabs_api_configured": bool(settings.elevenlabs_api_key)
    }
    logger.debug(f"Health status: {health_status}")
    return health_status


@app.websocket("/ws/parent/{parent_id}")
async def websocket_parent(websocket: WebSocket, parent_id: str):
    """
    WebSocket endpoint for real-time parent notifications

    Args:
        parent_id: Parent's unique ID
        websocket: WebSocket connection
    """
    logger.info(f"WebSocket connection initiated for parent {parent_id}")

    try:
        await notification_service.connect(parent_id, websocket)
        logger.info(f"WebSocket connected successfully for parent {parent_id}")

        while True:
            # Keep connection alive by receiving messages
            # Parent can send heartbeat messages
            data = await websocket.receive_text()

            # Handle ping/pong for keepalive
            if data == "ping":
                await websocket.send_text("pong")
                logger.debug(f"Heartbeat received from parent {parent_id}")

    except WebSocketDisconnect:
        notification_service.disconnect(parent_id, websocket)
        logger.info(f"WebSocket disconnected for parent {parent_id}")

    except Exception as e:
        logger.error(
            f"WebSocket error for parent {parent_id}: {str(e)}",
            exc_info=True,
            extra={
                "extra_data": {
                    "parent_id": parent_id,
                    "error_type": type(e).__name__
                }
            }
        )
        notification_service.disconnect(parent_id, websocket)


# Development server
if __name__ == "__main__":
    uvicorn.run(
        "app.main:app",
        host=settings.host,
        port=settings.port,
        reload=settings.debug
    )
