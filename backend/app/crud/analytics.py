import uuid
from sqlalchemy import func, select
from sqlalchemy.orm import Session
from app.models.user import User, UserRole
from app.models.course import Course, Enrollment
from app.models.assignment import Assignment, Submission
from app.models.quiz import Quiz, QuizAttempt
from app.models.attendance import Attendance, AttendanceStatus
from app.schemas.analytics import (
    AdminOverviewResponse,
    CourseAnalyticsResponse,
    StudentCourseAnalyticsResponse
)


def get_admin_overview(db: Session) -> AdminOverviewResponse:
    """
    Compute total system users, courses, enrollments, and average student course progress.
    """
    total_students = db.scalar(select(func.count(User.id)).where(User.role == UserRole.STUDENT)) or 0
    total_faculty = db.scalar(select(func.count(User.id)).where(User.role == UserRole.FACULTY)) or 0
    total_courses = db.scalar(select(func.count(Course.id))) or 0
    total_enrollments = db.scalar(select(func.count(Enrollment.id))) or 0
    
    avg_progress = db.scalar(select(func.avg(Enrollment.progress_percentage)))
    avg_progress_val = float(avg_progress) if avg_progress is not None else 0.0
    
    return AdminOverviewResponse(
        total_students=total_students,
        total_faculty=total_faculty,
        total_courses=total_courses,
        total_enrollments=total_enrollments,
        average_course_progress=avg_progress_val
    )


def get_course_analytics(db: Session, course_id: uuid.UUID) -> CourseAnalyticsResponse:
    """
    Aggregate metrics across course enrollments, attendance records, quizzes, and assignment submissions.
    """
    # 1. Total enrolled
    total_enrolled = db.scalar(select(func.count(Enrollment.id)).where(Enrollment.course_id == course_id)) or 0
    
    # 2. Average progress
    avg_progress = db.scalar(select(func.avg(Enrollment.progress_percentage)).where(Enrollment.course_id == course_id))
    avg_progress_val = float(avg_progress) if avg_progress is not None else 0.0
    
    # 3. Average quiz score
    quiz_stmt = select(func.avg(QuizAttempt.score_obtained)).join(Quiz).where(Quiz.course_id == course_id)
    avg_quiz = db.scalar(quiz_stmt)
    avg_quiz_val = float(avg_quiz) if avg_quiz is not None else 0.0
    
    # 4. Average assignment score
    assignment_stmt = select(func.avg(Submission.points_awarded)).join(Assignment).where(Assignment.course_id == course_id)
    avg_assign = db.scalar(assignment_stmt)
    avg_assign_val = float(avg_assign) if avg_assign is not None else 0.0
    
    # 5. Course Attendance Rate
    total_attendance = db.scalar(select(func.count(Attendance.id)).where(Attendance.course_id == course_id)) or 0
    present_attendance = db.scalar(select(func.count(Attendance.id)).where(
        Attendance.course_id == course_id,
        Attendance.status == AttendanceStatus.PRESENT
    )) or 0
    attendance_rate = (present_attendance / total_attendance * 100.0) if total_attendance > 0 else 100.0
    
    return CourseAnalyticsResponse(
        total_enrolled=total_enrolled,
        average_progress=avg_progress_val,
        average_quiz_score=avg_quiz_val,
        average_assignment_score=avg_assign_val,
        attendance_rate=attendance_rate
    )


def get_student_course_analytics(
    db: Session, student_id: uuid.UUID, course_id: uuid.UUID
) -> StudentCourseAnalyticsResponse:
    """
    Get personal course completion progress, attendance stats, and specific quiz/assignment scores.
    """
    # 1. Progress percentage
    enrollment = db.scalar(select(Enrollment).where(
        Enrollment.student_id == student_id,
        Enrollment.course_id == course_id
    ))
    progress = enrollment.progress_percentage if enrollment else 0.0
    
    # 2. Attendance rate
    total_att = db.scalar(select(func.count(Attendance.id)).where(
        Attendance.student_id == student_id,
        Attendance.course_id == course_id
    )) or 0
    present_att = db.scalar(select(func.count(Attendance.id)).where(
        Attendance.student_id == student_id,
        Attendance.course_id == course_id,
        Attendance.status == AttendanceStatus.PRESENT
    )) or 0
    attendance_rate = (present_att / total_att * 100.0) if total_att > 0 else 100.0
    
    # 3. Quiz grades
    quiz_attempts_stmt = select(QuizAttempt).join(Quiz).where(
        QuizAttempt.student_id == student_id,
        Quiz.course_id == course_id
    )
    attempts = db.scalars(quiz_attempts_stmt).all()
    quiz_grades = [
        {
            "quiz_title": att.quiz.title,
            "score_obtained": att.score_obtained,
            "passed": att.passed
        }
        for att in attempts
    ]
    
    # 4. Assignment grades
    submissions_stmt = select(Submission).join(Assignment).where(
        Submission.student_id == student_id,
        Assignment.course_id == course_id
    )
    submissions = db.scalars(submissions_stmt).all()
    assignment_grades = [
        {
            "assignment_title": sub.assignment.title,
            "points_awarded": sub.points_awarded,
            "max_points": sub.assignment.max_points
        }
        for sub in submissions
    ]
    
    return StudentCourseAnalyticsResponse(
        progress=progress,
        attendance_rate=attendance_rate,
        quiz_grades=quiz_grades,
        assignment_grades=assignment_grades
    )
