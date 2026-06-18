import uuid
from typing import List
from fastapi import APIRouter, Depends, Security
from sqlalchemy.orm import Session
from app.core import deps
from app.schemas.ai_tutor import AIChatResponse, AIChatCreate, AIMessageResponse, AIMessageCreate
from app.models.user import User

router = APIRouter()


@router.post("/chats", response_model=AIChatResponse)
def create_ai_chat(
    *,
    db: Session = Depends(deps.get_db),
    chat_in: AIChatCreate,
    current_user: User = Security(deps.RoleChecker(["STUDENT"]))
):
    """
    Start a new AI Tutor assistant chat session for a student in a course.
    """
    pass


@router.get("/chats/{id}", response_model=AIChatResponse)
def read_ai_chat_history(
    id: uuid.UUID,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
):
    """
    Retrieve message history for an AI Tutor chat.
    """
    pass


@router.post("/chats/{id}/messages", response_model=AIMessageResponse)
def send_message_to_ai_tutor(
    id: uuid.UUID,
    *,
    db: Session = Depends(deps.get_db),
    message_in: AIMessageCreate,
    current_user: User = Depends(deps.get_current_user)
):
    """
    Send a message to the AI Tutor and retrieve the generated response.
    """
    pass


@router.post("/courses/{course_id}/index")
def index_course_materials(
    course_id: uuid.UUID,
    db: Session = Depends(deps.get_db),
    current_user: User = Security(deps.RoleChecker(["ADMIN", "FACULTY"]))
):
    """
    Index course PDFs, links, or documents into vector embeddings for RAG search.
    """
    pass
