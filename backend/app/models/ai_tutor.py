import uuid
import enum
from datetime import datetime, timezone
from sqlalchemy import String, ForeignKey, Enum, Text, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import Base


class MessageSender(str, enum.Enum):
    USER = "USER"
    AI = "AI"


class AIChat(Base):
    __tablename__ = "ai_chats"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    student_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    course_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("courses.id", ondelete="CASCADE"), nullable=False)
    created_at: Mapped[datetime] = mapped_column(default=lambda: datetime.now(timezone.utc))

    # Relationships
    student = relationship("User", back_populates="ai_chats")
    course = relationship("Course", back_populates="ai_chats")
    messages = relationship("AIMessage", back_populates="chat", cascade="all, delete-orphan")


class AIMessage(Base):
    __tablename__ = "ai_messages"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    chat_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("ai_chats.id", ondelete="CASCADE"), nullable=False)
    sender: Mapped[MessageSender] = mapped_column(Enum(MessageSender), nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    
    # Store embeddings as JSON list of floats in standard setups.
    # Note: If pgvector extension is activated, replace with:
    # from pgvector.sqlalchemy import Vector
    # embedding: Mapped[list] = mapped_column(Vector(1536), nullable=True)
    embedding: Mapped[dict] = mapped_column(JSON, nullable=True)
    
    created_at: Mapped[datetime] = mapped_column(default=lambda: datetime.now(timezone.utc))

    # Relationships
    chat = relationship("AIChat", back_populates="messages")
