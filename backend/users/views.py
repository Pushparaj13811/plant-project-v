from django.shortcuts import render
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from .models import User, Plant
from .serializers import UserSerializer, PlantSerializer, ChangePasswordSerializer
from .utils import is_valid_reset_token
from .permissions import IsSuperAdmin, IsAdminUser

# Create your views here.

class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated, IsSuperAdmin]

    @action(detail=True, methods=['post'], url_path='change-password')
    def change_password(self, request, pk=None):
        user = self.get_object()
        serializer = ChangePasswordSerializer(data=request.data)
        
        if serializer.is_valid():
            # Check old password
            if not user.check_password(serializer.validated_data['old_password']):
                return Response(
                    {'error': 'Current password is incorrect'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Set new password
            user.set_password(serializer.validated_data['new_password'])
            user.has_changed_password = True
            user.force_password_change = False
            user.save()
            
            return Response({'message': 'Password changed successfully'})
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['get'])
    def check_password_change_required(self, request, pk=None):
        user = self.get_object()
        return Response({
            'force_password_change': user.force_password_change,
            'has_changed_password': user.has_changed_password
        })

    def perform_create(self, serializer):
        user = serializer.save()
        user.last_login_at = None
        user.save()

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

class PlantViewSet(viewsets.ModelViewSet):
    queryset = Plant.objects.all()
    serializer_class = PlantSerializer
    permission_classes = [IsAuthenticated, IsSuperAdmin]
