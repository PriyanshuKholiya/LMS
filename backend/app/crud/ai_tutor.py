import uuid
from typing import List, Optional
from sqlalchemy import select
from sqlalchemy.orm import Session
from app.models.ai_tutor import AIChat, AIMessage, MessageSender


def get_chat(db: Session, chat_id: uuid.UUID) -> Optional[AIChat]:
    return db.get(AIChat, chat_id)


def get_student_chats(db: Session, student_id: uuid.UUID, course_id: Optional[uuid.UUID] = None) -> List[AIChat]:
    statement = select(AIChat).where(AIChat.student_id == student_id)
    if course_id:
        statement = statement.where(AIChat.course_id == course_id)
    statement = statement.order_by(AIChat.created_at.desc())
    return list(db.scalars(statement).all())


def create_chat(db: Session, student_id: uuid.UUID, course_id: uuid.UUID) -> AIChat:
    db_chat = AIChat(
        student_id=student_id,
        course_id=course_id
    )
    db.add(db_chat)
    db.commit()
    db.refresh(db_chat)
    return db_chat


def create_message(db: Session, chat_id: uuid.UUID, sender: MessageSender, content: str) -> AIMessage:
    db_message = AIMessage(
        chat_id=chat_id,
        sender=sender,
        content=content
    )
    db.add(db_message)
    db.commit()
    db.refresh(db_message)
    return db_message


def get_chat_messages(db: Session, chat_id: uuid.UUID) -> List[AIMessage]:
    statement = select(AIMessage).where(AIMessage.chat_id == chat_id).order_by(AIMessage.created_at.asc())
    return list(db.scalars(statement).all())
