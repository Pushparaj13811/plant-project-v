from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.db import models
from django.utils.translation import gettext_lazy as _

# Create your models here.

class UserActivity(models.Model):
    class ActionType(models.TextChoices):
        CREATE = 'CREATE', _('Created')
        DELETE = 'DELETE', _('Deleted')
        UPDATE = 'UPDATE', _('Updated')

    performed_by = models.ForeignKey(
        'User',
        on_delete=models.SET_NULL,
        null=True,
        related_name='activities_performed'
    )
    target_user = models.ForeignKey(
        'User',
        on_delete=models.SET_NULL,
        null=True,
        related_name='activities_received'
    )
    action_type = models.CharField(
        max_length=10,
        choices=ActionType.choices
    )
    timestamp = models.DateTimeField(auto_now_add=True)
    description = models.TextField()

    class Meta:
        ordering = ['-timestamp']

    def __str__(self):
        return f"{self.performed_by} {self.action_type} {self.target_user} at {self.timestamp}"

class UserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError('The Email field must be set')
        email = self.normalize_email(email)
        
        # If no role is provided, get or create the default USER role
        if 'role' not in extra_fields:
            Role = self.model.role.field.related_model
            role, _ = Role.objects.get_or_create(
                category=RoleCategory.USER,
                defaults={
                    'name': 'Default User Role',
                    'description': 'Default role for new users'
                }
            )
            extra_fields['role'] = role
        
        user = self.model(email=email, **extra_fields)
        if password:
            user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('has_changed_password', True)  # Superuser doesn't need to change password
        
        # Get or create the SUPERADMIN role
        Role = self.model.role.field.related_model
        role, _ = Role.objects.get_or_create(
            category=RoleCategory.SUPERADMIN,
            defaults={
                'name': 'Super Administrator',
                'description': 'Full system access with all permissions'
            }
        )
        extra_fields['role'] = role
        
        return self.create_user(email, password, **extra_fields)

class RoleCategory(models.TextChoices):
    SUPERADMIN = 'SUPERADMIN', _('Super Admin')
    ADMIN = 'ADMIN', _('Admin')
    USER = 'USER', _('User')

class Role(models.Model):
    name = models.CharField(max_length=255, unique=True)
    category = models.CharField(
        max_length=10,
        choices=RoleCategory.choices,
        default=RoleCategory.USER
    )
    description = models.TextField(blank=True)
    parent = models.ForeignKey(
        'self',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='children'
    )
    level = models.PositiveIntegerField(default=0)  # For hierarchical sorting
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    permissions = models.JSONField(default=dict)

    def __str__(self):
        return f"{self.name} ({self.category})"

    def save(self, *args, **kwargs):
        # Update level based on parent
        if self.parent:
            self.level = self.parent.level + 1
        else:
            self.level = 0
        super().save(*args, **kwargs)

    def get_ancestors(self):
        """Get all parent roles up to the root"""
        ancestors = []
        current = self.parent
        while current:
            ancestors.append(current)
            current = current.parent
        return ancestors

    def get_descendants(self):
        """Get all child roles recursively"""
        descendants = []
        for child in self.children.all():
            descendants.append(child)
            descendants.extend(child.get_descendants())
        return descendants

    class Meta:
        ordering = ['category', 'level', 'name']

class User(AbstractUser):
    username = None
    email = models.EmailField(_('email address'), unique=True)
    first_name = models.CharField(max_length=255)
    last_name = models.CharField(max_length=255)
    role = models.ForeignKey(
        'Role',
        on_delete=models.PROTECT,  # Prevent deletion of roles that are in use
        related_name='users'
    )
    plant = models.ForeignKey(
        'Plant',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='users'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    has_changed_password = models.BooleanField(default=False)
    last_login_at = models.DateTimeField(null=True, blank=True)
    force_password_change = models.BooleanField(default=True)
    password_reset_token = models.CharField(max_length=100, null=True, blank=True)
    password_reset_token_created = models.DateTimeField(null=True, blank=True)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['first_name', 'last_name']

    objects = UserManager()

    def __str__(self):
        return self.email

    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}"

    def save(self, *args, **kwargs):
        if not self.pk:  # If this is a new user
            self.force_password_change = True
            self.has_changed_password = False
        super().save(*args, **kwargs)

class Plant(models.Model):
    name = models.CharField(max_length=255)
    address = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name
