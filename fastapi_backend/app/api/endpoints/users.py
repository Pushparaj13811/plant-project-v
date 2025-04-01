from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Any, List, Optional

from app.core.database import get_db
from app.crud import user, role, user_activity
from app.schemas import (
    User, UserCreate, UserUpdate, UserInDB, 
    Role, RoleCreate, RoleUpdate, RoleInDB,
    UserActivity, UserActivityCreate, ActionTypeEnum,
    PasswordChange
)
from app.api.dependencies.auth import get_current_active_user, get_current_superuser
from app.models.user import User as UserModel
from app.core.security import verify_password, get_password_hash

router = APIRouter()
# Create a separate router for roles to be used in the /management/roles endpoint
role_router = APIRouter()

# User endpoints
@router.get("/", response_model=List[User])
def read_users(
    *,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_superuser),
    skip: int = 0,
    limit: int = 100,
) -> Any:
    """
    Retrieve users. Only superusers can access this endpoint.
    """
    users = user.get_multi(db, skip=skip, limit=limit)
    return users

@router.post("/", response_model=User)
def create_user(
    *,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_superuser),
    user_in: UserCreate,
) -> Any:
    """
    Create new user. Only superusers can create users.
    """
    # Check if user with this email already exists
    db_user = user.get_by_email(db, email=user_in.email)
    if db_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )
    
    # Check if role exists
    db_role = role.get(db, id=user_in.role_id)
    if not db_role:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Role with id {user_in.role_id} does not exist",
        )
    
    # Create user
    new_user = user.create(db, obj_in=user_in)
    
    # Log activity
    user_activity.create(
        db,
        obj_in=UserActivityCreate(
            user_id=current_user.id,
            target_user_id=new_user.id,
            action_type=ActionTypeEnum.DATA_CREATION,
            description=f"Created user {new_user.email}",
        )
    )
    
    return new_user

@router.get("/me", response_model=User)
def read_user_me(
    *,
    current_user: UserModel = Depends(get_current_active_user),
) -> Any:
    """
    Get current user.
    """
    return current_user

@router.put("/me", response_model=User)
def update_user_me(
    *,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_active_user),
    user_in: UserUpdate,
) -> Any:
    """
    Update current user.
    """
    # Don't allow user to change their own role, superuser status, or active status
    user_data = user_in.dict(exclude_unset=True)
    user_data.pop("role_id", None)
    user_data.pop("is_superuser", None)
    user_data.pop("is_staff", None)
    user_data.pop("is_active", None)
    
    # If user is updating their email, check if it's already in use
    if user_data.get("email") and user_data["email"] != current_user.email:
        db_user = user.get_by_email(db, email=user_data["email"])
        if db_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered",
            )
    
    updated_user = user.update(db, db_obj=current_user, obj_in=user_data)
    
    # Log activity
    user_activity.create(
        db,
        obj_in=UserActivityCreate(
            user_id=current_user.id,
            target_user_id=current_user.id,
            action_type=ActionTypeEnum.PROFILE_UPDATE,
            description="Updated own profile",
        )
    )
    
    return updated_user

@router.post("/me/change-password", response_model=User)
def change_password(
    *,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_active_user),
    password_in: PasswordChange,
) -> Any:
    """
    Change current user password.
    """
    # Verify old password
    if not verify_password(password_in.old_password, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect password",
        )
    
    # Update password and flag that user has changed their password
    updated_user = user.update(
        db, 
        db_obj=current_user, 
        obj_in={
            "password": password_in.new_password,
            "has_changed_password": True
        }
    )
    
    # Log activity
    user_activity.create(
        db,
        obj_in=UserActivityCreate(
            user_id=current_user.id,
            target_user_id=current_user.id,
            action_type=ActionTypeEnum.PASSWORD_CHANGE,
            description="Changed own password",
        )
    )
    
    return updated_user

@router.get("/{user_id}", response_model=User)
def read_user(
    *,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_active_user),
    user_id: int,
) -> Any:
    """
    Get user by ID.
    """
    # Regular users can only see themselves
    if not current_user.is_superuser and current_user.id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions",
        )
    
    db_user = user.get(db, id=user_id)
    if not db_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    
    return db_user

@router.put("/{user_id}", response_model=User)
def update_user(
    *,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_superuser),
    user_id: int,
    user_in: UserUpdate,
) -> Any:
    """
    Update user. Only superusers can update other users.
    """
    db_user = user.get(db, id=user_id)
    if not db_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    
    # If user is updating email, check if it's already in use
    if user_in.email and user_in.email != db_user.email:
        existing_user = user.get_by_email(db, email=user_in.email)
        if existing_user and existing_user.id != user_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered",
            )
    
    # If user is updating role, check if it exists
    if user_in.role_id:
        db_role = role.get(db, id=user_in.role_id)
        if not db_role:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Role with id {user_in.role_id} does not exist",
            )
    
    updated_user = user.update(db, db_obj=db_user, obj_in=user_in)
    
    # Log activity
    user_activity.create(
        db,
        obj_in=UserActivityCreate(
            user_id=current_user.id,
            target_user_id=user_id,
            action_type=ActionTypeEnum.DATA_UPDATE,
            description=f"Updated user {updated_user.email}",
        )
    )
    
    return updated_user

