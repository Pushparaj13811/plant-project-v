from pydantic import BaseModel
from typing import Optional, Dict, Any
from datetime import datetime

class LoginResponse(BaseModel):
    access: str
    refresh: str
    user: Dict[str, Any]

    @classmethod
    def from_user(cls, user: Any, access_token: str, refresh_token: str) -> "LoginResponse":
        # Get role information safely
        role_info = {
            "id": user.role.id if user.role else None,
            "name": user.role.name if user.role else None,
            "category": user.role.category if user.role else None,
            "permissions": user.role.permissions if user.role else {},
            "level": user.role.level if user.role else 0
        } if user.role else None

        # Get plant information safely
        plant_info = {
            "id": user.plant.id,
            "name": user.plant.name,
            "location": user.plant.location,
            "description": user.plant.description
        } if user.plant else None

        return cls(
            access=access_token,
            refresh=refresh_token,
            user={
                "id": user.id,
                "email": user.email,
                "first_name": user.first_name,
                "last_name": user.last_name,
                "role_details": role_info,
                "plant": plant_info,
                "is_active": user.is_active,
                "is_superuser": user.is_superuser,
                "is_staff": getattr(user, "is_staff", False),
                "requires_password_change": not user.has_changed_password,
                "last_login": user.last_login_at.isoformat() if user.last_login_at else None,
                "created_at": user.created_at.isoformat() if user.created_at else None,
                "updated_at": user.updated_at.isoformat() if user.updated_at else None
            }
        ) 