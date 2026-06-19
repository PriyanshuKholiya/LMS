import uuid
from typing import List
from fastapi import APIRouter, Depends, Security, HTTPException, status
from sqlalchemy.orm import Session
from app.core import deps
from app.schemas.user import UserResponse, UserCreate, UserUpdate
from app.models.user import User
from app.crud import user as crud_user

router = APIRouter()


@router.get("/", response_model=List[UserResponse])
def read_users(
    db: Session = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: User = Security(deps.RoleChecker(["ADMIN"]))
):
    """
    Retrieve all users. Restricted to Admins.
    """
    users = crud_user.get_users(db, skip=skip, limit=limit)
    return users


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
    existing_user = crud_user.get_user_by_email(db, email=user_in.email)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email already exists."
        )
    return crud_user.create_user(db, user_in=user_in)


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
    if user_in.email and user_in.email != current_user.email:
        existing_user = crud_user.get_user_by_email(db, email=user_in.email)
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="A user with this email already exists."
            )
    return crud_user.update_user(db, db_user=current_user, user_in=user_in)


@router.get("/{user_id}", response_model=UserResponse)
def read_user_by_id(
    user_id: uuid.UUID,
    db: Session = Depends(deps.get_db),
    current_user: User = Security(deps.RoleChecker(["ADMIN"]))
):
    """
    Retrieve details for a specific user. Restricted to Admins.
    """
    db_user = crud_user.get_user(db, user_id=user_id)
    if not db_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    return db_user


@router.put("/{user_id}", response_model=UserResponse)
def update_user_by_id(
    user_id: uuid.UUID,
    *,
    db: Session = Depends(deps.get_db),
    user_in: UserUpdate,
    current_user: User = Security(deps.RoleChecker(["ADMIN"]))
):
    """
    Update details of a user. Restricted to Admins.
    """
    db_user = crud_user.get_user(db, user_id=user_id)
    if not db_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    if user_in.email and user_in.email != db_user.email:
        existing_user = crud_user.get_user_by_email(db, email=user_in.email)
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="A user with this email already exists."
            )
    return crud_user.update_user(db, db_user=db_user, user_in=user_in)


@router.delete("/{user_id}", response_model=UserResponse)
def delete_user_by_id(
    user_id: uuid.UUID,
    db: Session = Depends(deps.get_db),
    current_user: User = Security(deps.RoleChecker(["ADMIN"]))
):
    """
    Delete a user. Restricted to Admins.
    """
    db_user = crud_user.get_user(db, user_id=user_id)
    if not db_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    # Prevent admin from deleting themselves
    if db_user.id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Admins cannot delete their own account."
        )
    return crud_user.delete_user(db, db_user=db_user)
