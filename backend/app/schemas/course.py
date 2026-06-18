import uuid
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel
from app.models.course import CourseStatus


# Lesson Schemas
class LessonBase(BaseModel):
    title: str
    content_markdown: Optional[str] = None
    video_url: Optional[str] = None
    sort_order: int = 0


class LessonCreate(LessonBase):
    module_id: uuid.UUID


class LessonUpdate(BaseModel):
    title: Optional[str] = None
    content_markdown: Optional[str] = None
    video_url: Optional[str] = None
    sort_order: Optional[int] = None


class LessonResponse(LessonBase):
    id: uuid.UUID
    module_id: uuid.UUID

    class Config:
        from_attributes = True


# Module Schemas
class ModuleBase(BaseModel):
    title: str
    sort_order: int = 0


class ModuleCreate(ModuleBase):
    course_id: uuid.UUID


class ModuleUpdate(BaseModel):
    title: Optional[str] = None
    sort_order: Optional[int] = None


class ModuleResponse(ModuleBase):
    id: uuid.UUID
    course_id: uuid.UUID
    lessons: List[LessonResponse] = []

    class Config:
        from_attributes = True


# Course Schemas
class CourseBase(BaseModel):
    title: str
    description: Optional[str] = None
    status: CourseStatus = CourseStatus.DRAFT


class CourseCreate(CourseBase):
    instructor_id: uuid.UUID


class CourseUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[CourseStatus] = None
    instructor_id: Optional[uuid.UUID] = None


class CourseResponse(CourseBase):
    id: uuid.UUID
    instructor_id: uuid.UUID
    created_at: datetime
    modules: List[ModuleResponse] = []

    class Config:
        from_attributes = True


# Enrollment Schemas
class EnrollmentBase(BaseModel):
    student_id: uuid.UUID
    course_id: uuid.UUID


class EnrollmentCreate(EnrollmentBase):
    pass


class EnrollmentUpdate(BaseModel):
    progress_percentage: float


class EnrollmentResponse(EnrollmentBase):
    id: uuid.UUID
    progress_percentage: float
    enrolled_at: datetime

    class Config:
        from_attributes = True
