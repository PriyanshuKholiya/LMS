import uuid
from typing import List, Optional
from sqlalchemy import select
from sqlalchemy.orm import Session
from app.models.assignment import Assignment, Submission
from app.schemas.assignment import (
    AssignmentCreate,
    AssignmentUpdate,
    SubmissionCreate,
    SubmissionUpdate
)


# ==========================================
# ASSIGNMENT CRUD operations
# ==========================================
def get_assignment(db: Session, assignment_id: uuid.UUID) -> Optional[Assignment]:
    return db.get(Assignment, assignment_id)


def get_assignments_by_course(db: Session, course_id: uuid.UUID) -> List[Assignment]:
    statement = select(Assignment).where(Assignment.course_id == course_id)
    return list(db.scalars(statement).all())


def create_assignment(db: Session, assignment_in: AssignmentCreate) -> Assignment:
    db_assignment = Assignment(
        course_id=assignment_in.course_id,
        title=assignment_in.title,
        instructions=assignment_in.instructions,
        due_date=assignment_in.due_date,
        max_points=assignment_in.max_points
    )
    db.add(db_assignment)
    db.commit()
    db.refresh(db_assignment)
    return db_assignment


def update_assignment(db: Session, db_assignment: Assignment, assignment_in: AssignmentUpdate) -> Assignment:
    update_data = assignment_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_assignment, field, value)
    db.add(db_assignment)
    db.commit()
    db.refresh(db_assignment)
    return db_assignment


def delete_assignment(db: Session, db_assignment: Assignment) -> Assignment:
    db.delete(db_assignment)
    db.commit()
    return db_assignment


# ==========================================
# SUBMISSION CRUD operations
# ==========================================
def get_submission(db: Session, submission_id: uuid.UUID) -> Optional[Submission]:
    return db.get(Submission, submission_id)


def get_submission_by_student_and_assignment(
    db: Session, student_id: uuid.UUID, assignment_id: uuid.UUID
) -> Optional[Submission]:
    statement = select(Submission).where(
        Submission.student_id == student_id,
        Submission.assignment_id == assignment_id
    )
    return db.scalars(statement).first()


def get_submissions_by_assignment(db: Session, assignment_id: uuid.UUID) -> List[Submission]:
    statement = select(Submission).where(Submission.assignment_id == assignment_id)
    return list(db.scalars(statement).all())


def create_submission(db: Session, submission_in: SubmissionCreate) -> Submission:
    db_submission = Submission(
        assignment_id=submission_in.assignment_id,
        student_id=submission_in.student_id,
        file_url=submission_in.file_url
    )
    db.add(db_submission)
    db.commit()
    db.refresh(db_submission)
    return db_submission


def update_submission_grading(db: Session, db_submission: Submission, grade_in: SubmissionUpdate) -> Submission:
    update_data = grade_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_submission, field, value)
    db.add(db_submission)
    db.commit()
    db.refresh(db_submission)
    return db_submission
