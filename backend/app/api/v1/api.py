from fastapi import APIRouter
from app.api.v1.endpoints import (
    auth,
    users,
    courses,
    assignments,
    quizzes,
    attendance,
    ai_tutor,
    analytics,
    notifications
)

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["authentication"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(courses.router, prefix="/courses", tags=["courses"])
api_router.include_router(assignments.router, tags=["assignments"])
api_router.include_router(quizzes.router, tags=["quizzes"])
api_router.include_router(attendance.router, tags=["attendance"])
api_router.include_router(ai_tutor.router, prefix="/ai-tutor", tags=["ai-tutor"])
api_router.include_router(analytics.router, prefix="/analytics", tags=["analytics"])
api_router.include_router(notifications.router, prefix="/notifications", tags=["notifications"])

