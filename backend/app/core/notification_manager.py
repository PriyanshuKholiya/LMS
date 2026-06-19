import uuid
from typing import Dict, List
from fastapi import WebSocket


class ConnectionManager:
    def __init__(self):
        # Maps user_id to a list of active WebSocket connections (e.g. multiple tabs)
        self.active_connections: Dict[uuid.UUID, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, user_id: uuid.UUID):
        await websocket.accept()
        if user_id not in self.active_connections:
            self.active_connections[user_id] = []
        self.active_connections[user_id].append(websocket)

    def disconnect(self, websocket: WebSocket, user_id: uuid.UUID):
        if user_id in self.active_connections:
            if websocket in self.active_connections[user_id]:
                self.active_connections[user_id].remove(websocket)
            if not self.active_connections[user_id]:
                del self.active_connections[user_id]

    async def send_personal_notification(self, user_id: uuid.UUID, notification_data: dict):
        """
        Sends a JSON notification to all active connections/tabs for a specific user.
        """
        if user_id in self.active_connections:
            dead_connections = []
            for websocket in self.active_connections[user_id]:
                try:
                    await websocket.send_json(notification_data)
                except Exception:
                    dead_connections.append(websocket)
            
            # Clean up closed sockets
            for ws in dead_connections:
                self.disconnect(ws, user_id)

    async def broadcast_notification(self, notification_data: dict):
        """
        Broadcasts a notification to every connected client on the platform.
        """
        for user_id, websockets in list(self.active_connections.items()):
            dead_connections = []
            for websocket in websockets:
                try:
                    await websocket.send_json(notification_data)
                except Exception:
                    dead_connections.append(websocket)
            
            for ws in dead_connections:
                self.disconnect(ws, user_id)


notification_manager = ConnectionManager()


async def notify_course_students(db: any, course_id: uuid.UUID, title: str, body: str):
    """
    Helper to create database notifications and push real-time WebSocket alerts
    to all students enrolled in a specific course.
    """
    from sqlalchemy import select
    from app.models.course import Enrollment
    from app.crud import notification as crud_notification

    statement = select(Enrollment).where(Enrollment.course_id == course_id)
    enrollments = list(db.scalars(statement).all())
    
    for enrollment in enrollments:
        # 1. Persist to database
        db_notif = crud_notification.create_notification(
            db, 
            user_id=enrollment.student_id, 
            title=title, 
            body=body
        )
        
        # 2. Push via WebSocket
        payload = {
            "id": str(db_notif.id),
            "user_id": str(db_notif.user_id),
            "title": db_notif.title,
            "body": db_notif.body,
            "is_read": db_notif.is_read,
            "created_at": db_notif.created_at.isoformat() + "Z" if db_notif.created_at else None
        }
        await notification_manager.send_personal_notification(enrollment.student_id, payload)


async def notify_course_students_background(course_id: uuid.UUID, title: str, body: str):
    """
    Background-safe helper that opens its own database session.
    """
    from app.core.database import SessionLocal
    db = SessionLocal()
    try:
        await notify_course_students(db, course_id, title, body)
    finally:
        db.close()


