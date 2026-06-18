import uuid
from typing import List
from fastapi import APIRouter, Depends, Security
from sqlalchemy.orm import Session
from app.core import deps
from app.schemas.user import UserResponse, UserCreate, UserUpdate
from app.models.user import User

router = APIRouter()


@router.post("/", response_model=UserResponse)
def create_user(
    *,
    db: Session = Depends(deps.get_db),
    user_in: UserCreate,
    current_user: User = Security(deps.RoleChecker(["ADMIN"]))
):
    """
    Create a new user. Restricted to Admins.
    """
    pass


@router.get("/profile", response_model=UserResponse)
def read_user_profile(
    current_user: User = Depends(deps.get_current_user)
):
    """
    Retrieve current authenticated user's profile.
    """
    return current_user


@router.put("/profile", response_model=UserResponse)
def update_user_profile(
    *,
    db: Session = Depends(deps.get_db),
    user_in: UserUpdate,
    current_user: User = Depends(deps.get_current_user)
):
    """
    Update details of current authenticated user's profile.
    """
    pass
