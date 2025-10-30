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

# Import routers
from app.api import chat, images, sessions, voice, activities, alerts, emergency, parent_assistant
from app.api import settings as settings_router

# Create FastAPI app
app = FastAPI(
    title="AI Babysitter Backend",
    description="Backend API for AI Babysitter Assistant with NVIDIA Nemotron",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify exact origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create audio directory for serving files
audio_dir = Path("./audio_temp")
audio_dir.mkdir(exist_ok=True)

# Mount static files for audio
app.mount("/audio", StaticFiles(directory=str(audio_dir)), name="audio")

# Include routers
app.include_router(chat.router)
app.include_router(images.router)
app.include_router(sessions.router)
app.include_router(voice.router)
app.include_router(activities.router)
app.include_router(alerts.router)
app.include_router(emergency.router)
app.include_router(settings_router.router)
app.include_router(parent_assistant.router)


@app.on_event("startup")
async def startup_event():
    """Initialize database on startup"""
    print("Initializing database...")
    init_db()
    print("Database initialized!")
    print(f"Server starting on {settings.host}:{settings.port}")


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "AI Babysitter Backend API",
        "version": "1.0.0",
        "status": "running",
        "docs": "/docs"
    }


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "nvidia_api_configured": bool(settings.nvidia_api_key),
        "openai_api_configured": bool(settings.openai_api_key),
        "anthropic_api_configured": bool(settings.anthropic_api_key),
        "elevenlabs_api_configured": bool(settings.elevenlabs_api_key)
    }


@app.websocket("/ws/parent/{parent_id}")
async def websocket_parent(websocket: WebSocket, parent_id: str):
    """
    WebSocket endpoint for real-time parent notifications

    Args:
        parent_id: Parent's unique ID
        websocket: WebSocket connection
    """
    await notification_service.connect(parent_id, websocket)

    try:
        while True:
            # Keep connection alive by receiving messages
            # Parent can send heartbeat messages
            data = await websocket.receive_text()

            # Handle ping/pong for keepalive
            if data == "ping":
                await websocket.send_text("pong")

    except WebSocketDisconnect:
        notification_service.disconnect(parent_id, websocket)
        print(f"WebSocket disconnected for parent {parent_id}")

    except Exception as e:
        print(f"WebSocket error for parent {parent_id}: {e}")
        notification_service.disconnect(parent_id, websocket)


# Development server
if __name__ == "__main__":
    uvicorn.run(
        "app.main:app",
        host=settings.host,
        port=settings.port,
        reload=settings.debug
    )
