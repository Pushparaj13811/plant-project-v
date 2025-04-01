from pydantic import BaseModel, EmailStr, Field, ConfigDict
from typing import List, Optional
from datetime import datetime
from enum import Enum


class RoleCategoryEnum(str, Enum):
    USER = "user"
    ADMIN = "admin"
    SUPER_ADMIN = "super_admin"


class ActionTypeEnum(str, Enum):
    LOGIN = "login"
    LOGOUT = "logout"
    PASSWORD_CHANGE = "password_change"
    PROFILE_UPDATE = "profile_update"
    DATA_CREATION = "data_creation"
    DATA_UPDATE = "data_update"
    DATA_DELETION = "data_deletion"
    SYSTEM_ACTION = "system_action"


# Base schemas
class RoleBase(BaseModel):
    name: str = Field(..., description="Name of the role")
    category: RoleCategoryEnum = RoleCategoryEnum.USER
    description: Optional[str] = Field(None, description="Description of the role")
    parent_id: Optional[int] = None
    level: int = 0


class UserBase(BaseModel):
    email: EmailStr = Field(..., description="Email of the user")
    first_name: str = Field(..., description="First name of the user")
    last_name: str = Field(..., description="Last name of the user")
    role_id: int = Field(..., description="ID of the role assigned to the user")
    plant_id: Optional[int] = Field(None, description="ID of the plant the user belongs to")
    is_active: bool = Field(True, description="Whether the user is active")
    is_superuser: bool = Field(False, description="Whether the user is a superuser")
    is_staff: bool = Field(False, description="Whether the user is staff")
    has_changed_password: bool = Field(False, description="Whether the user has changed their initial password")


class UserActivityBase(BaseModel):
    user_id: int = Field(..., description="ID of the user who performed the activity")
    target_user_id: Optional[int] = Field(None, description="ID of the user who was the target of the activity, if applicable")
    action_type: ActionTypeEnum = Field(..., description="Type of action performed")
    description: str = Field(..., description="Description of the activity")
    ip_address: Optional[str] = Field(None, description="IP address of the user")
    user_agent: Optional[str] = Field(None, description="User agent information")


# Create schemas
class RoleCreate(RoleBase):
    pass


class UserCreate(UserBase):
    password: str = Field(..., description="Password for the user")


class UserActivityCreate(UserActivityBase):
    pass


# Update schemas
class RoleUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    category: Optional[RoleCategoryEnum] = None
    parent_id: Optional[int] = None
    level: Optional[int] = None


class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    role_id: Optional[int] = None
    plant_id: Optional[int] = None
    is_active: Optional[bool] = None
    is_superuser: Optional[bool] = None
    is_staff: Optional[bool] = None
    has_changed_password: Optional[bool] = None
    password: Optional[str] = None


class UserActivityUpdate(BaseModel):
    description: Optional[str] = None


# DB schemas
class Role(RoleBase):
    id: int
    
    model_config = ConfigDict(from_attributes=True)


class RoleInDB(Role):
    created_at: datetime
    updated_at: datetime


class User(UserBase):
    id: int
    
    model_config = ConfigDict(from_attributes=True)


class UserInDB(User):
    hashed_password: str
    created_at: datetime
    updated_at: datetime
    last_login_at: Optional[datetime] = None


class UserActivity(UserActivityBase):
    id: int
    
    model_config = ConfigDict(from_attributes=True)


class UserActivityInDB(UserActivity):
    created_at: datetime
    updated_at: datetime


# Password schemas
class PasswordReset(BaseModel):
    email: EmailStr


class PasswordChange(BaseModel):
    old_password: str
    new_password: str