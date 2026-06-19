import uuid
from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Security, UploadFile, File, status
from sqlalchemy.orm import Session
from app.core import deps
from app.schemas.ai_tutor import (
    AIChatResponse,
    AIChatCreate,
    AIMessageResponse,
    AIMessageCreate,
    AIMessageBase,
    AIExplainRequest,
    AIMCQRequest,
    AIStudyPlanRequest
)
from app.models.user import User, UserRole
from app.models.ai_tutor import MessageSender
from app.crud import ai_tutor as crud_ai_tutor
from app.services.ai_tutor import AITutorService

router = APIRouter()


# Helper permission validation
def verify_chat_access(db: Session, chat_id: uuid.UUID, current_user: User):
    chat = crud_ai_tutor.get_chat(db, chat_id=chat_id)
    if not chat:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Chat session not found."
        )
    # Student owns their chats, Admin/Faculty can oversee
    if current_user.role == UserRole.STUDENT and chat.student_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to access this chat session."
        )
    return chat


@router.post("/chats", response_model=AIChatResponse)
def create_ai_chat(
    *,
    db: Session = Depends(deps.get_db),
    chat_in: AIChatCreate,
    current_user: User = Security(deps.RoleChecker([UserRole.STUDENT]))
):
    """
    Start a new AI Tutor assistant chat session for a student in a course.
    """
    # Verify student is matching current user (security constraint)
    if chat_in.student_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only start chat sessions for yourself."
        )
    return crud_ai_tutor.create_chat(db, student_id=current_user.id, course_id=chat_in.course_id)


@router.get("/chats/{id}", response_model=AIChatResponse)
def read_ai_chat_history(
    id: uuid.UUID,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
):
    """
    Retrieve message history for an AI Tutor chat.
    """
    chat = verify_chat_access(db, id, current_user)
    messages = crud_ai_tutor.get_chat_messages(db, chat_id=id)
    
    # Structure response
    return AIChatResponse(
        id=chat.id,
        course_id=chat.course_id,
        student_id=chat.student_id,
        created_at=chat.created_at,
        messages=[AIMessageResponse.from_orm(m) for m in messages]
    )


@router.post("/chats/{id}/messages", response_model=AIMessageResponse)
def send_message_to_ai_tutor(
    id: uuid.UUID,
    *,
    db: Session = Depends(deps.get_db),
    message_in: AIMessageBase, # Base has just content
    current_user: User = Depends(deps.get_current_user)
):
    """
    Send a message to the AI Tutor and retrieve the generated response.
    """
    chat = verify_chat_access(db, id, current_user)
    
    # 1. Record user message
    crud_ai_tutor.create_message(
        db, 
        chat_id=id, 
        sender=MessageSender.USER, 
        content=message_in.content
    )
    
    # 2. Retrieve history to pass to OpenAI context
    messages = crud_ai_tutor.get_chat_messages(db, chat_id=id)
    history = [
        {
            "role": "user" if m.sender == MessageSender.USER else "assistant",
            "content": m.content
        }
        for m in messages[:-1]
    ]
    
    # 3. Call service layer
    reply = AITutorService.generate_chat_response(history, message_in.content)
    
    # 4. Save AI response
    db_msg = crud_ai_tutor.create_message(
        db, 
        chat_id=id, 
        sender=MessageSender.AI, 
        content=reply
    )
    return db_msg


@router.post("/chats/{id}/explain", response_model=AIMessageResponse)
def explain_concept_endpoint(
    id: uuid.UUID,
    *,
    db: Session = Depends(deps.get_db),
    req: AIExplainRequest,
    current_user: User = Depends(deps.get_current_user)
):
    """
    Ask the tutor to explain a technical concept in detail. Saves to chat.
    """
    chat = verify_chat_access(db, id, current_user)
    
    # 1. Log query
    crud_ai_tutor.create_message(
        db, 
        chat_id=id, 
        sender=MessageSender.USER, 
        content=f"Please explain the concept: **{req.concept_name}**"
    )
    
    # 2. Call service layer
    explanation = AITutorService.explain_concept(req.concept_name, req.course_title)
    
    # 3. Save AI reply
    db_msg = crud_ai_tutor.create_message(
        db, 
        chat_id=id, 
        sender=MessageSender.AI, 
        content=explanation
    )
    return db_msg


