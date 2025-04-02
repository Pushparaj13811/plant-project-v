from fastapi import APIRouter, Depends, HTTPException, status, Response
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Any, List, Optional, Dict
from datetime import datetime, timedelta

from app.core.database import get_db
from app.crud import user, role, user_activity
from app.schemas import (
    User, UserCreate, UserUpdate, UserInDB, 
    Role, RoleCreate, RoleUpdate, RoleInDB,
    UserActivity, UserActivityCreate, ActionTypeEnum,
    PasswordChange, DashboardResponse, DashboardStats,
    DashboardActivity, ChartData, ChartDataset
)

from app.api.dependencies.auth import get_current_active_user, get_current_superuser, PlantAdminPermission
from app.models.user import User as UserModel, UserActivity as UserActivityModel
from app.core.security import verify_password, get_password_hash
from app.models.plant import Plant

router = APIRouter()
# Create a separate router for roles to be used in the /management/roles endpoint
role_router = APIRouter()

# User endpoints
@router.get("/", response_model=List[User])
def read_users(
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_active_user),
    skip: int = 0,
    limit: int = 100,
):
    """
    Retrieve users.
    """
    if current_user.role.name == "SUPERADMIN":
        users = user.get_multi(db, skip=skip, limit=limit)
    else:
        # Plant admins can only see users from their plant
        users = user.get_multi_by_plant(
            db, plant_id=current_user.plant_id, skip=skip, limit=limit
        )
    return users

@router.post("/", response_model=User)
def create_user(
    *,
    db: Session = Depends(get_db),
    user_in: UserCreate,
    current_user: UserModel = Depends(get_current_active_user),
) -> Any:
    """
    Create new user.
    """
    # Check if user exists
    user = user.get_by_email(db, email=user_in.email)
    if user:
        raise HTTPException(
            status_code=400,
            detail="The user with this email already exists in the system.",
        )
    
    # Check permissions
    if current_user.role.name != "SUPERADMIN":
        if current_user.plant_id != user_in.plant_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not enough permissions to create user for this plant"
            )
    
    user = user.create(db, obj_in=user_in)
    return user

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
    user_id: int,
    current_user: UserModel = Depends(get_current_active_user),
) -> Any:
    """
    Get user by ID.
    """
    user = user.get(db, id=user_id)
    if not user:
        raise HTTPException(
            status_code=404,
            detail="The user with this id does not exist in the system",
        )
    
    # Check if current user has permission to view this user
    if current_user.role.name != "SUPERADMIN":
        if current_user.plant_id != user.plant_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not enough permissions to view this user"
            )
    
    return user

@router.put("/{user_id}", response_model=User)
def update_user(
    *,
    db: Session = Depends(get_db),
    user_id: int,
    user_in: UserUpdate,
    current_user: UserModel = Depends(get_current_active_user),
) -> Any:
    """
    Update a user.
    """
    user = user.get(db, id=user_id)
    if not user:
        raise HTTPException(
            status_code=404,
            detail="The user with this id does not exist in the system",
        )
    
    # Check if current user has permission to update this user
    if current_user.role.name != "SUPERADMIN":
        if current_user.plant_id != user.plant_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not enough permissions to update this user"
            )
    
    user = user.update(db, db_obj=user, obj_in=user_in)
    return user

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

