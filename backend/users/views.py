from django.shortcuts import render
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from django.db.models import Count
from datetime import timedelta
from .models import User, Plant, UserActivity, Role, RoleCategory
from .serializers import UserSerializer, PlantSerializer, ChangePasswordSerializer, RoleSerializer
from .utils import is_valid_reset_token
from .permissions import (
    IsSuperAdmin, 
    HasChangedPasswordOrIsPasswordChange,
    PasswordChangeRequiredMixin
)

# Create your views here.

class UserViewSet(PasswordChangeRequiredMixin, viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated, IsSuperAdmin]

    def get_permissions(self):
        """
        Override to ensure password change endpoint is accessible without admin permissions
        """
        if self.action in ['change_password', 'dashboard_stats']:
            return [IsAuthenticated(), HasChangedPasswordOrIsPasswordChange()]
        return super().get_permissions()

    @action(detail=True, methods=['post'], url_path='change-password')
    def change_password(self, request, pk=None):
        user = self.get_object()
        serializer = ChangePasswordSerializer(data=request.data)
        
        if serializer.is_valid():
            # Only check old password if not force_password_change
            if not user.force_password_change:
                if not user.check_password(serializer.validated_data.get('old_password', '')):
                    return Response(
                        {'error': 'Current password is incorrect'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
            
            # Set new password
            user.set_password(serializer.validated_data['new_password'])
            user.has_changed_password = True
            user.force_password_change = False
            user.save()
            
            # Return updated user data
            user_data = UserSerializer(user).data
            return Response({
                'message': 'Password changed successfully',
                'user': user_data
            })
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['get'])
    def check_password_change_required(self, request, pk=None):
        user = self.get_object()
        return Response({
            'force_password_change': user.force_password_change,
            'has_changed_password': user.has_changed_password
        })

    def perform_update(self, serializer):
        # Get the old instance before update
        old_instance = self.get_object()
        old_role = old_instance.role
        old_plant = old_instance.plant

        # Save the updated instance
        user = serializer.save()

        # Track role changes
        if old_role != user.role:
            old_role_level = old_role.level
            new_role_level = user.role.level

            if new_role_level > old_role_level:
                action_description = f"Promoted from {old_role.name} to {user.role.name}"
            elif new_role_level < old_role_level:
                action_description = f"Demoted from {old_role.name} to {user.role.name}"
            else:
                action_description = f"Role changed from {old_role.name} to {user.role.name}"

            UserActivity.objects.create(
                performed_by=self.request.user,
                target_user=user,
                action_type=UserActivity.ActionType.UPDATE,
                description=action_description
            )

        # Track plant assignment changes
        if old_plant != user.plant:
            plant_description = (
                f"Plant assignment changed from {old_plant.name if old_plant else 'None'} "
                f"to {user.plant.name if user.plant else 'None'}"
            )
            UserActivity.objects.create(
                performed_by=self.request.user,
                target_user=user,
                action_type=UserActivity.ActionType.UPDATE,
                description=plant_description
            )

    def perform_create(self, serializer):
        user = serializer.save()
        user.last_login_at = None
        user.save()

        # Track user creation
        UserActivity.objects.create(
            performed_by=self.request.user,
            target_user=user,
            action_type=UserActivity.ActionType.CREATE,
            description=f"Created user {user.email} with role {user.role}"
        )

    def perform_destroy(self, instance):
        # Track user deletion before deleting
        UserActivity.objects.create(
            performed_by=self.request.user,
            target_user=instance,
            action_type=UserActivity.ActionType.DELETE,
            description=f"Deleted user {instance.email} with role {instance.role}"
        )
        instance.delete()

    @action(detail=False, methods=['post'])
    def reset_password(self, request):
        """Handle password reset with token."""
        token = request.data.get('token')
        new_password = request.data.get('new_password')

        if not token or not new_password:
            return Response(
                {'error': 'Token and new password are required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        user = is_valid_reset_token(token)
        if not user:
            return Response(
                {'error': 'Invalid or expired token'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Update password and clear token
        user.set_password(new_password)
        user.has_changed_password = True
        user.password_reset_token = None
        user.password_reset_token_created = None
        user.save()

        return Response({'message': 'Password updated successfully'})

    @action(detail=False, methods=['post'])
    def check_token(self, request):
        """Check if a password reset token is valid."""
        token = request.data.get('token')
        if not token:
            return Response(
                {'error': 'Token is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        user = is_valid_reset_token(token)
        if not user:
            return Response(
                {'valid': False, 'error': 'Invalid or expired token'},
                status=status.HTTP_400_BAD_REQUEST
            )

        return Response({'valid': True, 'email': user.email})

    @action(detail=False, methods=['get'])
    def dashboard_stats(self, request):
        """Get dashboard statistics based on user role."""
        try:
            # Calculate the date 30 days ago
            thirty_days_ago = timezone.now() - timedelta(days=30)
            
            # Get base statistics
            total_users = User.objects.count()
            active_users = User.objects.filter(last_login_at__gte=thirty_days_ago).count()
            total_plants = Plant.objects.count()

            # Calculate user growth (users created in last 30 days)
            new_users = User.objects.filter(created_at__gte=thirty_days_ago).count()
            user_growth = (new_users / total_users * 100) if total_users > 0 else 0

            # Get recent activities with better error handling
            recent_activities = []
            try:
                # Get user activities (creations, updates, and deletions)
                user_activities = UserActivity.objects.select_related(
                    'performed_by', 
                    'target_user'
                ).order_by('-timestamp')[:10]

                print(f"Found {user_activities.count()} activities")  # Debug log
                
                for activity in user_activities:
                    try:
                        activity_type = 'user'
                        performed_by = activity.performed_by.full_name if activity.performed_by else 'Unknown'

                        if activity.action_type == UserActivity.ActionType.CREATE:
                            if "created role:" in activity.description:
                                title = 'New Role Created'
                                description = activity.description
                                icon_type = 'role'
                            else:
                                title = 'New User Created'
                                description = f"{activity.target_user.full_name if activity.target_user else 'Unknown'} was created by {performed_by}"
                                icon_type = 'user'
                        elif activity.action_type == UserActivity.ActionType.DELETE:
                            title = 'User Deleted'
                            description = f"User was deleted by {performed_by}"
                            icon_type = 'user'
                        elif activity.action_type == UserActivity.ActionType.UPDATE:
                            if "promoted" in activity.description.lower():
                                title = 'User Promoted'
                                icon_type = 'promotion'
                                description = f"{activity.target_user.full_name if activity.target_user else 'Unknown'}: {activity.description} by {performed_by}"
                            elif "demoted" in activity.description.lower():
                                title = 'User Demoted'
                                icon_type = 'demotion'
                                description = f"{activity.target_user.full_name if activity.target_user else 'Unknown'}: {activity.description} by {performed_by}"
                            elif "role changed" in activity.description.lower():
                                title = 'Role Changed'
                                icon_type = 'update'
                                description = f"{activity.target_user.full_name if activity.target_user else 'Unknown'}: {activity.description} by {performed_by}"
                            elif "plant" in activity.description.lower():
                                title = 'Plant Assignment Changed'
                                icon_type = 'plant'
                                description = f"{activity.target_user.full_name if activity.target_user else 'Unknown'}: {activity.description} by {performed_by}"
                            else:
                                title = 'User Updated'
                                icon_type = 'update'
                                description = f"{activity.target_user.full_name if activity.target_user else 'Unknown'}: {activity.description} by {performed_by}"
                        else:
                            title = 'User Activity'
                            description = activity.description
                            icon_type = 'user'

                        recent_activities.append({
                            'id': f"activity_{activity.id}",
                            'type': icon_type,
                            'title': title,
                            'description': description,
                            'timestamp': activity.timestamp.strftime('%Y-%m-%d %H:%M:%S')
                        })
                        print(f"Added activity: {title} - {description}")  # Debug log
                    except Exception as activity_error:
                        print(f"Error processing activity {activity.id}: {str(activity_error)}")
                        continue

            except Exception as activities_error:
                print(f"Error fetching activities: {str(activities_error)}")
                # If there's an error with activities, continue with empty list
                recent_activities = []

            # Get monthly user activity data for chart
            monthly_data = []
            for i in range(6):
                month_start = timezone.now() - timedelta(days=30 * (5-i))
                month_end = timezone.now() - timedelta(days=30 * (4-i)) if i < 5 else timezone.now()
                
                active_count = User.objects.filter(
                    last_login_at__gte=month_start,
                    last_login_at__lt=month_end
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
                        (timezone.now() - timedelta(days=30*i)).strftime('%b')
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

            return Response(response_data)
            
        except Exception as e:
            print(f"Error in dashboard_stats: {str(e)}")  # Debug log
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class PlantViewSet(PasswordChangeRequiredMixin, viewsets.ModelViewSet):
    queryset = Plant.objects.all()
    serializer_class = PlantSerializer
    permission_classes = [IsAuthenticated, IsSuperAdmin]

class RoleViewSet(PasswordChangeRequiredMixin, viewsets.ModelViewSet):
    queryset = Role.objects.all()
    serializer_class = RoleSerializer
    permission_classes = [IsAuthenticated, IsSuperAdmin]

    def get_queryset(self):
        queryset = Role.objects.all()
        category = self.request.query_params.get('category', None)
        parent_id = self.request.query_params.get('parent_id', None)
        
        if category:
            queryset = queryset.filter(category=category)
        if parent_id:
            if parent_id == 'null':
                queryset = queryset.filter(parent__isnull=True)
            else:
                queryset = queryset.filter(parent_id=parent_id)
                
        return queryset

    @action(detail=False, methods=['get'])
    def categories(self, request):
        """Get available role categories."""
        categories = [
            {'value': category[0], 'label': category[1]}
            for category in RoleCategory.choices
        ]
        return Response(categories)

    @action(detail=False, methods=['get'])
    def hierarchy(self, request):
        """Get the complete role hierarchy."""
        # Get root roles (no parent)
        root_roles = Role.objects.filter(parent__isnull=True)
        
        def build_hierarchy(role):
            return {
                'id': role.id,
                'name': role.name,
                'category': role.category,
                'level': role.level,
                'children': [
                    build_hierarchy(child)
                    for child in role.children.all().order_by('level', 'name')
                ]
            }
        
        hierarchy = [build_hierarchy(role) for role in root_roles.order_by('level', 'name')]
        return Response(hierarchy)

    @action(detail=True, methods=['get'])
    def available_parents(self, request, pk=None):
        """Get available parent roles for the current role."""
        current_role = self.get_object()
        
        # Get all roles except:
        # 1. The current role
        # 2. Any descendants of the current role
        # 3. Roles that would violate category hierarchy rules
        descendants = current_role.get_descendants()
        excluded_ids = [current_role.id] + [d.id for d in descendants]
        
        available_parents = Role.objects.exclude(id__in=excluded_ids)
        
        # Apply category-based filtering
        if current_role.category == RoleCategory.SUPERADMIN:
            available_parents = available_parents.none()  # No parents allowed
        elif current_role.category == RoleCategory.ADMIN:
            available_parents = available_parents.filter(category=RoleCategory.SUPERADMIN)
        elif current_role.category == RoleCategory.USER:
            available_parents = available_parents.filter(
                category__in=[RoleCategory.ADMIN, RoleCategory.SUPERADMIN]
            )
            
        serializer = self.get_serializer(available_parents, many=True)
        return Response(serializer.data)

    def perform_create(self, serializer):
        role = serializer.save()
        # Create activity with proper title and description
        description = f"{role.name} ({role.category})" + (f" under {role.parent.name}" if role.parent else "")
        UserActivity.objects.create(
            performed_by=self.request.user,
            action_type=UserActivity.ActionType.CREATE,
            description=f"{self.request.user.full_name} created role: {description}"
        )

    def perform_update(self, serializer):
        old_instance = self.get_object()
        old_parent = old_instance.parent
        role = serializer.save()
        
        changes = []
        if old_parent != role.parent:
            changes.append(
                f"parent from {old_parent.name if old_parent else 'none'} "
                f"to {role.parent.name if role.parent else 'none'}"
            )
            
        UserActivity.objects.create(
            performed_by=self.request.user,
            action_type=UserActivity.ActionType.UPDATE,
            description=(
                f"Updated role: {role.name} ({role.category})"
                + (f" - Changed {', '.join(changes)}" if changes else "")
            )
        )

    def perform_destroy(self, instance):
        if instance.users.exists():
            raise serializers.ValidationError(
                "Cannot delete role that has users assigned to it"
            )
        if instance.children.exists():
            raise serializers.ValidationError(
                "Cannot delete role that has child roles. Please reassign or delete child roles first."
            )
            
        description = f"Deleted role: {instance.name} ({instance.category})"
        if instance.parent:
            description += f" under {instance.parent.name}"
            
        UserActivity.objects.create(
            performed_by=self.request.user,
            action_type=UserActivity.ActionType.DELETE,
            description=description
        )
        instance.delete()
