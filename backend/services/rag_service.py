from typing import List, Dict, Any
import logging
import os
from openai import OpenAI
from qdrant_client import QdrantClient
import json

logger = logging.getLogger(__name__)

class RAGService:
    def __init__(self, openrouter_api_key: str, vector_db_service: QdrantClient = None, collection_name: str = "project_documents"):
        # Initialize OpenRouter client
        self.client = OpenAI(
            api_key=openrouter_api_key,
            base_url="https://openrouter.ai/api/v1"
        )
        self.qdrant = vector_db_service  # Can be None
        self.collection_name = collection_name

    def get_embedding(self, text: str) -> List[float]:
        """Get embeddings for text using OpenAI's embedding API"""
        try:
            response = self.client.embeddings.create(
                model="text-embedding-3-small",
                input=text
            )
            return response.data[0].embedding
        except Exception as e:
            logger.error(f"Error getting embeddings: {str(e)}")
            raise e

    def search_qdrant(self, query: str) -> str:
        """Search Qdrant for relevant content based on query"""
        try:
            vector = self.get_embedding(query)

            hits = self.qdrant.search(
                collection_name=self.collection_name,
                query_vector=vector,
                limit=5
            )

            return "\n\n".join(hit.payload["content"] for hit in hits if "content" in hit.payload)
        except Exception as e:
            logger.error(f"Error searching Qdrant: {str(e)}")
            return ""

    def query_rag(self, selected_text: str, question: str) -> str:
        """Process a RAG query using OpenRouter with selected text as context"""
        # Validate inputs
        if not selected_text or len(selected_text.strip()) == 0:
            return "Please select some text from the textbook to ask questions about."

        # Clean up the question - remove formatting if it contains "Selected text:" pattern
        question = question.strip()
        if question.startswith('Selected text:'):
            # Extract actual question after "Ask a question about this text..."
            lines = question.split('\n')
            question_parts = []
            found_prompt = False

            for line in lines:
                if 'Ask a question about this text' in line:
                    found_prompt = True
                    continue
                if found_prompt and line.strip():
                    question_parts.append(line.strip())

            # If we found text after the prompt, use it; otherwise use default
            if question_parts:
                question = ' '.join(question_parts)
            else:
                question = "Explain this concept in detail."

        # If question is still empty or same as selected text, create a default question
        if not question or question.strip() == '' or question.strip() == selected_text.strip():
            question = "Explain this concept in detail."

        # Check length (as per requirement TC-002: max 5000 characters)
        if len(selected_text) > 5000:
            logger.warning(f"Selected text exceeds 5000 character limit: {len(selected_text)} characters")
            selected_text = selected_text[:5000]  # Truncate to 5000 characters

        SYSTEM_PROMPT = """You are an AI teaching assistant for a Physical AI & Humanoid Robotics textbook.

Your role is to:
1. Answer questions based ONLY on the provided textbook content
2. Provide detailed, educational explanations
3. Use examples from the context when available
4. If the answer is not in the provided context, say: "Is sawal ka jawab provided data me mojood nahi hai."

Guidelines:
- Be detailed and thorough in your explanations
- Use technical terms accurately
- Break down complex concepts into understandable parts
- Relate concepts to real-world applications when relevant
- Answer in the same language as the question (English/Urdu/Hinglish)"""

        try:
            # Use selected text directly as context (no Qdrant search needed)
            # This is more reliable and faster
            context = selected_text.strip()

            if not context:
                return "Please select some text from the textbook to ask questions about."

            # Try to enhance context with Qdrant search (optional, fallback if fails)
            if self.qdrant:
                try:
                    qdrant_context = self.search_qdrant(selected_text[:500])  # Use first 500 chars for search
                    if qdrant_context:
                        # Combine selected text with related content from Qdrant
                        context = f"{selected_text}\n\n--- Related Content ---\n{qdrant_context}"
                except Exception as qdrant_error:
                    logger.warning(f"Qdrant search failed, using selected text only: {str(qdrant_error)}")
                    # Continue with just the selected text
                    context = selected_text
            else:
                logger.info("Qdrant not available, using selected text only")
                context = selected_text

            # Generate detailed answer using the context
            final_response = self.client.chat.completions.create(
                model="openai/gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": SYSTEM_PROMPT},
                    {"role": "user", "content": f"""Context from textbook:
{context}

Question: {question}

Please provide a detailed answer based on the context above."""}
                ],
                temperature=0.3,  # Slightly higher for more natural responses
                max_tokens=800     # Allow longer, more detailed responses
            )

            answer = final_response.choices[0].message.content

            # If answer is too generic or says "not in context", be more helpful
            if len(answer) < 20 or "not in the context" in answer.lower():
                return "Is sawal ka jawab provided data me mojood nahi hai."

            return answer

        except Exception as e:
            logger.error(f"Error in RAG query: {str(e)}")
            # Check if the error is related to API key validity
            error_str = str(e).lower()
            if "api key" in error_str or "quota" in error_str or "billing" in error_str or "permission" in error_str or "401" in str(e) or "403" in str(e):
                return f"API configuration issue detected. Please check your OpenRouter API key and quota. Error: {str(e)}"
            else:
                return f"Sorry, I encountered an error while processing your question. Please try again. Error: {str(e)}"

    def index_content(self, content_id: str, content: str, metadata: Dict[str, Any] = None):
        """Index textbook content for RAG retrieval"""
        if metadata is None:
            metadata = {}

        # Get embeddings for the content
        embeddings = self.get_embedding(content)

        # Store in vector database
        self.qdrant.upsert(
            collection_name=self.collection_name,
            points=[
                {
                    "id": content_id,
                    "vector": embeddings,
                    "payload": {
                        "content": content,
                        "metadata": metadata
                    }
                }
            ]
        )

        logger.info(f"Indexed content: {content_id}")