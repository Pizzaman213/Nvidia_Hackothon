#!/usr/bin/env python3
"""
Test script to verify NVIDIA API configuration
"""
import sys
import os

# Add backend to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))

from app.config import settings

def test_config():
    """Test if NVIDIA API is properly configured"""
    print("=" * 60)
    print("NVIDIA API Configuration Test")
    print("=" * 60)

    print(f"\n✓ Base URL: {settings.nvidia_base_url}")
    print(f"✓ Model: {settings.nvidia_model}")
    print(f"✓ Temperature: {settings.llm_temperature}")
    print(f"✓ Max Tokens: {settings.llm_max_tokens}")

    # Check API key
    api_key = settings.nvidia_api_key

    if not api_key or api_key == "your_nvidia_api_key_here" or api_key == "":
        print(f"\n✗ ERROR: NVIDIA API key is NOT configured!")
        print(f"  Current value: '{api_key}'")
        print(f"\n  Please set NVIDIA_API_KEY in backend/.env")
        print(f"  See NVIDIA_API_SETUP.md for instructions")
        return False
    else:
        # Mask the API key for security
        masked_key = api_key[:8] + "..." + api_key[-4:] if len(api_key) > 12 else "***"
        print(f"✓ API Key: {masked_key} (length: {len(api_key)})")
        print(f"\n✓ Configuration looks good!")
        return True

if __name__ == "__main__":
    success = test_config()
    sys.exit(0 if success else 1)
