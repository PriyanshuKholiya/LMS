import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException, Security, status
from sqlalchemy.orm import Session
from app.core import deps
from app.crud import assignment as crud_assignment
from app.crud import course as crud_course
from app.schemas.assignment import (
    AssignmentResponse,
    AssignmentCreate,
    SubmissionResponse,
    SubmissionCreate,
    SubmissionUpdate
)
from app.models.user import User, UserRole

router = APIRouter()


# ==========================================
# HELPERS
# ==========================================
def verify_course_instructor(db: Session, course_id: uuid.UUID, current_user: User):
    """
    Ensure course exists and user is either the assigned Faculty instructor or an Admin.
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
            detail="You do not have permission to manage assignments for this course."
        )
    return course


# ==========================================
# ROUTES
# ==========================================
@router.get("/courses/{course_id}/assignments", response_model=List[AssignmentResponse])
def read_assignments(
    course_id: uuid.UUID,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
):
    """
    List all assignments for a course.
    """
    course = crud_course.get_course(db, course_id)
    if not course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Course not found"
        )
    return crud_assignment.get_assignments_by_course(db, course_id=course_id)


@router.post("/courses/{course_id}/assignments", response_model=AssignmentResponse, status_code=status.HTTP_201_CREATED)
def create_assignment(
    course_id: uuid.UUID,
    *,
    db: Session = Depends(deps.get_db),
    assignment_in: AssignmentCreate,
    current_user: User = Security(deps.RoleChecker([UserRole.ADMIN, UserRole.FACULTY]))
):
    """
    Publish a new course assignment. Restricted to Admin & Faculty course instructor.
    """
    verify_course_instructor(db, course_id, current_user)
    if assignment_in.course_id != course_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Assignment course_id does not match the URL path."
        )
    return crud_assignment.create_assignment(db, assignment_in=assignment_in)


@router.post("/assignments/{id}/submit", response_model=SubmissionResponse, status_code=status.HTTP_201_CREATED)
def submit_assignment(
    id: uuid.UUID,
    *,
    db: Session = Depends(deps.get_db),
    submission_in: SubmissionCreate,
    current_user: User = Security(deps.RoleChecker([UserRole.STUDENT]))
):
    """
    Submit coursework files for grading. Student only.
    """
    assignment = crud_assignment.get_assignment(db, id)
    if not assignment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Assignment not found"
        )
    
    # Validation: Verify that the student is submitting for themselves
    if submission_in.student_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only upload submissions for your own user account."
        )
        
    # Validation: Verify that the student is enrolled in the course
    enrollment = crud_course.get_enrollment_by_student_and_course(
        db, student_id=current_user.id, course_id=assignment.course_id
    )
    if not enrollment:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You must be enrolled in the course to submit assignments."
        )
    
    # Check if a submission already exists (update it or raise error; let's allow re-submission by replacing or updating)
    existing = crud_assignment.get_submission_by_student_and_assignment(
        db, student_id=current_user.id, assignment_id=id
    )
    if existing:
        # If already exists, we will update the file url
        # For simplicity in this skeleton, we just update the model directly:
        existing.file_url = submission_in.file_url
        db.add(existing)
        db.commit()
        db.refresh(existing)
        return existing

    return crud_assignment.create_submission(db, submission_in=submission_in)


@router.get("/assignments/{id}/submissions", response_model=List[SubmissionResponse])
def read_submissions(
    id: uuid.UUID,
    db: Session = Depends(deps.get_db),
    current_user: User = Security(deps.RoleChecker([UserRole.ADMIN, UserRole.FACULTY]))
):
    """
    List student submissions for an assignment. Restricted to Admin & Faculty course instructor.
    """
    assignment = crud_assignment.get_assignment(db, id)
    if not assignment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Assignment not found"
        )
    verify_course_instructor(db, assignment.course_id, current_user)
    return crud_assignment.get_submissions_by_assignment(db, assignment_id=id)


@router.put("/submissions/{submission_id}/grade", response_model=SubmissionResponse)
def grade_submission(
    submission_id: uuid.UUID,
    *,
    db: Session = Depends(deps.get_db),
    grade_in: SubmissionUpdate,
    current_user: User = Security(deps.RoleChecker([UserRole.ADMIN, UserRole.FACULTY]))
):
    """
    Score and add feedback comments to a student's submission. Restricted to course instructor or Admin.
    """
    submission = crud_assignment.get_submission(db, submission_id)
    if not submission:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Submission not found"
        )
    
    assignment = crud_assignment.get_assignment(db, submission.assignment_id)
    verify_course_instructor(db, assignment.course_id, current_user)
    
    # Validation: Ensure points awarded does not exceed maximum points of assignment
    if grade_in.points_awarded is not None:
        if grade_in.points_awarded < 0 or grade_in.points_awarded > assignment.max_points:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Points awarded must be between 0 and the maximum points of {assignment.max_points}."
            )
            
    return crud_assignment.update_submission_grading(db, db_submission=submission, grade_in=grade_in)
