from typing import Any, Dict, List
from pydantic import BaseModel


class AdminOverviewResponse(BaseModel):
    total_students: int
    total_faculty: int
    total_courses: int
    total_enrollments: int
    average_course_progress: float


class CourseAnalyticsResponse(BaseModel):
    total_enrolled: int
    average_progress: float
    average_quiz_score: float
    average_assignment_score: float
    attendance_rate: float


class StudentCourseAnalyticsResponse(BaseModel):
    progress: float
    attendance_rate: float
    quiz_grades: List[Dict[str, Any]]
    assignment_grades: List[Dict[str, Any]]
