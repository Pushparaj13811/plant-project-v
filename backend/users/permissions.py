from rest_framework import permissions
from .models import User

class IsSuperAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.role == User.Role.SUPERADMIN

class IsAdminUser(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.role in [User.Role.SUPERADMIN, User.Role.ADMIN] 