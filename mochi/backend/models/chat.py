from pydantic import BaseModel, Field
from typing import Optional, List

class ChatMessage(BaseModel):
    role: str 
    parts: List[str]

class Persona(BaseModel):
    id: str 
    name: Optional[str] = None
    description: Optional[str] = None
    tone: Optional[str] = None

class ChatRequest(BaseModel):
    message: str
    persona: Persona
    chatHistory: List[ChatMessage] = Field(default_factory=list)

class MoodLogRequest(BaseModel):
    score: int