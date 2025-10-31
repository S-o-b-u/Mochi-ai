from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

class PyObjectId(str): 
    @classmethod
    def __get_validators__(cls): 
        yield cls.validate
        
    @classmethod
    def validate(cls, v): 
        if not isinstance(v, (str, bytes)) and not str(v).isalnum(): 
            raise TypeError('must be a valid ObjectId')
        return str(v)
    
class MongoBaseModel(BaseModel): 
    id: Optional[PyObjectId] = Field(None, alias="_id")
    
    class Config: 
        json_encoders = {
            PyObjectId: str, 
            datetime: lambda dt: dt.isoformat(),    
        }
        arbitary_types_allowed = True
        
# personas collection
class PersonaInDB(MongoBaseModel): 
    user_id: str
    name: str
    description: str
    tone: str
    is_public: bool = False
    created_at: datetime = Field(default_factory=datetime.now)
    
# chat_messages collection 
class MessageInDB(MongoBaseModel): 
    session_id: str
    role: str
    parts: List[str]
    timestamp: datetime = Field(default_factory=datetime.now)

# chat_sessions collection
class ChatSession(MongoBaseModel):
    user_id: str
    title: str
    persona_id: str
    last_updated: datetime = Field(default_factory=datetime.now)
        

class CreatePersonaRequest(MongoBaseModel):
    name: str
    description: str
    tone: str
    is_public: bool = False

# chat request model
class ChatRequest(BaseModel):
    message: str
    session_id: Optional[str] = None
    persona_id:  Optional[str] = None
    
# sent back when we create a new chat session
class NewChatResponse(BaseModel): 
    session_id: str
    title: str
    first_message: MessageInDB
    
class MoodLogRequest(BaseModel): 
    score: int