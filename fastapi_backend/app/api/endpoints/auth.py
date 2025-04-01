from pydantic import BaseModel

from fastapi import APIRouter, Depends, HTTPException, status, Response
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from typing import Any, Dict
from datetime import timedelta
from jose import jwt, JWTError
import secrets
from pydantic import EmailStr

from app.core.config import settings
from app.core.database import get_db
from app.core.security import create_access_token, create_refresh_token, get_password_hash
from app.crud import user as user_crud
from app.schemas import Token, UserCreate, UserInDB
from app.schemas.token import TokenPayload
from app.models.user import RoleCategoryEnum
from app.api.dependencies.auth import get_current_active_user
from app.core.email import send_password_reset_email

router = APIRouter()

@router.options("/login/", include_in_schema=False)
async def auth_login_options():
    """Handle OPTIONS request for CORS preflight"""
    return Response(status_code=200)

@router.post("/login/", response_model=Token)
def login_access_token(
    db: Session = Depends(get_db),
    form_data: OAuth2PasswordRequestForm = Depends()
) -> Any:
    """
    OAuth2 compatible token login, get an access token for future requests
    """
    # Authenticate user
    authenticated_user = user_crud.authenticate(
        db, email=form_data.username, password=form_data.password
    )
    if not authenticated_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Check if user is active
    if not user_crud.is_active(authenticated_user):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="Inactive user"
        )
    
    # Update last login timestamp
    user_crud.update_last_login(db, user=authenticated_user)
    
    # Create access token and refresh token
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    refresh_token_expires = timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    
    return {
        "access_token": create_access_token(
            authenticated_user.email, expires_delta=access_token_expires
        ),
        "refresh_token": create_refresh_token(
            authenticated_user.email, expires_delta=refresh_token_expires
        ),
        "token_type": "bearer",
    }

@router.options("/refresh/", include_in_schema=False)
async def auth_refresh_options():
    """Handle OPTIONS request for CORS preflight"""
    return Response(status_code=200)

@router.post("/refresh/", response_model=Token)
def refresh_token(
    db: Session = Depends(get_db), token: str = Depends(OAuth2PasswordRequestForm)
) -> Any:
    """
    Refresh access token
    """
    try:
        payload = jwt.decode(
            token.password, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
        )
        token_data = TokenPayload(**payload)
        if token_data.sub is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        # Check if token is a refresh token
        if not payload.get("refresh"):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token type",
                headers={"WWW-Authenticate": "Bearer"},
            )
            
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    user = user_crud.get_by_email(db, email=token_data.sub)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user",
        )
    
    # Create new access token
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    return {
        "access_token": create_access_token(
            user.email, expires_delta=access_token_expires
        ),
        "refresh_token": token.password,  # Return the same refresh token
        "token_type": "bearer",
    }

@router.options("/register/", include_in_schema=False)
async def auth_register_options():
    """Handle OPTIONS request for CORS preflight"""
    return Response(status_code=200)

@router.post("/register/", response_model=UserInDB)
def register(
    *,
    db: Session = Depends(get_db),
    user_in: UserCreate,
) -> Any:
    """
    Register a new user (public endpoint available only in development)
    """
    # Only allow registration in development mode
    if not settings.DEBUG:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Registration not allowed in production mode",
        )
    
    # Check if user already exists
    user = user_crud.get_by_email(db, email=user_in.email)
    if user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )
    
    # Create new user
    user = user_crud.create(db, obj_in=user_in)
    return user

class PasswordResetRequest(BaseModel):
    email: EmailStr

@router.options("/password-reset/", include_in_schema=False)
async def auth_password_reset_options():
    """Handle OPTIONS request for CORS preflight"""
    return Response(status_code=200)

@router.post("/password-reset/", response_model=Dict[str, str])
def reset_password(
    *,
    db: Session = Depends(get_db),
    request_data: PasswordResetRequest,
) -> Any:
    """
    Reset user password (sends an email with reset link)
    """
    user = user_crud.get_by_email(db, email=request_data.email)
    
    # Generate reset token regardless of whether user exists
    # This prevents user enumeration
    token = secrets.token_urlsafe(32)
    
    if user:
        # Store reset token and expiry in user model
        # This would be implemented in a real app with a proper token storage mechanism
        # Here we just generate and send the token, but don't store it
        
        # Send reset email
        send_password_reset_email(request_data.email, token)
    
    # Always return success to prevent user enumeration
    return {"message": "If the email exists, a password reset link has been sent"}

class PasswordResetConfirm(BaseModel):
    token: str
    new_password: str

@router.options("/password-reset-confirm/", include_in_schema=False)
async def auth_password_reset_confirm_options():
    """Handle OPTIONS request for CORS preflight"""
    return Response(status_code=200)

@router.post("/password-reset-confirm/", response_model=Dict[str, str])
def confirm_reset_password(
    *,
    db: Session = Depends(get_db),
    data: PasswordResetConfirm,
) -> Any:
    """
    Confirm password reset with token and set new password
    """
    # In a real app, you would validate the token and get the associated user
    # Here we just return a message
    return {"message": "This endpoint would reset the password in a real app"} 