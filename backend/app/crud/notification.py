import uuid
from typing import List, Optional
from sqlalchemy import select
from sqlalchemy.orm import Session
from app.models.notification import Notification


def get_notification(db: Session, notification_id: uuid.UUID) -> Optional[Notification]:
    return db.get(Notification, notification_id)


def get_user_notifications(
    db: Session, 
    user_id: uuid.UUID, 
    limit: int = 30, 
    unread_only: bool = False
) -> List[Notification]:
    statement = select(Notification).where(Notification.user_id == user_id)
    if unread_only:
        statement = statement.where(Notification.is_read == False)
    statement = statement.order_by(Notification.created_at.desc()).limit(limit)
    return list(db.scalars(statement).all())


def create_notification(db: Session, user_id: uuid.UUID, title: str, body: str) -> Notification:
    db_notification = Notification(
        user_id=user_id,
        title=title,
        body=body,
        is_read=False
    )
    db.add(db_notification)
    db.commit()
    db.refresh(db_notification)
    return db_notification


def mark_as_read(db: Session, notification_id: uuid.UUID) -> Optional[Notification]:
    db_notification = db.get(Notification, notification_id)
    if db_notification:
        db_notification.is_read = True
        db.commit()
        db.refresh(db_notification)
    return db_notification


def mark_all_as_read(db: Session, user_id: uuid.UUID) -> List[Notification]:
    statement = select(Notification).where(
        Notification.user_id == user_id,
        Notification.is_read == False
    )
    unread = list(db.scalars(statement).all())
    for item in unread:
        item.is_read = True
    db.commit()
    return unread
