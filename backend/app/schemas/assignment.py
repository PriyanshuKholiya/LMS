import uuid
from datetime import datetime
from typing import Optional
from pydantic import BaseModel


# Assignment Schemas
class AssignmentBase(BaseModel):
    title: str
    instructions: Optional[str] = None
    due_date: datetime
    max_points: int = 100


class AssignmentCreate(AssignmentBase):
    course_id: uuid.UUID


class AssignmentUpdate(BaseModel):
    title: Optional[str] = None
    instructions: Optional[str] = None
    due_date: Optional[datetime] = None
    max_points: Optional[int] = None


class AssignmentResponse(AssignmentBase):
    id: uuid.UUID
    course_id: uuid.UUID

    class Config:
        from_attributes = True


# Submission Schemas
class SubmissionBase(BaseModel):
    file_url: str


class SubmissionCreate(SubmissionBase):
    assignment_id: uuid.UUID
    student_id: uuid.UUID


class SubmissionUpdate(BaseModel):
    feedback_markdown: Optional[str] = None
    points_awarded: Optional[int] = None


class SubmissionResponse(SubmissionBase):
    id: uuid.UUID
    assignment_id: uuid.UUID
    student_id: uuid.UUID
    feedback_markdown: Optional[str] = None
    points_awarded: Optional[int] = None
    submitted_at: datetime

    class Config:
        from_attributes = True
