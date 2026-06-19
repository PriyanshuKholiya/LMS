import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException, Security, status, BackgroundTasks
from sqlalchemy.orm import Session
from app.core import deps
from app.core.notification_manager import notify_course_students_background
from app.crud import quiz as crud_quiz
from app.crud import course as crud_course
from app.schemas.quiz import (
    QuizResponse,
    QuizCreate,
    QuizUpdate,
    QuizAttemptResponse,
    QuizAttemptCreate,
    QuizAttemptUpdate,
    QuizSubmission
)
from app.models.user import User, UserRole

router = APIRouter()


# ==========================================
# HELPERS
# ==========================================
def verify_quiz_instructor(db: Session, course_id: uuid.UUID, current_user: User):
    """
    Ensure the course exists and the current user has permission to manage quizzes for it.
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
            detail="You do not have permission to manage quizzes for this course."
        )
    return course


# ==========================================
# ROUTES
# ==========================================
@router.post("/courses/{course_id}/quizzes", response_model=QuizResponse, status_code=status.HTTP_201_CREATED)
def create_quiz(
    course_id: uuid.UUID,
    *,
    db: Session = Depends(deps.get_db),
    quiz_in: QuizCreate,
    background_tasks: BackgroundTasks,
    current_user: User = Security(deps.RoleChecker([UserRole.ADMIN, UserRole.FACULTY]))
):
    """
    Publish a course quiz. Restricted to Admin & Faculty course instructor.
    """
    verify_quiz_instructor(db, course_id, current_user)
    if quiz_in.course_id != course_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Quiz course_id does not match the URL path."
        )
    db_quiz = crud_quiz.create_quiz(db, quiz_in=quiz_in)
    
    # Broadcast notification to enrolled students
    background_tasks.add_task(
        notify_course_students_background,
        course_id,
        "New Quiz Published",
        f"A new quiz has been published: '{db_quiz.title}'"
    )
    
    return db_quiz


@router.get("/quizzes/{id}", response_model=QuizResponse)
def read_quiz(
    id: uuid.UUID,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
):
    """
    Retrieve quiz questions. If the user is a Student, correct option indicators are hidden to prevent cheating.
    """
    quiz = crud_quiz.get_quiz(db, id)
    if not quiz:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Quiz not found"
        )
    
    # Hide correct option indicators for Student role
    if current_user.role == UserRole.STUDENT:
        for question in quiz.questions:
            for option in question.options:
                option.is_correct = False
                
    return quiz


@router.post("/quizzes/{id}/attempts", response_model=QuizAttemptResponse, status_code=status.HTTP_201_CREATED)
def create_quiz_attempt(
    id: uuid.UUID,
    *,
    db: Session = Depends(deps.get_db),
    attempt_in: QuizAttemptCreate,
    current_user: User = Security(deps.RoleChecker([UserRole.STUDENT]))
):
    """
    Initiate a quiz attempt. Student only. Enforces active course enrollment.
    """
    quiz = crud_quiz.get_quiz(db, id)
    if not quiz:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Quiz not found"
        )
        
    # Check if student is enrolled in the course associated with this quiz
    enrollment = crud_course.get_enrollment_by_student_and_course(
        db, student_id=current_user.id, course_id=quiz.course_id
    )
    if not enrollment:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You must be enrolled in the course to attempt this quiz."
        )
        
    if attempt_in.student_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only start an attempt for your own user account."
        )
        
    return crud_quiz.create_attempt(db, attempt_in=attempt_in)


@router.post("/quizzes/{id}/submit", response_model=QuizAttemptResponse)
def submit_quiz_answers(
    id: uuid.UUID,
    *,
    db: Session = Depends(deps.get_db),
    submission_in: QuizSubmission,
    current_user: User = Security(deps.RoleChecker([UserRole.STUDENT]))
):
    """
    Submit answer choices and automatically grade the attempt. Student only.
    """
    quiz = crud_quiz.get_quiz(db, id)
    if not quiz:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Quiz not found"
        )
        
    # Find the latest attempt for this student that hasn't been finalized (or final score is 0 and we grade it)
    attempts = crud_quiz.get_attempts_by_student_and_quiz(db, student_id=current_user.id, quiz_id=id)
    if not attempts:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No active quiz attempt found. You must start an attempt first."
        )
    
    # Take the latest attempt
    db_attempt = attempts[-1]
    
    # Automated grading: Match answers with options
    total_score = 0
    student_answers_map = {ans.question_id: ans.selected_option_id for ans in submission_in.answers}
    
    for question in quiz.questions:
        selected_option_id = student_answers_map.get(question.id)
        if selected_option_id:
            # Find the correct option for this question
            correct_option = next((opt for opt in question.options if opt.is_correct), None)
            if correct_option and correct_option.id == selected_option_id:
                total_score += question.points
                
    passed = total_score >= quiz.passing_score
    update_in = QuizAttemptUpdate(score_obtained=total_score, passed=passed)
    
    return crud_quiz.update_attempt(db, db_attempt=db_attempt, attempt_in=update_in)


@router.get("/quizzes/{id}/attempts", response_model=List[QuizAttemptResponse])
def read_quiz_attempts(
    id: uuid.UUID,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
):
    """
    List attempts for a quiz. Students retrieve their own history; Admins & Faculty retrieve all.
    """
    quiz = crud_quiz.get_quiz(db, id)
    if not quiz:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Quiz not found"
        )
        
    if current_user.role == UserRole.STUDENT:
        return crud_quiz.get_attempts_by_student_and_quiz(db, student_id=current_user.id, quiz_id=id)
        
    verify_quiz_instructor(db, quiz.course_id, current_user)
    return crud_quiz.get_attempts_by_quiz(db, quiz_id=id)
