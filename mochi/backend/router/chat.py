import os
from fastapi import APIRouter, Request, HTTPException, Depends, status
from fastapi.responses import StreamingResponse
from datetime import datetime
from bson import ObjectId  # For validating and using MongoDB ObjectIDs

# Import all our new models from models/chat.py
from models.chat import (
    ChatRequest, 
    MoodLogRequest, 
    ChatSession, 
    MessageInDB, 
    PersonaInDB
)
# Import our new chatbot utility function
from utils.chatbot import generate_stream_response, PREDEFINED_CHARACTERS

# Import Clerk authentication
from fastapi_clerk_auth import ClerkConfig, ClerkHTTPBearer, HTTPAuthorizationCredentials

# --- CONFIGURE CLERK ---
from dotenv import load_dotenv
load_dotenv()
CLERK_JWKS_URL = os.getenv("CLERK_JWKS_URL")
if not CLERK_JWKS_URL:
    raise ValueError("CLERK_JWKS_URL environment variable not set!")
clerk_config = ClerkConfig(jwks_url=CLERK_JWKS_URL)
clerk_auth_guard = ClerkHTTPBearer(config=clerk_config)
# -----------------------

# This is the router that will be imported in main.py
api_router = APIRouter()

# --- HELPER FUNCTION: Get Persona Details ---
async def _get_persona_details(persona_id: str, db) -> dict:
    """Fetches persona details from the DB or predefined list."""
    if not persona_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Persona ID is required for a new chat.")
        
    if persona_id in PREDEFINED_CHARACTERS:
        # It's a predefined character
        return PREDEFINED_CHARACTERS[persona_id]
    
    if not ObjectId.is_valid(persona_id):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid custom persona ID format.")

    # It's a custom persona, fetch from DB
    persona_doc = await db["personas"].find_one({"_id": ObjectId(persona_id)})
    if not persona_doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Custom persona not found.")
    
    # Convert PersonaInDB to a simple dict
    return PersonaInDB(**persona_doc).model_dump()


# --- HELPER FUNCTION: Create a New Chat ---
async def _create_new_chat(db, user_id: str, persona_id: str, first_message: str) -> ChatSession:
    """Creates a new chat session in the database."""
    # Generate a title from the first message
    title = (first_message[:30] + '...') if len(first_message) > 30 else first_message

    new_session = ChatSession(
        user_id=user_id,
        title=title,
        persona_id=persona_id, # This can be "doraemon" or an ObjectId
        last_updated=datetime.now()
    )
    
    result = await db["chat_sessions"].insert_one(
        new_session.model_dump(by_alias=True, exclude_none=True)
    )
    
    # Return the created session with its new ID
    new_session.id = result.inserted_id
    return new_session


# --- HELPER FUNCTION: Save a Message ---
async def _save_message(db, session_id: str, role: str, content: str) -> MessageInDB:
    """Saves a single message to the chat_messages collection."""
    message = MessageInDB(
        session_id=str(session_id),
        role=role,
        parts=[content]
    )
    await db["chat_messages"].insert_one(
        message.model_dump(by_alias=True, exclude_none=True)
    )
    return message

# --- STREAMING ENDPOINT: The Main Event ---
@api_router.post("/chat/stream")
async def serve_streaming_chat(
    payload: ChatRequest, 
    request: Request,
    credentials: HTTPAuthorizationCredentials = Depends(clerk_auth_guard)
):
    gemini_api_key = os.getenv("GOOGLE_API_KEY")
    if not gemini_api_key:
        async def error_stream(): yield "Configuration error: Server API key is missing."
        return StreamingResponse(error_stream(), media_type="text/event-stream")

    try:
        db = request.app.database
        user_id = credentials.decoded.get("sub")
        
        session = None
        persona_details = {}
        chat_history = []

        # === 1. DETERMINE IF THIS IS A NEW OR EXISTING CHAT ===
        if payload.session_id and ObjectId.is_valid(payload.session_id):
            # --- EXISTING CHAT ---
            session_obj_id = ObjectId(payload.session_id)
            session_doc = await db["chat_sessions"].find_one({
                "_id": session_obj_id,
                "user_id": user_id
            })
            if not session_doc:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Chat session not found.")
            
            session = ChatSession(**session_doc)
            
            # Fetch persona details for this session
            persona_details = await _get_persona_details(session.persona_id, db)
            
            # Fetch existing chat history
            history_cursor = db["chat_messages"].find({"session_id": payload.session_id}).sort("timestamp", 1)
            chat_history = [MessageInDB(**doc) async for doc in history_cursor]

        else:
            # --- NEW CHAT ---
            if not payload.persona_id:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="persona_id is required for a new chat.")
            
            # Fetch persona details first
            persona_details = await _get_persona_details(payload.persona_id, db)
            
            # Create the new session in the DB
            session = await _create_new_chat(db, user_id, payload.persona_id, payload.message)
            # The chat history is just an empty list
            chat_history = []

        # === 2. SAVE THE USER'S NEW MESSAGE ===
        user_message_doc = await _save_message(db, session.id, "user", payload.message)
        chat_history.append(user_message_doc) # Add it to our context for the LLM

        # === 3. GENERATE AND STREAM THE AI RESPONSE ===
        async def stream_generator():
            ai_response_full = "" # We'll build the full response here
            
            try:
                # Call our refactored utility function
                async for chunk in generate_stream_response(
                    api_key=gemini_api_key,
                    user_message=payload.message,
                    full_history=chat_history,
                    persona_details=persona_details
                ):
                    ai_response_full += chunk
                    yield chunk
                
                # === 4. SAVE THE FULL AI RESPONSE ===
                if ai_response_full:
                    await _save_message(db, session.id, "model", ai_response_full)
                    
                    # === 5. UPDATE THE SESSION'S TIMESTAMP ===
                    await db["chat_sessions"].update_one(
                        {"_id": ObjectId(session.id)},
                        {"$set": {"last_updated": datetime.now()}}
                    )
            
            except Exception as e:
                print(f"Error during response generation or saving: {e}")
                yield "An error occurred while processing your request."

        return StreamingResponse(stream_generator(), media_type="text/event-stream")

    except Exception as e:
        print(f"Main streaming error: {e}")
        async def error_stream(): 
            if isinstance(e, HTTPException):
                yield f"Error {e.status_code}: {e.detail}"
            else:
                yield "An unexpected server error occurred."
        return StreamingResponse(error_stream(), media_type="text/event-stream")


# --- MOOD LOG ENDPOINT (Unchanged but using api_router) ---
@api_router.post("/log-mood")
async def log_mood(
    request_payload: MoodLogRequest, 
    http_request: Request,
    credentials: HTTPAuthorizationCredentials = Depends(clerk_auth_guard)
):
    db = http_request.app.database
    user_id = credentials.decoded.get("sub")
    if not user_id:
         raise HTTPException(status_code=401, detail="User ID not found in token")

    log_entry = {
        "score": request_payload.score,
        "timestamp": datetime.now(),
        "user_id": user_id
    }
    
    result = await db["mood_logs"].insert_one(log_entry)
    return {"status": "success", "log_id": str(result.inserted_id)}