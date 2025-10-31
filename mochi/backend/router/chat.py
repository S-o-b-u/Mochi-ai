import os
from fastapi import APIRouter, Request, HTTPException, Depends
from fastapi.responses import StreamingResponse
from models.chat import ChatRequest, MoodLogRequest
from datetime import datetime
from utils.chatbot import generate_stream_response

from fastapi_clerk_auth import ClerkConfig, ClerkHTTPBearer, HTTPAuthorizationCredentials

from dotenv import load_dotenv
load_dotenv()
CLERK_JWKS_URL = os.getenv("CLERK_JWKS_URL")
if not CLERK_JWKS_URL: 
    raise ValueError("CLERK_JWKS_URL environment variable not set!")

clerk_config = ClerkConfig(jwks_url=CLERK_JWKS_URL)
clerk_auth_guard = ClerkHTTPBearer(config=clerk_config)

chat_router = APIRouter()

PREDEFINED_CHARACTERS = {
    "mochi": {
        "name": "Mochi",
        "tag": "The Listener",
        "description": "A calm, patient, and deeply empathetic listener. Your purpose is to provide a safe space and validate the user's feelings without judgment.",
        "tone": "Gentle, reassuring, and soft"
    },
    "sukun": {
        "name": "Sukun",
        "tag": "The Guide", 
        "description": "A calm and grounding guide to help you find tranquility (Sukun) and peace in the present moment through mindfulness.",
        "tone": "Soothing and wise"
    },
    "diya": {
        "name": "Diya",
        "tag": "The Encourager",
        "description": "A small lamp (Diya) of hope. Here to help you find a spark of light and celebrate small wins, even on difficult days.",
        "tone": "Hopeful and gentle"
    }
}

@chat_router.get("/personas")
async def get_predefined_personas():
    return PREDEFINED_CHARACTERS

@chat_router.post("/chat/stream")
async def serve_streaming_chat(
    payload: ChatRequest, 
    credentials: HTTPAuthorizationCredentials = Depends(clerk_auth_guard)
):
    
    gemini_api_key = os.getenv("GOOGLE_API_KEY")
    if not gemini_api_key:
        async def error_generator():
            yield "Configuration error: The server's API key is missing."
        return StreamingResponse(error_generator(), media_type="text/event-stream")
    
    user_id = credentials.decoded.get("sub")
    if not user_id: 
        async def error_generator(): 
            yield "Authentication error: User ID not found in token"
        return StreamingResponse(error_generator(), media_type="text/event-stream")
    print(f"Request from user {user_id}")
    
    return StreamingResponse(
        generate_stream_response(
            api_key=gemini_api_key,
            chat_payload=payload, 
            user_id=user_id
        ),
        media_type="text/event-stream"
)

@chat_router.post("/log-mood")
async def log_mood(
    request: MoodLogRequest, 
    http_request:  Request, 
    credentials: HTTPAuthorizationCredentials = Depends(clerk_auth_guard)
): 
    db = http_request.app.database
    mood_collection = db["mood_logs"]
    
    user_id = credentials.decoded.get("sub")
    if not user_id: 
        raise HTTPException(status_code=401, detail="User ID not found in token")
    
    log_entry = {
        "score": request.score, 
        "timestamp": datetime.now(), 
        "user_id": user_id
    }
    
    res = await mood_collection.insert_one(log_entry)
    return {"status": "success", "log_id": str(res.inserted_id)}