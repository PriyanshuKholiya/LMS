import uuid
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel
from app.models.quiz import QuestionType


# Option Schemas
class OptionBase(BaseModel):
    option_text: str
    is_correct: bool = False


class OptionCreate(OptionBase):
    question_id: uuid.UUID


class OptionResponse(OptionBase):
    id: uuid.UUID
    question_id: uuid.UUID

    class Config:
        from_attributes = True


# Question Schemas
class QuestionBase(BaseModel):
    question_text: str
    type: QuestionType = QuestionType.MCQ
    points: int = 10


class QuestionCreate(QuestionBase):
    quiz_id: uuid.UUID


class QuestionResponse(QuestionBase):
    id: uuid.UUID
    quiz_id: uuid.UUID
    options: List[OptionResponse] = []

    class Config:
        from_attributes = True


# Quiz Schemas
class QuizBase(BaseModel):
    title: str
    duration_minutes: int = 30
    passing_score: int = 60


class QuizCreate(QuizBase):
    course_id: uuid.UUID


class QuizUpdate(BaseModel):
    title: Optional[str] = None
    duration_minutes: Optional[int] = None
    passing_score: Optional[int] = None


class QuizResponse(QuizBase):
    id: uuid.UUID
    course_id: uuid.UUID
    questions: List[QuestionResponse] = []

    class Config:
        from_attributes = True


# QuizAttempt Schemas
class QuizAttemptBase(BaseModel):
    quiz_id: uuid.UUID
    student_id: uuid.UUID


class QuizAttemptCreate(QuizAttemptBase):
    pass


class QuizAttemptUpdate(BaseModel):
    score_obtained: int
    passed: bool


class QuizAttemptResponse(QuizAttemptBase):
    id: uuid.UUID
    score_obtained: int
    passed: bool
    completed_at: datetime

    class Config:
        from_attributes = True
