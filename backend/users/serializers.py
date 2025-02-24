from rest_framework import serializers
from .models import User, Plant, Role, RoleCategory
from .utils import send_welcome_email, generate_reset_token
import secrets
import string
from django.utils import timezone

def generate_random_password(length=12):
    """Generate a secure random password with at least one of each: uppercase, lowercase, digit, and special character"""
    lowercase = string.ascii_lowercase
    uppercase = string.ascii_uppercase
    digits = string.digits
    special = "!@#$%^&*"
    
    # Ensure at least one of each type
    password = [
        secrets.choice(lowercase),
        secrets.choice(uppercase),
        secrets.choice(digits),
        secrets.choice(special)
    ]
    
    # Fill the rest with random characters
    all_characters = lowercase + uppercase + digits + special
    password.extend(secrets.choice(all_characters) for _ in range(length - 4))
    
    # Shuffle the password
    password_list = list(password)
    secrets.SystemRandom().shuffle(password_list)
    return ''.join(password_list)

class PlantSerializer(serializers.ModelSerializer):
    class Meta:
        model = Plant
        fields = ('id', 'name', 'address')

class RoleSerializer(serializers.ModelSerializer):
    children = serializers.SerializerMethodField()
    parent_name = serializers.SerializerMethodField()
    ancestors = serializers.SerializerMethodField()

    class Meta:
        model = Role
        fields = [
            'id', 'name', 'category', 'description', 'permissions',
            'parent', 'level', 'parent_name', 'children', 'ancestors',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at', 'level']

    def get_children(self, obj):
        """Get immediate children of this role"""
        return [
            {
                'id': child.id,
                'name': child.name,
                'category': child.category,
                'level': child.level
            }
            for child in obj.children.all()
        ]

    def get_parent_name(self, obj):
        """Get parent role name if exists"""
        return obj.parent.name if obj.parent else None

    def get_ancestors(self, obj):
        """Get all ancestors (parent roles) up to root"""
        return [
            {
                'id': ancestor.id,
                'name': ancestor.name,
                'category': ancestor.category,
                'level': ancestor.level
            }
            for ancestor in obj.get_ancestors()
        ]

    def validate(self, data):
        """Validate role hierarchy"""
        parent = data.get('parent')
        category = data.get('category')

        if parent:
            # Check for circular reference
            if self.instance and parent.id == self.instance.id:
                raise serializers.ValidationError(
                    "A role cannot be its own parent"
                )

            # Check if parent's category is appropriate
            if category == RoleCategory.SUPERADMIN:
                raise serializers.ValidationError(
                    "Super Admin roles cannot have a parent role"
                )
            
            if parent.category == RoleCategory.USER:
                raise serializers.ValidationError(
                    "User roles cannot be parent roles"
                )

            if category == RoleCategory.ADMIN and parent.category != RoleCategory.SUPERADMIN:
                raise serializers.ValidationError(
                    "Admin roles must have Super Admin as parent"
                )

            if category == RoleCategory.USER and parent.category not in [RoleCategory.ADMIN, RoleCategory.SUPERADMIN]:
                raise serializers.ValidationError(
                    "User roles must have Admin or Super Admin as parent"
                )

            # Check for circular dependency
            if self.instance:
                descendants = self.instance.get_descendants()
                if parent in descendants:
                    raise serializers.ValidationError(
                        "Cannot create circular hierarchy"
                    )

        return data

    def validate_category(self, value):
        if value not in RoleCategory.values:
            raise serializers.ValidationError(
                f"Invalid category. Must be one of: {', '.join(RoleCategory.values)}"
            )
        return value

class UserSerializer(serializers.ModelSerializer):
    plant = PlantSerializer(read_only=True)
    plant_id = serializers.IntegerField(write_only=True, required=False)
    force_password_change = serializers.BooleanField(read_only=True)
    has_changed_password = serializers.BooleanField(read_only=True)
    role_details = RoleSerializer(source='role', read_only=True)
    role_id = serializers.PrimaryKeyRelatedField(
        source='role',
        queryset=Role.objects.all(),
        write_only=True
    )

    class Meta:
        model = User
        fields = (
            'id', 'email', 'first_name', 'last_name',
            'role_id', 'role_details',
            'plant', 'plant_id',
            'force_password_change', 'has_changed_password'
        )
        read_only_fields = ('id',)

    def create(self, validated_data):
        plant_id = validated_data.pop('plant_id', None)
        
        # Generate a random password
        temp_password = generate_random_password()
        
        if plant_id:
            plant = Plant.objects.get(id=plant_id)
            validated_data['plant'] = plant
        
        # Create user with temporary password
        user = User.objects.create_user(password=temp_password, **validated_data)
        
        # Set password reset token
        user.password_reset_token = generate_reset_token()
        user.password_reset_token_created = timezone.now()
        user.force_password_change = True
        user.has_changed_password = False
        user.save()
        
        # Send welcome email with credentials
        try:
            send_welcome_email(user, temp_password)
        except Exception as e:
            print(f"Failed to send welcome email: {e}")
        
        return user

    def update(self, instance, validated_data):
        # Handle plant_id separately
        plant_id = validated_data.pop('plant_id', None)
        if plant_id is not None:  # Only update plant if plant_id is provided
            try:
                plant = Plant.objects.get(id=plant_id)
                instance.plant = plant
            except Plant.DoesNotExist:
                instance.plant = None
        elif plant_id is None and 'plant_id' in self.initial_data:  # If plant_id is explicitly set to null
            instance.plant = None

        # Update other fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        
        instance.save()
        return instance

class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(required=False)
    new_password = serializers.CharField(required=True)

    def validate_new_password(self, value):
        # Add any password validation rules here
        if len(value) < 8:
            raise serializers.ValidationError("Password must be at least 8 characters long")
        return value 