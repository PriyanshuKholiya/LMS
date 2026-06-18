import uuid
from typing import List, Optional
from sqlalchemy import select
from sqlalchemy.orm import Session
from app.models.course import Course, Module, Lesson, Enrollment
from app.schemas.course import (
    CourseCreate,
    CourseUpdate,
    ModuleCreate,
    ModuleUpdate,
    LessonCreate,
    LessonUpdate,
    EnrollmentCreate
)


# ==========================================
# COURSE CRUD operations
# ==========================================
def get_course(db: Session, course_id: uuid.UUID) -> Optional[Course]:
    return db.get(Course, course_id)


def get_courses(db: Session, skip: int = 0, limit: int = 100) -> List[Course]:
    statement = select(Course).offset(skip).limit(limit)
    return list(db.scalars(statement).all())


def get_courses_by_instructor(db: Session, instructor_id: uuid.UUID, skip: int = 0, limit: int = 100) -> List[Course]:
    statement = select(Course).where(Course.instructor_id == instructor_id).offset(skip).limit(limit)
    return list(db.scalars(statement).all())


def create_course(db: Session, course_in: CourseCreate) -> Course:
    db_course = Course(
        title=course_in.title,
        description=course_in.description,
        instructor_id=course_in.instructor_id,
        status=course_in.status
    )
    db.add(db_course)
    db.commit()
    db.refresh(db_course)
    return db_course


def update_course(db: Session, db_course: Course, course_in: CourseUpdate) -> Course:
    update_data = course_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_course, field, value)
    db.add(db_course)
    db.commit()
    db.refresh(db_course)
    return db_course


def delete_course(db: Session, db_course: Course) -> Course:
    db.delete(db_course)
    db.commit()
    return db_course


# ==========================================
# MODULE CRUD operations
# ==========================================
def get_module(db: Session, module_id: uuid.UUID) -> Optional[Module]:
    return db.get(Module, module_id)


def get_modules_by_course(db: Session, course_id: uuid.UUID) -> List[Module]:
    statement = select(Module).where(Module.course_id == course_id).order_by(Module.sort_order)
    return list(db.scalars(statement).all())


def create_module(db: Session, module_in: ModuleCreate) -> Module:
    db_module = Module(
        course_id=module_in.course_id,
        title=module_in.title,
        sort_order=module_in.sort_order
    )
    db.add(db_module)
    db.commit()
    db.refresh(db_module)
    return db_module


def update_module(db: Session, db_module: Module, module_in: ModuleUpdate) -> Module:
    update_data = module_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_module, field, value)
    db.add(db_module)
    db.commit()
    db.refresh(db_module)
    return db_module


def delete_module(db: Session, db_module: Module) -> Module:
    db.delete(db_module)
    db.commit()
    return db_module


# ==========================================
# LESSON CRUD operations
# ==========================================
def get_lesson(db: Session, lesson_id: uuid.UUID) -> Optional[Lesson]:
    return db.get(Lesson, lesson_id)


def get_lessons_by_module(db: Session, module_id: uuid.UUID) -> List[Lesson]:
    statement = select(Lesson).where(Lesson.module_id == module_id).order_by(Lesson.sort_order)
    return list(db.scalars(statement).all())


def create_lesson(db: Session, lesson_in: LessonCreate) -> Lesson:
    db_lesson = Lesson(
        module_id=lesson_in.module_id,
        title=lesson_in.title,
        content_markdown=lesson_in.content_markdown,
        video_url=lesson_in.video_url,
        sort_order=lesson_in.sort_order
    )
    db.add(db_lesson)
    db.commit()
    db.refresh(db_lesson)
    return db_lesson


def update_lesson(db: Session, db_lesson: Lesson, lesson_in: LessonUpdate) -> Lesson:
    update_data = lesson_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_lesson, field, value)
    db.add(db_lesson)
    db.commit()
    db.refresh(db_lesson)
    return db_lesson


def delete_lesson(db: Session, db_lesson: Lesson) -> Lesson:
    db.delete(db_lesson)
    db.commit()
    return db_lesson


# ==========================================
# ENROLLMENT CRUD operations
# ==========================================
def get_enrollment(db: Session, enrollment_id: uuid.UUID) -> Optional[Enrollment]:
    return db.get(Enrollment, enrollment_id)


def get_enrollment_by_student_and_course(db: Session, student_id: uuid.UUID, course_id: uuid.UUID) -> Optional[Enrollment]:
    statement = select(Enrollment).where(
        Enrollment.student_id == student_id,
        Enrollment.course_id == course_id
    )
    return db.scalars(statement).first()


def get_enrollments_by_student(db: Session, student_id: uuid.UUID, skip: int = 0, limit: int = 100) -> List[Enrollment]:
    statement = select(Enrollment).where(Enrollment.student_id == student_id).offset(skip).limit(limit)
    return list(db.scalars(statement).all())


def create_enrollment(db: Session, enrollment_in: EnrollmentCreate) -> Enrollment:
    db_enrollment = Enrollment(
        student_id=enrollment_in.student_id,
        course_id=enrollment_in.course_id
    )
    db.add(db_enrollment)
    db.commit()
    db.refresh(db_enrollment)
    return db_enrollment


def remove_enrollment(db: Session, db_enrollment: Enrollment) -> Enrollment:
    db.delete(db_enrollment)
    db.commit()
    return db_enrollment
