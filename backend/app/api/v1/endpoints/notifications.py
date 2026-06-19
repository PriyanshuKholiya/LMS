import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect, status
from sqlalchemy.orm import Session
from app.core import deps
from app.core.notification_manager import notification_manager
from app.schemas.notification import NotificationResponse
from app.models.user import User
from app.crud import notification as crud_notification

router = APIRouter()


@router.get("/", response_model=List[NotificationResponse])
def read_notifications(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
    limit: int = 30,
    unread_only: bool = False
):
    """
    Retrieve notification logs for the current authenticated user.
    """
    return crud_notification.get_user_notifications(
        db, 
        user_id=current_user.id, 
        limit=limit, 
        unread_only=unread_only
    )


@router.put("/{id}/read", response_model=NotificationResponse)
def mark_notification_read(
    id: uuid.UUID,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
):
    """
    Mark a specific notification as read.
    """
    notification = crud_notification.get_notification(db, notification_id=id)
    if not notification:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found"
        )
    if notification.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to modify this notification."
        )
    return crud_notification.mark_as_read(db, notification_id=id)


@router.put("/read-all", response_model=List[NotificationResponse])
def mark_all_notifications_read(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
):
    """
    Mark all unread notifications as read for the current user.
    """
    return crud_notification.mark_all_as_read(db, user_id=current_user.id)


@router.websocket("/ws/{user_id}")
async def websocket_endpoint(
    websocket: WebSocket,
    user_id: uuid.UUID,
    db: Session = Depends(deps.get_db)
):
    """
    WebSocket route for real-time live notification pushes.
    """
    # Verify user exists in database before accepting connection
    user = db.get(User, user_id)
    if not user:
        # User not found in DB, close connection
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    await notification_manager.connect(websocket, user_id)
    try:
        while True:
            # Maintain connection, wait for client messages (heartbeats)
            await websocket.receive_text()
    except WebSocketDisconnect:
        notification_manager.disconnect(websocket, user_id)
    except Exception:
        notification_manager.disconnect(websocket, user_id)
