import uuid
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel
from app.models.ai_tutor import MessageSender


class AIMessageBase(BaseModel):
    content: str


class AIMessageCreate(AIMessageBase):
    chat_id: uuid.UUID
    sender: MessageSender


class AIMessageResponse(AIMessageBase):
    id: uuid.UUID
    chat_id: uuid.UUID
    sender: MessageSender
    created_at: datetime

    class Config:
        from_attributes = True


class AIChatBase(BaseModel):
    course_id: uuid.UUID


class AIChatCreate(AIChatBase):
    student_id: uuid.UUID


class AIChatResponse(AIChatBase):
    id: uuid.UUID
    student_id: uuid.UUID
    created_at: datetime
    messages: List[AIMessageResponse] = []

    class Config:
        from_attributes = True


class AIExplainRequest(BaseModel):
    concept_name: str
    course_title: str


class AIMCQRequest(BaseModel):
    topic: str
    num_questions: int = 3


class AIStudyPlanRequest(BaseModel):
    topic: str
    duration_weeks: int = 4

