import sys
import os
from contextlib import asynccontextmanager 
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient
from router.chat import router 

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

load_dotenv()

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("Application startup...")
    
    mongo_uri = os.getenv("MONGO_URI")
    if not mongo_uri:
        raise ValueError("MONGO_URI environment variable not set!")
    
    app.mongodb_client = AsyncIOMotorClient(mongo_uri)
    app.database = app.mongodb_client["homh04_db"]
    print("🚀 Successfully connected to the MongoDB database.")
    
    yield 
    
    print("Application shutdown...")
    app.mongodb_client.close()
    print("MongoDB connection closed.")


app = FastAPI(
    title="HOMH04 AI Chatbot API",
    lifespan=lifespan 
)


origins = [
    "http://localhost:3000",
    "http://localhost:5173",
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(router, prefix="/api")


@app.get("/")
def read_root():
    """Root GET endpoint for health check."""
    return {"status": "ok", "message": "HOMH04 Backend is online and ready!"}