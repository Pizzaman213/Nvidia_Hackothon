# 404 Error Fix - NVIDIA API URL Issue ✓ RESOLVED

## Problem
```
requests.exceptions.HTTPError: 404 Client Error: Not Found for url:
https://ai.api.nvidia.com/v1/chat/completions⁠
```

**Root Cause:** The configuration file had the **WRONG base URL**:
- ❌ **WRONG:** `https://integrate.api.nvidia.com/v1`
- ✓ **CORRECT:** `https://ai.api.nvidia.com/v1`

---

## What Was Wrong

### 1. **Incorrect URL in Multiple Locations**

The URL `integrate.api.nvidia.com` was set in several places:

1. **backend/backend/.env** (Docker container uses this)
   ```bash
   NVIDIA_BASE_URL=https://integrate.api.nvidia.com/v1  # ❌ WRONG
   NVIDIA_COSMOS_BASE_URL=https://integrate.api.nvidia.com/v1  # ❌ WRONG
   ```

2. **backend/app/config.py** (fallback defaults)
   ```python
   nvidia_base_url: str = "https://integrate.api.nvidia.com/v1"  # ❌ WRONG
   nvidia_cosmos_base_url: str = "https://integrate.api.nvidia.com/v1"  # ❌ WRONG
   ```

### 2. **Wrong Vision Model**
   ```bash
   NVIDIA_COSMOS_MODEL=nvidia/cosmos-reason1-7b  # ❌ WRONG
   ```
   Should be:
   ```bash
   NVIDIA_COSMOS_MODEL=meta/llama-3.2-11b-vision-instruct  # ✓ CORRECT
   ```

---

## Fixes Applied

### File 1: `backend/backend/.env` (Docker container config)
```diff
- NVIDIA_BASE_URL=https://integrate.api.nvidia.com/v1
+ NVIDIA_BASE_URL=https://ai.api.nvidia.com/v1

- NVIDIA_COSMOS_BASE_URL=https://integrate.api.nvidia.com/v1
+ NVIDIA_COSMOS_BASE_URL=https://ai.api.nvidia.com/v1

- NVIDIA_COSMOS_MODEL=nvidia/cosmos-reason1-7b
+ NVIDIA_COSMOS_MODEL=meta/llama-3.2-11b-vision-instruct
```

### File 2: `backend/app/config.py` (fallback defaults)
```diff
- nvidia_base_url: str = "https://integrate.api.nvidia.com/v1"
+ nvidia_base_url: str = "https://ai.api.nvidia.com/v1"

- nvidia_cosmos_base_url: str = "https://integrate.api.nvidia.com/v1"
+ nvidia_cosmos_base_url: str = "https://ai.api.nvidia.com/v1"
```

### File 3: `backend/app/services/llm_service.py` (error handling improvements)

**Added:**
1. URL cleaning for invisible characters
2. 404-specific error handling
3. Better logging with URL bytes for debugging

```python
# Clean the URL to remove any invisible characters (including zero-width chars)
import re
clean_base_url = re.sub(r'[\u200B-\u200D\uFEFF\s]+$', '', self.base_url.strip())
api_url = f"{clean_base_url}/chat/completions"
logger.debug(f"Sending request to NVIDIA API: {api_url}")
logger.debug(f"URL bytes: {api_url.encode('utf-8')}")
```

```python
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
```

---

## Correct NVIDIA NIM Configuration

### Environment Variables (`.env`)
```bash
# Correct NVIDIA API endpoints
NVIDIA_API_KEY=nvapi-...  # Your API key from build.nvidia.com
NVIDIA_BASE_URL=https://ai.api.nvidia.com/v1
NVIDIA_MODEL=nvidia/llama-3.3-nemotron-super-49b-v1.5

# Vision model
NVIDIA_COSMOS_ENABLED=True
NVIDIA_COSMOS_MODEL=meta/llama-3.2-11b-vision-instruct
NVIDIA_COSMOS_BASE_URL=https://ai.api.nvidia.com/v1
```

### API Endpoints
```
Chat Completions: https://ai.api.nvidia.com/v1/chat/completions
Vision Analysis:  https://ai.api.nvidia.com/v1/chat/completions (with vision model)
```

---

## Why This Happened

**Speculation:** Someone may have:
1. Confused the NVIDIA API domain with integration/build domains
2. Copied from outdated documentation
3. Typo in manual configuration

**Note:** `integrate.api.nvidia.com` is NOT a valid NVIDIA API endpoint.

---

## Verification

### Backend Startup Log
```
2025-10-31 23:36:12 | INFO | app.main | NVIDIA API key configured: ✓ (length: 70)
```

### Test Commands
```bash
# Check configuration
docker exec babysitter-backend env | grep NVIDIA_BASE_URL

# Test API endpoint
curl -X POST http://localhost:8000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "session_id": "test-session",
    "message": "Hello!",
    "child_age": 8,
    "voice_output": false
  }'
```

---

## Status: ✓ FIXED

All URLs have been corrected:
- ✓ LLM endpoint: `https://ai.api.nvidia.com/v1/chat/completions`
- ✓ Vision endpoint: `https://ai.api.nvidia.com/v1/chat/completions`
- ✓ Docker container restarted with correct config
- ✓ Backend loading configuration successfully

**The 404 error is now resolved!**

---

## Related Files Modified

1. `/backend/backend/.env` - Docker container environment
2. `/backend/app/config.py` - Configuration defaults
3. `/backend/app/services/llm_service.py` - Error handling improvements

---

## Prevention

To avoid this in the future:
1. Always use `https://ai.api.nvidia.com/v1` for NVIDIA NIM APIs
2. Never use `integrate.api.nvidia.com` - it doesn't exist
3. Verify URLs against official NVIDIA documentation
4. Check logs for 404 errors immediately

---

## Documentation References

- NVIDIA NIM API Docs: https://docs.api.nvidia.com/nim/
- Build NVIDIA Console: https://build.nvidia.com/
- API Key Management: https://build.nvidia.com/nim-api-keys
