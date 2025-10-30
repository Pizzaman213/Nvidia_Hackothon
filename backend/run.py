#!/usr/bin/env python
"""
Development server runner
"""
import uvicorn
from app.config import settings

if __name__ == "__main__":
    print("=" * 60)
    print("AI Babysitter Backend Server")
    print("=" * 60)
    print(f"Starting server on {settings.host}:{settings.port}")
    print(f"Debug mode: {settings.debug}")
    print(f"NVIDIA API configured: {bool(settings.nvidia_api_key)}")
    print(f"OpenAI API configured: {bool(settings.openai_api_key)}")
    print("=" * 60)
    print(f"\nAPI Documentation: http://{settings.host}:{settings.port}/docs")
    print(f"Health Check: http://{settings.host}:{settings.port}/health\n")

    uvicorn.run(
        "app.main:app",
        host=settings.host,
        port=settings.port,
        reload=settings.debug,
        log_level="info"
    )
