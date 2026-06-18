import uuid
from datetime import date
from typing import Optional
from pydantic import BaseModel
from app.models.attendance import AttendanceStatus


class AttendanceBase(BaseModel):
    record_date: date
    status: AttendanceStatus = AttendanceStatus.PRESENT


class AttendanceCreate(AttendanceBase):
    student_id: uuid.UUID
    course_id: uuid.UUID


class AttendanceUpdate(BaseModel):
    status: AttendanceStatus


class AttendanceResponse(AttendanceBase):
    id: uuid.UUID
    student_id: uuid.UUID
    course_id: uuid.UUID

    class Config:
        from_attributes = True
