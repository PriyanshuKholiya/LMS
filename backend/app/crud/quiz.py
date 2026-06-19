import uuid
from typing import List, Optional
from sqlalchemy import select
from sqlalchemy.orm import Session
from app.models.quiz import Quiz, Question, Option, QuizAttempt
from app.schemas.quiz import (
    QuizCreate,
    QuizUpdate,
    QuestionCreate,
    OptionCreate,
    QuizAttemptCreate,
    QuizAttemptUpdate
)


# ==========================================
# QUIZ CRUD operations
# ==========================================
def get_quiz(db: Session, quiz_id: uuid.UUID) -> Optional[Quiz]:
    return db.get(Quiz, quiz_id)


def get_quizzes_by_course(db: Session, course_id: uuid.UUID) -> List[Quiz]:
    statement = select(Quiz).where(Quiz.course_id == course_id)
    return list(db.scalars(statement).all())


def create_quiz(db: Session, quiz_in: QuizCreate) -> Quiz:
    db_quiz = Quiz(
        course_id=quiz_in.course_id,
        title=quiz_in.title,
        duration_minutes=quiz_in.duration_minutes,
        passing_score=quiz_in.passing_score
    )
    db.add(db_quiz)
    db.commit()
    db.refresh(db_quiz)
    return db_quiz


def update_quiz(db: Session, db_quiz: Quiz, quiz_in: QuizUpdate) -> Quiz:
    update_data = quiz_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_quiz, field, value)
    db.add(db_quiz)
    db.commit()
    db.refresh(db_quiz)
    return db_quiz


def delete_quiz(db: Session, db_quiz: Quiz) -> Quiz:
    db.delete(db_quiz)
    db.commit()
    return db_quiz


# ==========================================
# QUESTION CRUD operations
# ==========================================
def get_question(db: Session, question_id: uuid.UUID) -> Optional[Question]:
    return db.get(Question, question_id)


def create_question(db: Session, question_in: QuestionCreate) -> Question:
    db_question = Question(
        quiz_id=question_in.quiz_id,
        question_text=question_in.question_text,
        type=question_in.type,
        points=question_in.points
    )
    db.add(db_question)
    db.commit()
    db.refresh(db_question)
    return db_question


# ==========================================
# OPTION CRUD operations
# ==========================================
def get_option(db: Session, option_id: uuid.UUID) -> Optional[Option]:
    return db.get(Option, option_id)


def create_option(db: Session, option_in: OptionCreate) -> Option:
    db_option = Option(
        question_id=option_in.question_id,
        option_text=option_in.option_text,
        is_correct=option_in.is_correct
    )
    db.add(db_option)
    db.commit()
    db.refresh(db_option)
    return db_option


# ==========================================
# QUIZ ATTEMPT CRUD operations
# ==========================================
def get_attempt(db: Session, attempt_id: uuid.UUID) -> Optional[QuizAttempt]:
    return db.get(QuizAttempt, attempt_id)


def get_attempts_by_quiz(db: Session, quiz_id: uuid.UUID) -> List[QuizAttempt]:
    statement = select(QuizAttempt).where(QuizAttempt.quiz_id == quiz_id)
    return list(db.scalars(statement).all())


def get_attempts_by_student(db: Session, student_id: uuid.UUID) -> List[QuizAttempt]:
    statement = select(QuizAttempt).where(QuizAttempt.student_id == student_id)
    return list(db.scalars(statement).all())


def get_attempts_by_student_and_quiz(db: Session, student_id: uuid.UUID, quiz_id: uuid.UUID) -> List[QuizAttempt]:
    statement = select(QuizAttempt).where(
        QuizAttempt.student_id == student_id,
        QuizAttempt.quiz_id == quiz_id
    )
    return list(db.scalars(statement).all())


def create_attempt(db: Session, attempt_in: QuizAttemptCreate) -> QuizAttempt:
    db_attempt = QuizAttempt(
        quiz_id=attempt_in.quiz_id,
        student_id=attempt_in.student_id
    )
    db.add(db_attempt)
    db.commit()
    db.refresh(db_attempt)
    return db_attempt


def update_attempt(db: Session, db_attempt: QuizAttempt, attempt_in: QuizAttemptUpdate) -> QuizAttempt:
    update_data = attempt_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_attempt, field, value)
    db.add(db_attempt)
    db.commit()
    db.refresh(db_attempt)
    return db_attempt
