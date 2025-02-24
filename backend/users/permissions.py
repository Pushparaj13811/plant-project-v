from rest_framework import permissions
from .models import User

class IsSuperAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.role == User.Role.SUPERADMIN

class IsAdminUser(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.role in [User.Role.SUPERADMIN, User.Role.ADMIN]

class HasChangedPasswordOrIsPasswordChange(permissions.BasePermission):
    """
    Permission class to ensure users can only access routes if they've changed their password,
    except for the password change endpoint itself.
    """
    def has_permission(self, request, view):
        # Always allow access to password change endpoint
        if getattr(view, 'action', None) == 'change_password':
            return True
            
        # Check if user has changed their password
        return not request.user.force_password_change

class PasswordChangeRequiredMixin:
    """
    Mixin to enforce password change requirement across all views.
    Add this to any ViewSet that should be protected.
    """
    def get_permissions(self):
        """
        Add HasChangedPasswordOrIsPasswordChange to all permission classes
        """
        permissions = super().get_permissions()
        if not any(isinstance(p, HasChangedPasswordOrIsPasswordChange) for p in permissions):
            permissions.append(HasChangedPasswordOrIsPasswordChange())
        return permissions 