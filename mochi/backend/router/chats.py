import os
from fastapi import APIRouter, Request, HTTPException, Depends, status
from typing import List
from datetime import datetime
from bson import ObjectId 

from models.chat import ChatSession, MessageInDB 


from fastapi_clerk_auth import ClerkHTTPBearer, HTTPAuthorizationCredentials
from fastapi_clerk_auth import ClerkConfig

from dotenv import load_dotenv
load_dotenv()
CLERK_JWKS_URL = os.getenv("CLERK_JWKS_URL")
if not CLERK_JWKS_URL:
    raise ValueError("CLERK_JWKS_URL environment variable not set!")
clerk_config = ClerkConfig(jwks_url=CLERK_JWKS_URL)
clerk_auth_guard = ClerkHTTPBearer(config=clerk_config)

chat_router = APIRouter()

@chat_router.get(
    "/chats", 
    response_model=List[ChatSession] 
)
async def get_user_chat_sessions(
    request: Request,
    credentials: HTTPAuthorizationCredentials = Depends(clerk_auth_guard) 
):
    user_id = credentials.decoded.get("sub")
    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User ID not found")

    db = request.app.database
    sessions_collection = db["chat_sessions"]

    sessions_cursor = sessions_collection.find({"user_id": user_id}).sort("last_updated", -1)
    
    user_sessions = await sessions_cursor.to_list(length=None) # Get all
    
    return user_sessions

@chat_router.get(
    "/chats/{session_id}/messages", 
    response_model=List[MessageInDB] 
)
async def get_chat_session_messages(
    session_id: str,
    request: Request,
    credentials: HTTPAuthorizationCredentials = Depends(clerk_auth_guard) 
):
    user_id = credentials.decoded.get("sub")
    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User ID not found")

    if not ObjectId.is_valid(session_id):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid session ID format")

    db = request.app.database
    sessions_collection = db["chat_sessions"]
    messages_collection = db["chat_messages"]

    session = await sessions_collection.find_one({
        "_id": ObjectId(session_id), 
        "user_id": user_id
    })
    
    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Chat session not found or you do not have permission to access it")

    messages_cursor = messages_collection.find({"session_id": session_id}).sort("timestamp", 1)
    
    messages = await messages_cursor.to_list(length=None)
    
    return messages