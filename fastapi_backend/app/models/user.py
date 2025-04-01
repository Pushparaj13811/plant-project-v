from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text, Enum, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from datetime import datetime

from app.core.database import Base

# Enums
class RoleCategoryEnum(str, enum.Enum):
    USER = "user"
    ADMIN = "admin"
    SUPER_ADMIN = "super_admin"

class ActionTypeEnum(str, enum.Enum):
    LOGIN = "login"
    LOGOUT = "logout"
    PASSWORD_CHANGE = "password_change"
    PROFILE_UPDATE = "profile_update"
    DATA_CREATION = "data_creation"
    DATA_UPDATE = "data_update"
    DATA_DELETION = "data_deletion"
    SYSTEM_ACTION = "system_action"

class Role(Base):
    __tablename__ = "roles"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), unique=True, index=True, nullable=False)
    category = Column(Enum(RoleCategoryEnum), default=RoleCategoryEnum.USER)
    description = Column(Text, nullable=True)
    parent_id = Column(Integer, ForeignKey("roles.id"), nullable=True)
    level = Column(Integer, default=0)
    permissions = Column(JSON, default={})
    
    # Timestamps
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    
    # Relationships
    users = relationship("User", back_populates="role")
    parent = relationship("Role", remote_side=[id], backref="children")
    
    def __repr__(self):
        return f"<Role {self.name}>"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    hashed_password = Column(String(255), nullable=False)
    is_active = Column(Boolean, default=True)
    is_superuser = Column(Boolean, default=False)
    is_staff = Column(Boolean, default=False)
    has_changed_password = Column(Boolean, default=False)
    
    # Foreign keys
    role_id = Column(Integer, ForeignKey("roles.id"), nullable=False)
    plant_id = Column(Integer, ForeignKey("plants.id"), nullable=True)
    
    # Timestamps
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    last_login_at = Column(DateTime, nullable=True)
    
    # Relationships
    role = relationship("Role", back_populates="users")
    plant = relationship("Plant", back_populates="users")
    activities = relationship("UserActivity", back_populates="user", 
                             foreign_keys="UserActivity.user_id")
    
    @property
    def name(self):
        """Get full name"""
        return f"{self.first_name} {self.last_name}"
    
    def __repr__(self):
        return f"<User {self.email}>"

class UserActivity(Base):
    __tablename__ = "user_activities"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    target_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    action_type = Column(Enum(ActionTypeEnum), nullable=False)
    description = Column(Text, nullable=False)
    ip_address = Column(String(50), nullable=True)
    user_agent = Column(String(255), nullable=True)
    
    # Timestamps
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    
    # Relationships
    user = relationship("User", foreign_keys=[user_id], back_populates="activities")
    target_user = relationship("User", foreign_keys=[target_user_id])
    
    def __repr__(self):
        return f"<UserActivity {self.action_type} by {self.user_id}>" 