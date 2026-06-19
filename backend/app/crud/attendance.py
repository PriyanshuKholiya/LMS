import uuid
from datetime import date
from typing import List, Optional
from sqlalchemy import select
from sqlalchemy.orm import Session
from app.models.attendance import Attendance
from app.schemas.attendance import AttendanceCreate, AttendanceUpdate


def get_attendance(db: Session, attendance_id: uuid.UUID) -> Optional[Attendance]:
    return db.get(Attendance, attendance_id)


def get_attendance_by_course_and_date(db: Session, course_id: uuid.UUID, record_date: date) -> List[Attendance]:
    statement = select(Attendance).where(
        Attendance.course_id == course_id,
        Attendance.record_date == record_date
    )
    return list(db.scalars(statement).all())


def get_attendance_by_student_and_course(db: Session, student_id: uuid.UUID, course_id: uuid.UUID) -> List[Attendance]:
    statement = select(Attendance).where(
        Attendance.student_id == student_id,
        Attendance.course_id == course_id
    ).order_by(Attendance.record_date)
    return list(db.scalars(statement).all())


def create_attendance_record(db: Session, attendance_in: AttendanceCreate) -> Attendance:
    statement = select(Attendance).where(
        Attendance.student_id == attendance_in.student_id,
        Attendance.course_id == attendance_in.course_id,
        Attendance.record_date == attendance_in.record_date
    )
    db_attendance = db.scalars(statement).first()
    
    if db_attendance:
        db_attendance.status = attendance_in.status
    else:
        db_attendance = Attendance(
            student_id=attendance_in.student_id,
            course_id=attendance_in.course_id,
            record_date=attendance_in.record_date,
            status=attendance_in.status
        )
        db.add(db_attendance)
        
    db.commit()
    db.refresh(db_attendance)
    return db_attendance


def create_bulk_attendance_records(db: Session, records_in: List[AttendanceCreate]) -> List[Attendance]:
    db_records = []
    for rec in records_in:
        statement = select(Attendance).where(
            Attendance.student_id == rec.student_id,
            Attendance.course_id == rec.course_id,
            Attendance.record_date == rec.record_date
        )
        db_rec = db.scalars(statement).first()
        if db_rec:
            db_rec.status = rec.status
        else:
            db_rec = Attendance(
                student_id=rec.student_id,
                course_id=rec.course_id,
                record_date=rec.record_date,
                status=rec.status
            )
            db.add(db_rec)
        db_records.append(db_rec)
        
    db.commit()
    for db_rec in db_records:
        db.refresh(db_rec)
    return db_records
