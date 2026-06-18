import uuid
from typing import List
from fastapi import APIRouter, Depends, Security
from sqlalchemy.orm import Session
from app.core import deps
from app.schemas.attendance import AttendanceResponse, AttendanceCreate
from app.models.user import User

router = APIRouter()


@router.get("/courses/{course_id}/attendance", response_model=List[AttendanceResponse])
def read_attendance_records(
    course_id: uuid.UUID,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
):
    """
    Get attendance sheet records. Students query their personal log, Faculty & Admin query all.
    """
    pass


@router.post("/courses/{course_id}/attendance", response_model=List[AttendanceResponse])
def record_attendance(
    course_id: uuid.UUID,
    *,
    db: Session = Depends(deps.get_db),
    records_in: List[AttendanceCreate],
    current_user: User = Security(deps.RoleChecker(["ADMIN", "FACULTY"]))
):
    """
    Record or update student attendance records. Restricted to Admin & Faculty.
    """
    pass
