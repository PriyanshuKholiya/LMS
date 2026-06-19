import uuid
from typing import List, Optional
from sqlalchemy import select
from sqlalchemy.orm import Session
from app.models.user import User, UserRole
from app.schemas.user import UserCreate, UserUpdate
from app.core.security import get_password_hash


def get_user(db: Session, user_id: uuid.UUID) -> Optional[User]:
    return db.get(User, user_id)


def get_user_by_email(db: Session, email: str) -> Optional[User]:
    statement = select(User).where(User.email == email)
    return db.scalars(statement).first()


def get_users(db: Session, skip: int = 0, limit: int = 100) -> List[User]:
    statement = select(User).offset(skip).limit(limit)
    return list(db.scalars(statement).all())


def create_user(db: Session, user_in: UserCreate) -> User:
    db_user = User(
        email=user_in.email,
        name=user_in.name,
        role=user_in.role,
        password_hash=get_password_hash(user_in.password),
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user


def update_user(db: Session, db_user: User, user_in: UserUpdate) -> User:
    update_data = user_in.model_dump(exclude_unset=True)
    if "password" in update_data and update_data["password"]:
        db_user.password_hash = get_password_hash(update_data["password"])
        del update_data["password"]
        
    for field, value in update_data.items():
        setattr(db_user, field, value)
        
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user


def delete_user(db: Session, db_user: User) -> User:
    db.delete(db_user)
    db.commit()
    return db_user
