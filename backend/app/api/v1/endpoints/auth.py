from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from app.core import deps, security
from app.schemas.token import Token
from app.crud import user as crud_user

router = APIRouter()


@router.post("/login", response_model=Token)
def login(
    db: Session = Depends(deps.get_db),
    form_data: OAuth2PasswordRequestForm = Depends()
):
    """
    OAuth2 compatible token login, get an access token for future requests.
    """
    user = crud_user.get_user_by_email(db, email=form_data.username)
    if not user or not security.verify_password(form_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect email or password",
        )
    access_token = security.create_access_token(subject=str(user.id))
    return {"access_token": access_token, "token_type": "bearer"}