@router.get("/dashboard_stats/", response_model=DashboardResponse)
def get_dashboard_stats(
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_active_user)
) -> Any:
    """Get dashboard statistics based on user role."""
    try:
        # Ensure user has permission to access dashboard
        if not current_user.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Inactive user cannot access dashboard"
            )

        # Calculate the date 30 days ago
        thirty_days_ago = datetime.utcnow() - timedelta(days=30)
        
        # Get base statistics
        total_users = db.query(UserModel).count()
        active_users = db.query(UserModel).filter(UserModel.last_login_at >= thirty_days_ago).count()
        total_plants = db.query(Plant).count()

        # Calculate user growth (users created in last 30 days)
        new_users = db.query(UserModel).filter(UserModel.created_at >= thirty_days_ago).count()
        user_growth = (new_users / total_users * 100) if total_users > 0 else 0

        # Get recent activities with better error handling
        recent_activities = []
        try:
            # Get user activities (creations, updates, and deletions)
            user_activities = db.query(UserActivityModel).join(
                UserActivityModel.user
            ).order_by(
                UserActivityModel.created_at.desc()
            ).limit(10).all()

            for activity in user_activities:
                try:
                    activity_type = 'user'
                    performed_by = f"{activity.user.first_name} {activity.user.last_name}" if activity.user else 'Unknown'

                    if activity.action_type == ActionTypeEnum.DATA_CREATION:
                        if "created role:" in activity.description:
                            title = 'New Role Created'
                            description = activity.description
                            icon_type = 'role'
                        else:
                            title = 'New User Created'
                            description = f"{activity.target_user.first_name} {activity.target_user.last_name} was created by {performed_by}" if activity.target_user else f"User was created by {performed_by}"
                            icon_type = 'user'
                    elif activity.action_type == ActionTypeEnum.DATA_DELETION:
                        title = 'User Deleted'
                        description = f"User was deleted by {performed_by}"
                        icon_type = 'user'
                    elif activity.action_type == ActionTypeEnum.DATA_UPDATE:
                        if "promoted" in activity.description.lower():
                            title = 'User Promoted'
                            icon_type = 'promotion'
                            description = f"{activity.target_user.first_name} {activity.target_user.last_name}: {activity.description} by {performed_by}" if activity.target_user else f"{activity.description} by {performed_by}"
                        elif "demoted" in activity.description.lower():
                            title = 'User Demoted'
                            icon_type = 'demotion'
                            description = f"{activity.target_user.first_name} {activity.target_user.last_name}: {activity.description} by {performed_by}" if activity.target_user else f"{activity.description} by {performed_by}"
                        elif "role changed" in activity.description.lower():
                            title = 'Role Changed'
                            icon_type = 'update'
                            description = f"{activity.target_user.first_name} {activity.target_user.last_name}: {activity.description} by {performed_by}" if activity.target_user else f"{activity.description} by {performed_by}"
                        elif "plant" in activity.description.lower():
                            title = 'Plant Assignment Changed'
                            icon_type = 'plant'
                            description = f"{activity.target_user.first_name} {activity.target_user.last_name}: {activity.description} by {performed_by}" if activity.target_user else f"{activity.description} by {performed_by}"
                        else:
                            title = 'User Updated'
                            icon_type = 'update'
                            description = f"{activity.target_user.first_name} {activity.target_user.last_name}: {activity.description} by {performed_by}" if activity.target_user else f"{activity.description} by {performed_by}"
                    else:
                        title = 'User Activity'
                        description = activity.description
                        icon_type = 'user'

                    recent_activities.append({
                        'id': f"activity_{activity.id}",
                        'type': icon_type,
                        'title': title,
                        'description': description,
                        'timestamp': activity.created_at.strftime('%Y-%m-%d %H:%M:%S')
                    })
                except Exception as activity_error:
                    print(f"Error processing activity {activity.id}: {str(activity_error)}")
                    continue

        except Exception as activities_error:
            print(f"Error fetching activities: {str(activities_error)}")
            recent_activities = []

        # Get monthly user activity data for chart
        monthly_data = []
        for i in range(6):
            month_start = datetime.utcnow() - timedelta(days=30 * (5-i))
            month_end = datetime.utcnow() - timedelta(days=30 * (4-i)) if i < 5 else datetime.utcnow()
            
            active_count = db.query(UserModel).filter(
                UserModel.last_login_at >= month_start,
                UserModel.last_login_at < month_end
            ).count()
            
            monthly_data.append(active_count)

        response_data = {
            'stats': {
                'totalUsers': total_users,
                'activeUsers': active_users,
                'totalPlants': total_plants,
                'userGrowth': round(user_growth, 1)
            },
            'activities': recent_activities,
            'chartData': {
                'labels': [
                    (datetime.utcnow() - timedelta(days=30*i)).strftime('%b')
                    for i in range(5, -1, -1)
                ],
                'datasets': [{
                    'label': 'User Activity',
                    'data': monthly_data,
                    'borderColor': 'rgb(59, 130, 246)',
                    'backgroundColor': 'rgba(59, 130, 246, 0.5)'
                }]
            }
        }

        return response_data
            
    except Exception as e:
        print(f"Error in dashboard_stats: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        ) 