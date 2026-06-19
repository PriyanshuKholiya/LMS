import uuid
from datetime import date
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Security, status
from sqlalchemy.orm import Session
from app.core import deps
from app.crud import attendance as crud_attendance
from app.crud import course as crud_course
from app.schemas.attendance import AttendanceResponse, AttendanceCreate
from app.models.user import User, UserRole

router = APIRouter()


# ==========================================
# HELPERS
# ==========================================
def verify_attendance_instructor(db: Session, course_id: uuid.UUID, current_user: User):
    """
    Ensure the course exists and current user has permission to manage attendance.
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
            detail="You do not have permission to manage attendance for this course."
        )
    return course


# ==========================================
# ROUTES
# ==========================================
@router.get("/courses/{course_id}/attendance", response_model=List[AttendanceResponse])
def read_attendance_records(
    course_id: uuid.UUID,
    record_date: Optional[date] = None,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
):
    """
    Get attendance sheet records. Students retrieve their own history; Faculty/Admin retrieve course logs.
    """
    course = crud_course.get_course(db, course_id)
    if not course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Course not found"
        )

    # Student validation: retrieve only self-attendance
    if current_user.role == UserRole.STUDENT:
        enrollment = crud_course.get_enrollment_by_student_and_course(
            db, student_id=current_user.id, course_id=course_id
        )
        if not enrollment:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You must be enrolled in this course to view attendance."
            )
        return crud_attendance.get_attendance_by_student_and_course(
            db, student_id=current_user.id, course_id=course_id
        )

    # Faculty / Admin: verify instructor permissions
    verify_attendance_instructor(db, course_id, current_user)
    
    if record_date:
        return crud_attendance.get_attendance_by_course_and_date(
            db, course_id=course_id, record_date=record_date
        )
        
    # Standard: list all records for student history in that course
    # (In a production setup we could implement date filters or pagination)
    from sqlalchemy import select
    from app.models.attendance import Attendance
    statement = select(Attendance).where(Attendance.course_id == course_id)
    return list(db.scalars(statement).all())


@router.post("/courses/{course_id}/attendance", response_model=List[AttendanceResponse])
def record_attendance(
    course_id: uuid.UUID,
    *,
    db: Session = Depends(deps.get_db),
    records_in: List[AttendanceCreate],
    current_user: User = Security(deps.RoleChecker([UserRole.ADMIN, UserRole.FACULTY]))
):
    """
    Bulk record or update student attendance logs. Enforces enrollment verification.
    """
    verify_attendance_instructor(db, course_id, current_user)
    
    # Validation: Ensure all submitted records are for the specified course and that students are enrolled
    for rec in records_in:
        if rec.course_id != course_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Attendance record course_id {rec.course_id} does not match the URL course_id {course_id}."
            )
        
        # Check student enrollment
        enrollment = crud_course.get_enrollment_by_student_and_course(
            db, student_id=rec.student_id, course_id=course_id
        )
        if not enrollment:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Student {rec.student_id} is not enrolled in course {course_id}."
            )
            
    return crud_attendance.create_bulk_attendance_records(db, records_in=records_in)
