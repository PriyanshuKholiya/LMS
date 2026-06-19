import uuid
from fastapi import APIRouter, Depends, HTTPException, Security, status
from sqlalchemy.orm import Session
from app.core import deps
from app.crud import analytics as crud_analytics
from app.crud import course as crud_course
from app.schemas.analytics import (
    AdminOverviewResponse,
    CourseAnalyticsResponse,
    StudentCourseAnalyticsResponse
)
from app.models.user import User, UserRole

router = APIRouter()


# ==========================================
# HELPERS
# ==========================================
def verify_analytics_instructor(db: Session, course_id: uuid.UUID, current_user: User):
    """
    Ensure the course exists and current user has permission to view course analytics.
    """
    course = crud_course.get_course(db, course_id)
    if not course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Course not found"
        )
    if current_user.role == UserRole.ADMIN:
        return course
    if course.instructor_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to access analytics for this course."
        )
    return course


# ==========================================
# ROUTES
# ==========================================
@router.get("/admin/overview", response_model=AdminOverviewResponse)
def read_admin_overview(
    db: Session = Depends(deps.get_db),
    current_user: User = Security(deps.RoleChecker([UserRole.ADMIN]))
):
    """
    Retrieve platform-wide overall analytics. Admin only.
    """
    return crud_analytics.get_admin_overview(db)


@router.get("/faculty/courses/{course_id}", response_model=CourseAnalyticsResponse)
def read_course_analytics(
    course_id: uuid.UUID,
    db: Session = Depends(deps.get_db),
    current_user: User = Security(deps.RoleChecker([UserRole.ADMIN, UserRole.FACULTY]))
):
    """
    Retrieve course metrics (averages, totals). Restricted to Admin or course Faculty instructor.
    """
    verify_analytics_instructor(db, course_id, current_user)
    return crud_analytics.get_course_analytics(db, course_id=course_id)


@router.get("/student/courses/{course_id}", response_model=StudentCourseAnalyticsResponse)
def read_student_course_analytics(
    course_id: uuid.UUID,
    db: Session = Depends(deps.get_db),
    current_user: User = Security(deps.RoleChecker([UserRole.STUDENT]))
):
    """
    Retrieve student's personal progress and grade overview for a course. Student only.
    Enforces course enrollment verification.
    """
    course = crud_course.get_course(db, course_id)
    if not course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Course not found"
        )
        
    enrollment = crud_course.get_enrollment_by_student_and_course(
        db, student_id=current_user.id, course_id=course_id
    )
    if not enrollment:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You must be enrolled in this course to access its analytics."
        )
        
    return crud_analytics.get_student_course_analytics(
        db, student_id=current_user.id, course_id=course_id
    )
