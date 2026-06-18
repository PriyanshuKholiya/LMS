import uuid
from typing import List
from fastapi import APIRouter, Depends, Security
from sqlalchemy.orm import Session
from app.core import deps
from app.schemas.quiz import QuizResponse, QuizCreate, QuizAttemptResponse, QuizAttemptCreate
from app.models.user import User

router = APIRouter()


@router.post("/courses/{course_id}/quizzes", response_model=QuizResponse)
def create_quiz(
    course_id: uuid.UUID,
    *,
    db: Session = Depends(deps.get_db),
    quiz_in: QuizCreate,
    current_user: User = Security(deps.RoleChecker(["ADMIN", "FACULTY"]))
):
    """
    Publish a course quiz. Restricted to Admin & Faculty.
    """
    pass


@router.get("/quizzes/{id}", response_model=QuizResponse)
def read_quiz(
    id: uuid.UUID,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
):
    """
    Retrieve quiz questions.
    """
    pass


@router.post("/quizzes/{id}/attempts", response_model=QuizAttemptResponse)
def create_quiz_attempt(
    id: uuid.UUID,
    *,
    db: Session = Depends(deps.get_db),
    attempt_in: QuizAttemptCreate,
    current_user: User = Security(deps.RoleChecker(["STUDENT"]))
):
    """
    Initiate a quiz attempt. Student only.
    """
    pass


@router.post("/quizzes/{id}/submit", response_model=QuizAttemptResponse)
def submit_quiz_answers(
    id: uuid.UUID,
    db: Session = Depends(deps.get_db),
    current_user: User = Security(deps.RoleChecker(["STUDENT"]))
):
    """
    Submit answer choices and grade the attempt. Student only.
    """
    pass


@router.get("/quizzes/{id}/attempts", response_model=List[QuizAttemptResponse])
def read_quiz_attempts(
    id: uuid.UUID,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
):
    """
    List attempts for a quiz. Students retrieve their own history, Admins & Faculty retrieve all.
    """
    pass
