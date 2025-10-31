import os
from fastapi import APIRouter, Request, HTTPException, Depends, status
from typing import List
from datetime import datetime

from models.chat import PersonaInDB, CreatePersonaRequest, MongoBaseModel

from fastapi_clerk_auth import ClerkHTTPBearer, HTTPAuthorizationCredentials

from dotenv import load_dotenv
load_dotenv()
CLERK_JWKS_URL = os.getenv("CLERK_JWKS_URL")
if not CLERK_JWKS_URL: 
    raise ValueError("CLERK_JWKS_URL environment variable not set!")
from fastapi_clerk_auth import ClerkConfig
clerk_config = ClerkConfig(jwks_url=CLERK_JWKS_URL)
clerk_auth_guard = ClerkHTTPBearer(config=clerk_config)

persona_router = APIRouter()

@persona_router.post(
    "/personas", 
    response_model=PersonaInDB, 
    status_code=status.HTTP_201_CREATED
) 
@persona_router.post(
    "/personas", 
    response_model=PersonaInDB,
    status_code=status.HTTP_201_CREATED
)
async def create_persona(
    persona_data: CreatePersonaRequest, # This now contains the new fields
    request: Request,
    credentials: HTTPAuthorizationCredentials = Depends(clerk_auth_guard)
):
    user_id = credentials.decoded.get("sub")
    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User ID not found")

    db = request.app.database
    personas_collection = db["personas"]

    # Create the persona document to insert
    new_persona = PersonaInDB(
        user_id=user_id,
        name=persona_data.name,
        description=persona_data.description,
        tone=persona_data.tone,
        is_public=persona_data.is_public,
        
        # --- MAP THE NEW FIELDS ---
        greeting=persona_data.greeting,
        relationship=persona_data.relationship,
        forbidden_topics=persona_data.forbidden_topics
    )

    # Insert into MongoDB
    inserted_result = await personas_collection.insert_one(
        new_persona.model_dump(by_alias=True, exclude_none=True) 
    )

    created_persona_doc = await personas_collection.find_one({"_id": inserted_result.inserted_id})
    if created_persona_doc is None:
         raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to create persona")

    return created_persona_doc


@persona_router.get(
    "/personas", 
    response_model=List[PersonaInDB]
)
async def get_user_persona(
    request: Request, 
    credentials: HTTPAuthorizationCredentials = Depends(clerk_auth_guard)
): 
    user_id = credentials.decoded.get("sub")
    if not user_id: 
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User ID not found")
    
    db = request.app.database
    personas_collection = db["personas"]
    
    personas_cursor = personas_collection.find({"user_id": user_id}).sort("created_at", -1)
    
    user_personas = await personas_cursor.to_list(length=None)
    
    return user_personas