@router.delete("/{user_id}", response_model=User)
def delete_user(
    *,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_superuser),
    user_id: int,
) -> Any:
    """
    Delete user. Only superusers can delete users.
    """
    # Don't allow superuser to delete themselves
    if current_user.id == user_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot delete your own account",
        )
    
    db_user = user.get(db, id=user_id)
    if not db_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    
    # Instead of actually deleting, just mark as inactive
    updated_user = user.update(db, db_obj=db_user, obj_in={"is_active": False})
    
    # Log activity
    user_activity.create(
        db,
        obj_in=UserActivityCreate(
            user_id=current_user.id,
            target_user_id=user_id,
            action_type=ActionTypeEnum.DATA_DELETION,
            description=f"Deactivated user {updated_user.email}",
        )
    )
    
    return updated_user

# Role endpoints
@router.get("/roles", response_model=List[Role])
def read_roles(
    *,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_active_user),
    skip: int = 0,
    limit: int = 100,
) -> Any:
    """
    Retrieve roles.
    """
    roles = role.get_multi(db, skip=skip, limit=limit)
    return roles

@router.post("/roles", response_model=Role)
def create_role(
    *,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_superuser),
    role_in: RoleCreate,
) -> Any:
    """
    Create new role. Only superusers can create roles.
    """
    db_role = role.get_by_name(db, name=role_in.name)
    if db_role:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Role with this name already exists",
        )
    return role.create(db, obj_in=role_in)

@router.get("/roles/{role_id}", response_model=Role)
def read_role(
    *,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_active_user),
    role_id: int,
) -> Any:
    """
    Get role by ID.
    """
    db_role = role.get(db, id=role_id)
    if not db_role:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Role not found",
        )
    return db_role

@router.put("/roles/{role_id}", response_model=Role)
def update_role(
    *,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_superuser),
    role_id: int,
    role_in: RoleUpdate,
) -> Any:
    """
    Update role. Only superusers can update roles.
    """
    db_role = role.get(db, id=role_id)
    if not db_role:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Role not found",
        )
    
    # Check if name is already used by another role
    if role_in.name and role_in.name != db_role.name:
        existing_role = role.get_by_name(db, name=role_in.name)
        if existing_role and existing_role.id != role_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Role with this name already exists",
            )
    
    return role.update(db, db_obj=db_role, obj_in=role_in)

# Duplicate role endpoints for /management/roles path
@role_router.get("/", response_model=List[Role])
def management_read_roles(
    *,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_active_user),
    skip: int = 0,
    limit: int = 100,
) -> Any:
    """
    Retrieve roles via management endpoint.
    """
    roles = role.get_multi(db, skip=skip, limit=limit)
    return roles

@role_router.post("/", response_model=Role)
def management_create_role(
    *,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_superuser),
    role_in: RoleCreate,
) -> Any:
    """
    Create new role via management endpoint. Only superusers can create roles.
    """
    db_role = role.get_by_name(db, name=role_in.name)
    if db_role:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Role with this name already exists",
        )
    return role.create(db, obj_in=role_in)

@role_router.get("/{role_id}", response_model=Role)
def management_read_role(
    *,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_active_user),
    role_id: int,
) -> Any:
    """
    Get role by ID via management endpoint.
    """
    db_role = role.get(db, id=role_id)
    if not db_role:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Role not found",
        )
    return db_role

@role_router.put("/{role_id}", response_model=Role)
def management_update_role(
    *,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_superuser),
    role_id: int,
    role_in: RoleUpdate,
) -> Any:
    """
    Update role via management endpoint. Only superusers can update roles.
    """
    db_role = role.get(db, id=role_id)
    if not db_role:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Role not found",
        )
    
    # Check if name is already used by another role
    if role_in.name and role_in.name != db_role.name:
        existing_role = role.get_by_name(db, name=role_in.name)
        if existing_role and existing_role.id != role_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Role with this name already exists",
            )
    
    return role.update(db, db_obj=db_role, obj_in=role_in)

# User activity endpoints
@router.get("/activity", response_model=List[UserActivity])
def read_user_activities(
    *,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_superuser),
    skip: int = 0,
    limit: int = 100,
) -> Any:
    """
    Retrieve user activities. Only superusers can access this endpoint.
    """
    activities = user_activity.get_multi(db, skip=skip, limit=limit)
    return activities

@router.get("/activity/me", response_model=List[UserActivity])
def read_user_activities_me(
    *,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_active_user),
    skip: int = 0,
    limit: int = 100,
) -> Any:
    """
    Retrieve current user's activities.
    """
    activities = user_activity.get_multi_by_user(
        db, user_id=current_user.id, skip=skip, limit=limit
    )
    return activities 