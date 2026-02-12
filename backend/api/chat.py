import os
import sys
import time
from uuid import uuid4
from fastapi import APIRouter, Depends, HTTPException, Header, Request
from fastapi.responses import JSONResponse
import logging
from qdrant_client import QdrantClient

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from services.rag_service import RAGService
from auth.jwt_utils import get_current_user_id_from_token

router = APIRouter()

# Configure OpenRouter and RAG service
openrouter_api_key = os.getenv("OPENAI_API_KEY")
qdrant_url = os.getenv("QDRANT_URL")
qdrant_api_key = os.getenv("QDRANT_API_KEY")
collection_name = os.getenv("QDRANT_COLLECTION", "project_documents")

if openrouter_api_key and openrouter_api_key != "your_openrouter_api_key_here":
    # Initialize Qdrant client
    try:
        # Check if cloud Qdrant is configured
        qdrant_host = os.getenv("QDRANT_HOST")
        if qdrant_api_key and qdrant_host and "qdrant.io" in qdrant_host:
            # Use Qdrant Cloud
            qdrant_client = QdrantClient(
                url=qdrant_host,  # Use QDRANT_HOST which has the full URL
                api_key=qdrant_api_key,
                prefer_grpc=False
            )
        else:
            # Use local Qdrant - extract host from URL if needed
            if qdrant_url and qdrant_url.startswith("http"):
                # Extract host and port from URL
                from urllib.parse import urlparse
                parsed = urlparse(qdrant_url)
                host = parsed.hostname or "localhost"
                port = parsed.port or 6333
            else:
                host = qdrant_url or "localhost"
                port = int(os.getenv("QDRANT_PORT", 6333))

            qdrant_client = QdrantClient(host=host, port=port)
    except Exception as e:
        logger.error(f"Failed to initialize Qdrant client: {str(e)}")
        # Create a dummy client to allow service to work without Qdrant
        qdrant_client = None

    # Initialize RAG service with OpenRouter
    rag_service = RAGService(openrouter_api_key, qdrant_client, collection_name)
else:
    rag_service = None

logger = logging.getLogger(__name__)


# JWT verification dependency
def verify_jwt_token(authorization: str = Header(None)) -> dict:
    """Verify JWT token from Authorization header"""
    if not authorization:
        raise HTTPException(status_code=401, detail="Authorization header missing")

    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid authorization format")

    token = authorization[7:]  # Remove "Bearer " prefix
    user_id = get_current_user_id_from_token(token)

    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    return {"user_id": user_id}


@router.post("/chat")
async def chat(payload: dict, user_data: dict = Depends(verify_jwt_token)):
    user_msg = payload["message"]
    selected_text = payload.get("selected_text", "")

    # If selected text is provided, try to use RAG service to answer based only on that text
    if selected_text and rag_service:
        try:
            # Use the RAG service to answer based on selected text only (with OpenRouter)
            answer = rag_service.query_rag(selected_text, user_msg)
            return {"answer": answer}
        except Exception as e:
            logger.error(f"RAG service failed: {str(e)}")
            # Fall through to fallback response below
    elif selected_text and not rag_service:
        logger.warning("RAG service not available, using fallback")

    # Fallback response when API is unavailable or not configured
    fallback_responses = {
        "hello": "Hello! I'm your AI textbook assistant. Feel free to ask questions about the content you're studying!",
        "hi": "Hi there! I'm here to help you understand the AI and robotics concepts in your textbook. What would you like to know?",
        "help": "I can help explain concepts from your AI and robotics textbook! Please select some text and ask questions about it.",
        "default": f"I'm currently unable to process your request about '{user_msg}'. This might be because the AI service is temporarily unavailable or needs to be configured with a valid API key. The system is working properly but requires a valid OPENROUTER_API_KEY to provide AI-generated responses."
    }

    response_text = fallback_responses.get(user_msg.lower().strip(), fallback_responses["default"])

    result = {"answer": response_text}
    if not rag_service:
        result["setup_needed"] = "Please configure a valid OPENROUTER_API_KEY in the .env file to enable AI responses"

    return result


# ============================================================
# OpenAI ChatKit SDK Compatible Endpoint
# Provides OpenAI Chat Completions API format for ChatKit React
# ============================================================

@router.post("/chatkit/session")
async def chatkit_session(request: Request, user_data: dict = Depends(verify_jwt_token)):
    """
    Create a ChatKit session. Returns a client_secret for the ChatKit React component.
    This is a simplified session endpoint for self-hosted ChatKit.
    """
    session_id = str(uuid4())
    return {
        "client_secret": f"chatkit_{session_id}_{user_data['user_id']}",
        "session_id": session_id,
        "user_id": user_data["user_id"],
    }


@router.post("/chatkit/chat")
async def chatkit_chat(payload: dict, user_data: dict = Depends(verify_jwt_token)):
    """
    ChatKit-compatible chat endpoint.
    Accepts OpenAI Chat Completions format and routes through RAG service.
    Used by the @openai/chatkit-react frontend component.
    """
    messages = payload.get("messages", [])
    selected_text = payload.get("selected_text", "")

    # Extract the last user message
    user_msg = ""
    for msg in reversed(messages):
        if msg.get("role") == "user":
            user_msg = msg.get("content", "")
            break

    if not user_msg:
        user_msg = payload.get("message", "")

    # Process through RAG service
    answer = ""
    if selected_text and rag_service:
        try:
            answer = rag_service.query_rag(selected_text, user_msg)
        except Exception as e:
            logger.error(f"ChatKit RAG service failed: {str(e)}")
            answer = "Is sawal ka jawab provided data me mojood nahi hai."
    elif rag_service:
        try:
            answer = rag_service.query_rag(user_msg, user_msg)
        except Exception as e:
            logger.error(f"ChatKit RAG service failed: {str(e)}")
            answer = "Please select text from the textbook to ask questions."
    else:
        answer = "AI service is not configured. Please set up OPENROUTER_API_KEY."

    # Return in OpenAI Chat Completions format (ChatKit compatible)
    return {
        "id": f"chatcmpl-{uuid4().hex[:12]}",
        "object": "chat.completion",
        "created": int(time.time()),
        "model": "openai/gpt-3.5-turbo",
        "choices": [
            {
                "index": 0,
                "message": {
                    "role": "assistant",
                    "content": answer,
                },
                "finish_reason": "stop",
            }
        ],
        "usage": {
            "prompt_tokens": len(user_msg.split()),
            "completion_tokens": len(answer.split()),
            "total_tokens": len(user_msg.split()) + len(answer.split()),
        },
    }