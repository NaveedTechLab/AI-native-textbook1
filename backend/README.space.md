---
title: AI Textbook Backend
emoji: 🤖
colorFrom: blue
colorTo: green
sdk: docker
pinned: false
license: mit
---

# AI-native Textbook Backend

FastAPI backend with RAG (Retrieval-Augmented Generation) capabilities for the Physical AI & Humanoid Robotics textbook platform.

## Features

- **RAG Service**: OpenRouter-powered Q&A with Qdrant vector search
- **ChatKit Integration**: OpenAI ChatKit SDK compatible endpoints
- **Better-Auth Integration**: JWT authentication with Better-Auth service
- **Translation API**: Dynamic Urdu translation
- **Personalization**: User progress tracking and recommendations

## Tech Stack

- FastAPI 0.109.0
- OpenAI SDK 1.12.0 (with OpenRouter)
- Qdrant Client 1.7.0
- PostgreSQL (Neon)
- Better-Auth JWT

## Environment Variables

Required environment variables (set in Space Settings):

```
OPENAI_API_KEY=your_openrouter_api_key
OPENAI_BASE_URL=https://openrouter.ai/api/v1
QDRANT_URL=your_qdrant_url
QDRANT_API_KEY=your_qdrant_api_key
NEON_DB_URL=your_neon_db_connection_string
SECRET_KEY=your_jwt_secret_key
BETTER_AUTH_URL=https://your-auth-space.hf.space
DEBUG=false
LOG_LEVEL=info
```

## API Endpoints

- `GET /` - Welcome message
- `GET /health` - Health check
- `POST /api/chatkit/chat` - ChatKit-compatible chat endpoint
- `POST /api/chat` - Standard chat endpoint
- `POST /api/auth/login` - User authentication
- `POST /api/auth/register` - User registration
- `GET /api/translation/translate` - Translation service
- `POST /api/rag/search` - RAG search

## Documentation

Full API documentation available at: `/docs` (Swagger UI)

## Repository

https://github.com/NaveedTechLab/AI-native-textbook1
