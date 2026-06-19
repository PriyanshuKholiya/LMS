import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Security, status, BackgroundTasks
from sqlalchemy.orm import Session
from app.core import deps
from app.core.notification_manager import notify_course_students_background
from app.crud import course as crud_course
from app.schemas.course import (
    CourseResponse,
    CourseCreate,
    CourseUpdate,
    EnrollmentResponse,
    EnrollmentCreate,
    ModuleResponse,
    ModuleCreate,
    ModuleUpdate,
    LessonResponse,
    LessonCreate,
    LessonUpdate
)
from app.models.user import User, UserRole

router = APIRouter()


# ==========================================
# HELPERS
# ==========================================
def verify_course_owner(db: Session, course_id: uuid.UUID, current_user: User):
    """
    Ensure the course exists and the current user has permission to modify it.
    Admins can modify any course; Faculty can only modify their own courses.
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
            detail="You do not have permission to manage this course."
        )
    return course


# ==========================================
# COURSES ENDPOINTS
# ==========================================
@router.get("/", response_model=List[CourseResponse])
def read_courses(
    db: Session = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 100,
    instructor_id: Optional[uuid.UUID] = None,
    current_user: User = Depends(deps.get_current_user)
):
    """
    Retrieve courses. Supports optional filtering by instructor.
    """
    if instructor_id:
        return crud_course.get_courses_by_instructor(db, instructor_id=instructor_id, skip=skip, limit=limit)
    return crud_course.get_courses(db, skip=skip, limit=limit)


@router.post("/", response_model=CourseResponse, status_code=status.HTTP_201_CREATED)
def create_course(
    *,
    db: Session = Depends(deps.get_db),
    course_in: CourseCreate,
    current_user: User = Security(deps.RoleChecker([UserRole.ADMIN, UserRole.FACULTY]))
):
    """
    Create a new course. Faculty can only create courses with themselves as the instructor.
    """
    if current_user.role == UserRole.FACULTY and course_in.instructor_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Faculty can only create courses assigned to themselves."
        )
    return crud_course.create_course(db, course_in=course_in)


@router.get("/{id}", response_model=CourseResponse)
def read_course(
    id: uuid.UUID,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
):
    """
    Get course by ID.
    """
    course = crud_course.get_course(db, id)
    if not course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Course not found"
        )
    return course


@router.put("/{id}", response_model=CourseResponse)
def update_course(
    id: uuid.UUID,
    *,
    db: Session = Depends(deps.get_db),
    course_in: CourseUpdate,
    current_user: User = Security(deps.RoleChecker([UserRole.ADMIN, UserRole.FACULTY]))
):
    """
    Update a course. Restricted to the course instructor or an Admin.
    """
    db_course = verify_course_owner(db, id, current_user)
    
    # Validation: Faculty cannot reassign course instructor to someone else
    if current_user.role == UserRole.FACULTY and course_in.instructor_id and course_in.instructor_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Faculty cannot reassign course ownership to another instructor."
        )
        
    return crud_course.update_course(db, db_course=db_course, course_in=course_in)


@router.delete("/{id}", response_model=CourseResponse)
def delete_course(
    id: uuid.UUID,
    db: Session = Depends(deps.get_db),
    current_user: User = Security(deps.RoleChecker([UserRole.ADMIN]))
):
    """
    Delete a course. Restricted to Admins.
    """
    db_course = crud_course.get_course(db, id)
    if not db_course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Course not found"
        )
    return crud_course.delete_course(db, db_course=db_course)


# ==========================================
# ENROLLMENT ENDPOINTS
# ==========================================
@router.post("/{id}/enroll", response_model=EnrollmentResponse, status_code=status.HTTP_201_CREATED)
def enroll_in_course(
    id: uuid.UUID,
    db: Session = Depends(deps.get_db),
    current_user: User = Security(deps.RoleChecker([UserRole.STUDENT]))
):
    """
    Enroll the authenticated student into a course.
    """
    course = crud_course.get_course(db, id)
    if not course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Course not found"
        )
    
    # Check if student is already enrolled
    existing_enrollment = crud_course.get_enrollment_by_student_and_course(
        db, student_id=current_user.id, course_id=id
    )
    if existing_enrollment:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Student is already enrolled in this course."
        )
        
    enrollment_in = EnrollmentCreate(student_id=current_user.id, course_id=id)
    return crud_course.create_enrollment(db, enrollment_in=enrollment_in)


# ==========================================
# MODULES ENDPOINTS
# ==========================================
@router.post("/{id}/modules", response_model=ModuleResponse, status_code=status.HTTP_201_CREATED)
def create_course_module(
    id: uuid.UUID,
    *,
    db: Session = Depends(deps.get_db),
    module_in: ModuleCreate,
    background_tasks: BackgroundTasks,
    current_user: User = Security(deps.RoleChecker([UserRole.ADMIN, UserRole.FACULTY]))
):
    """
    Create a new module for a course. Restricted to the course instructor or an Admin.
    """
    verify_course_owner(db, id, current_user)
    if module_in.course_id != id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Module course_id does not match the URL path."
        )
    db_module = crud_course.create_module(db, module_in=module_in)
    
    # Broadcast notification of syllabus update
    background_tasks.add_task(
        notify_course_students_background,
        id,
        "Course Syllabus Updated",
        f"A new module has been added: '{db_module.title}'"
    )
    
    return db_module


@router.get("/{id}/modules", response_model=List[ModuleResponse])
def read_course_modules(
    id: uuid.UUID,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
):
    """
    List all modules in a course.
    """
    course = crud_course.get_course(db, id)
    if not course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Course not found"
        )
    return crud_course.get_modules_by_course(db, course_id=id)


@router.put("/modules/{module_id}", response_model=ModuleResponse)
def update_course_module(
    module_id: uuid.UUID,
    *,
    db: Session = Depends(deps.get_db),
    module_in: ModuleUpdate,
    current_user: User = Security(deps.RoleChecker([UserRole.ADMIN, UserRole.FACULTY]))
):
    """
    Update module details. Restricted to the course instructor or an Admin.
    """
    db_module = crud_course.get_module(db, module_id)
    if not db_module:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Module not found"
        )
    verify_course_owner(db, db_module.course_id, current_user)
    return crud_course.update_module(db, db_module=db_module, module_in=module_in)


@router.delete("/modules/{module_id}", response_model=ModuleResponse)
def delete_course_module(
    module_id: uuid.UUID,
    db: Session = Depends(deps.get_db),
    current_user: User = Security(deps.RoleChecker([UserRole.ADMIN, UserRole.FACULTY]))
):
    """
    Delete a module. Restricted to the course instructor or an Admin.
    """
    db_module = crud_course.get_module(db, module_id)
    if not db_module:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Module not found"
        )
    verify_course_owner(db, db_module.course_id, current_user)
    return crud_course.delete_module(db, db_module=db_module)


# ==========================================
# LESSONS ENDPOINTS
# ==========================================
@router.post("/modules/{module_id}/lessons", response_model=LessonResponse, status_code=status.HTTP_201_CREATED)
def create_module_lesson(
    module_id: uuid.UUID,
    *,
    db: Session = Depends(deps.get_db),
    lesson_in: LessonCreate,
    background_tasks: BackgroundTasks,
    current_user: User = Security(deps.RoleChecker([UserRole.ADMIN, UserRole.FACULTY]))
):
    """
    Create a new lesson inside a module. Restricted to the course instructor or an Admin.
    """
    db_module = crud_course.get_module(db, module_id)
    if not db_module:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Module not found"
        )
    verify_course_owner(db, db_module.course_id, current_user)
    if lesson_in.module_id != module_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Lesson module_id does not match the URL path."
        )
    db_lesson = crud_course.create_lesson(db, lesson_in=lesson_in)
    
    # Broadcast notification to enrolled students
    background_tasks.add_task(
        notify_course_students_background,
        db_module.course_id,
        "New Lesson Added",
        f"A new lesson has been posted in '{db_module.title}': '{db_lesson.title}'"
    )
    
    return db_lesson


@router.put("/lessons/{lesson_id}", response_model=LessonResponse)
def update_module_lesson(
    lesson_id: uuid.UUID,
    *,
    db: Session = Depends(deps.get_db),
    lesson_in: LessonUpdate,
    current_user: User = Security(deps.RoleChecker([UserRole.ADMIN, UserRole.FACULTY]))
):
    """
    Update lesson details. Restricted to the course instructor or an Admin.
    """
    db_lesson = crud_course.get_lesson(db, lesson_id)
    if not db_lesson:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Lesson not found"
        )
    db_module = crud_course.get_module(db, db_lesson.module_id)
    verify_course_owner(db, db_module.course_id, current_user)
    return crud_course.update_lesson(db, db_lesson=db_lesson, lesson_in=lesson_in)


@router.delete("/lessons/{lesson_id}", response_model=LessonResponse)
def delete_module_lesson(
    lesson_id: uuid.UUID,
    db: Session = Depends(deps.get_db),
    current_user: User = Security(deps.RoleChecker([UserRole.ADMIN, UserRole.FACULTY]))
):
    """
    Delete a lesson. Restricted to the course instructor or an Admin.
    """
    db_lesson = crud_course.get_lesson(db, lesson_id)
    if not db_lesson:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Lesson not found"
        )
    db_module = crud_course.get_module(db, db_lesson.module_id)
    verify_course_owner(db, db_module.course_id, current_user)
    return crud_course.delete_lesson(db, db_lesson=db_lesson)
