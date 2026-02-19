from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Dict, Any, List
from pydantic import BaseModel
from datetime import datetime

from app.db.database import get_db
from app.db.models import User
from app.api.dependencies import get_current_user
from app.services.openai_service import OpenAIService
import json

router = APIRouter(tags=["AI Assistant"])

class ChatMessage(BaseModel):
    message: str
    conversation_history: List[Dict[str, str]] = []

class ChatResponse(BaseModel):
    response: str
    timestamp: str

@router.post("/chat", response_model=ChatResponse)
async def chat_with_assistant(
    chat_message: ChatMessage,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Chat with the AI assistant for Erasmus+ grant guidance
    """
    print(f"\n=== AI ASSISTANT CHAT REQUEST ===")
    print(f"User: {current_user.username} (ID: {current_user.id})")
    print(f"Message: {chat_message.message}")
    print(f"History length: {len(chat_message.conversation_history)}")

    try:
        print("Initializing OpenAI service...")
        openai_service = OpenAIService()
        print("OpenAI service initialized successfully")

        # Build conversation with system context
        messages = [
            {
                "role": "developer",
                "content": """You are an expert AI assistant specializing in Erasmus+ KA220-ADU grant applications.
                Your role is to help users understand and complete their grant applications effectively.

                Key areas of expertise:
                - Grant application requirements and criteria
                - Project design and implementation strategies
                - Partnership building and collaboration
                - Budget planning and financial management
                - Impact assessment and sustainability planning
                - EU priorities and horizontal topics

                Guidelines:
                - Provide clear, actionable advice
                - Reference specific Erasmus+ requirements when relevant
                - Help users understand evaluation criteria
                - Suggest best practices from successful applications
                - Be encouraging and supportive
                - Keep responses concise but comprehensive
                """
            }
        ]

        # Add conversation history
        for msg in chat_message.conversation_history[-10:]:  # Keep last 10 messages for context
            messages.append({
                "role": msg.get("role", "user"),
                "content": msg.get("content", "")
            })

        # Add current message
        messages.append({
            "role": "user",
            "content": chat_message.message
        })

        print(f"Sending {len(messages)} messages to OpenAI...")
        print(f"Messages structure: {[{'role': m['role'], 'content_length': len(m['content'])} for m in messages]}")

        # Get response from OpenAI
        try:
            response = await openai_service.generate_chat_completion(
                messages=messages,
                max_tokens=1000,
                temperature=0.7
            )
            print(f"OpenAI response received: {len(response)} characters")
        except Exception as openai_error:
            print(f"OpenAI API error: {str(openai_error)}")
            print(f"Error type: {type(openai_error).__name__}")
            raise

        print("Creating response object...")
        return ChatResponse(
            response=response,
            timestamp=datetime.now().isoformat()
        )

    except Exception as e:
        print(f"=== AI ASSISTANT ERROR ===")
        print(f"Error type: {type(e).__name__}")
        print(f"Error message: {str(e)}")
        import traceback
        print(f"Traceback:\n{traceback.format_exc()}")
        raise HTTPException(
            status_code=500,
            detail="I apologize, but I encountered an error processing your request. Please try again."
        )

@router.get("/suggestions")
async def get_suggestions(
    topic: str = None,
    current_user: User = Depends(get_current_user)
):
    """
    Get contextual suggestions based on user's current work
    """
    print(f"\n=== AI ASSISTANT SUGGESTIONS REQUEST ===")
    print(f"User: {current_user.username} (ID: {current_user.id})")
    print(f"Topic: {topic}")

    suggestions = {
        "general": [
            "How do I write a compelling project summary?",
            "What are the key evaluation criteria for KA220-ADU?",
            "How can I demonstrate project impact effectively?",
            "What makes a strong partnership?",
            "How do I align my project with EU priorities?"
        ],
        "project_design": [
            "How do I structure my work packages?",
            "What are effective dissemination strategies?",
            "How can I ensure project sustainability?",
            "What are good quality assurance methods?",
            "How do I plan project management effectively?"
        ],
        "partnership": [
            "What types of partners should I look for?",
            "How do I demonstrate partner complementarity?",
            "What are the roles and responsibilities of partners?",
            "How do I manage international collaboration?",
            "What makes a balanced partnership?"
        ],
        "budget": [
            "How do I calculate personnel costs?",
            "What are eligible and ineligible costs?",
            "How do I justify my budget?",
            "What is the typical budget distribution?",
            "How do I handle co-financing?"
        ]
    }

    if topic and topic in suggestions:
        return {"suggestions": suggestions[topic]}

    return {"suggestions": suggestions["general"]}