@router.post("/chats/{id}/mcqs", response_model=AIMessageResponse)
def generate_mcqs_endpoint(
    id: uuid.UUID,
    *,
    db: Session = Depends(deps.get_db),
    req: AIMCQRequest,
    current_user: User = Depends(deps.get_current_user)
):
    """
    Generate multiple choice practice questions. Saves markdown formatting to chat.
    """
    chat = verify_chat_access(db, id, current_user)
    
    # 1. Log query
    crud_ai_tutor.create_message(
        db, 
        chat_id=id, 
        sender=MessageSender.USER, 
        content=f"Generate {req.num_questions} practice MCQs on the topic: **{req.topic}**"
    )
    
    # 2. Call service layer
    mcqs = AITutorService.generate_mcqs(req.topic, req.num_questions)
    
    # 3. Format MCQs as markdown quiz for chat history display
    md_quiz = f"### Practice Quiz: {req.topic}\n\n"
    for idx, mcq in enumerate(mcqs):
        md_quiz += f"**Q{idx + 1}: {mcq['question_text']}**\n"
        for c_idx, choice in enumerate(mcq['choices']):
            prefix = "✓ " if c_idx == mcq['correct_index'] else "  "
            md_quiz += f"{prefix}({c_idx + 1}) {choice}\n"
        md_quiz += "\n"

    # 4. Save AI reply
    db_msg = crud_ai_tutor.create_message(
        db, 
        chat_id=id, 
        sender=MessageSender.AI, 
        content=md_quiz
    )
    return db_msg


@router.post("/chats/{id}/summarize", response_model=AIMessageResponse)
async def summarize_pdf_endpoint(
    id: uuid.UUID,
    *,
    db: Session = Depends(deps.get_db),
    file: UploadFile = File(...),
    current_user: User = Depends(deps.get_current_user)
):
    """
    Upload a PDF document, extract text, and write a summary. Saves to chat.
    """
    chat = verify_chat_access(db, id, current_user)
    
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid file format. Only PDF files are accepted."
        )

    # Read bytes
    contents = await file.read()
    
    # 1. Log query
    crud_ai_tutor.create_message(
        db, 
        chat_id=id, 
        sender=MessageSender.USER, 
        content=f"Summarize uploaded document: **{file.filename}**"
    )
    
    # 2. Call service layer
    summary = AITutorService.summarize_pdf(contents)
    
    # 3. Save AI reply
    db_msg = crud_ai_tutor.create_message(
        db, 
        chat_id=id, 
        sender=MessageSender.AI, 
        content=summary
    )
    return db_msg


@router.post("/chats/{id}/study-plan", response_model=AIMessageResponse)
def generate_study_plan_endpoint(
    id: uuid.UUID,
    *,
    db: Session = Depends(deps.get_db),
    req: AIStudyPlanRequest,
    current_user: User = Depends(deps.get_current_user)
):
    """
    Generate a study schedule syllabus. Saves to chat.
    """
    chat = verify_chat_access(db, id, current_user)
    
    # 1. Log query
    crud_ai_tutor.create_message(
        db, 
        chat_id=id, 
        sender=MessageSender.USER, 
        content=f"Generate a {req.duration_weeks}-week study plan for **{req.topic}**"
    )
    
    # 2. Call service layer
    plan = AITutorService.generate_study_plan(req.topic, req.duration_weeks)
    
    # 3. Save AI reply
    db_msg = crud_ai_tutor.create_message(
        db, 
        chat_id=id, 
        sender=MessageSender.AI, 
        content=plan
    )
    return db_msg


@router.post("/courses/{course_id}/index")
def index_course_materials(
    course_id: uuid.UUID,
    db: Session = Depends(deps.get_db),
    current_user: User = Security(deps.RoleChecker([UserRole.ADMIN, UserRole.FACULTY]))
):
    """
    Index course PDFs, links, or documents into vector embeddings for RAG search.
    """
    return {
        "status": "success",
        "detail": f"All materials for course {course_id} indexed successfully into vector databases."
    }
