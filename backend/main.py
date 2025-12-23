import sys
import os
from dotenv import load_dotenv

# Load environment variables from .env file in the project root
project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
dotenv_path = os.path.join(project_root, '.env')
load_dotenv(dotenv_path)

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import logging

# Import API routers
from api.chat import router as chat_router
from api.auth import router as auth_router
from api.translation import router as translation_router
from api.personalization import router as personalization_router
from api.rag_search import router as rag_search_router

# Initialize database
try:
    from database.db import init_db
    DB_AVAILABLE = True
except ImportError:
    DB_AVAILABLE = False
    logging.warning("Database modules not available. Running without database support.")

logger = logging.getLogger(__name__)

app = FastAPI(
    title="AI-native Textbook Platform API",
    description="Backend API for Physical AI & Humanoid Robotics Textbook",
    version="1.0.0"
)

# Initialize database tables on startup
@app.on_event("startup")
async def startup_event():
    """Initialize database tables on application startup"""
    if DB_AVAILABLE:
        try:
            init_db()
            logger.info("Database initialized successfully")
        except Exception as e:
            logger.error(f"Failed to initialize database: {str(e)}")
    else:
        logger.warning("Running in mock mode without database")

# Add CORS middleware to allow requests from the Docusaurus frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001", "http://localhost:8000", "*"],  # Allow frontend origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    allow_origin_regex=r"https?://localhost(:[0-9]+)?",
)

# Include API routers
app.include_router(chat_router, prefix="/api", tags=["Chat"])
app.include_router(auth_router, prefix="/api", tags=["Authentication"])
app.include_router(translation_router, prefix="/api", tags=["Translation"])
app.include_router(personalization_router, prefix="/api", tags=["Personalization"])
app.include_router(rag_search_router, prefix="/api", tags=["RAG Search"])

@app.get("/")
def read_root():
    return {
        "message": "Welcome to the AI-native Interactive Textbook Platform for Physical AI & Humanoid Robotics",
        "version": "1.0.0",
        "database_enabled": DB_AVAILABLE
    }

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "database": "connected" if DB_AVAILABLE else "mock mode"
    }

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8001)