from django.shortcuts import render
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from .serializers import UserRegistrationSerializer, UserLoginSerializer
from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi

# Create your views here.

class RegisterView(APIView):
    @swagger_auto_schema(
        operation_description="Register a new user",
        request_body=openapi.Schema(
            type=openapi.TYPE_OBJECT,
            required=['email', 'password', 'name'],
            properties={
                'email': openapi.Schema(type=openapi.TYPE_STRING, format=openapi.FORMAT_EMAIL),
                'password': openapi.Schema(type=openapi.TYPE_STRING, format=openapi.FORMAT_PASSWORD),
                'name': openapi.Schema(type=openapi.TYPE_STRING),
            }
        ),
        responses={
            201: "User created successfully",
            400: "Bad request"
        }
    )
    def post(self, request):
        serializer = UserRegistrationSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            refresh = RefreshToken.for_user(user)
            return Response({
                'refresh': str(refresh),
                'access': str(refresh.access_token),
                'user': {
                    'email': user.email,
                    'name': user.name
                }
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class LoginView(APIView):
    @swagger_auto_schema(
        operation_description="Login user and get tokens",
        request_body=openapi.Schema(
            type=openapi.TYPE_OBJECT,
            required=['email', 'password'],
            properties={
                'email': openapi.Schema(type=openapi.TYPE_STRING, format=openapi.FORMAT_EMAIL),
                'password': openapi.Schema(type=openapi.TYPE_STRING, format=openapi.FORMAT_PASSWORD),
            }
        ),
        responses={
            200: openapi.Response(
                description="Login successful",
                schema=openapi.Schema(
                    type=openapi.TYPE_OBJECT,
                    properties={
                        'access': openapi.Schema(type=openapi.TYPE_STRING),
                        'refresh': openapi.Schema(type=openapi.TYPE_STRING),
                        'user': openapi.Schema(
                            type=openapi.TYPE_OBJECT,
                            properties={
                                'email': openapi.Schema(type=openapi.TYPE_STRING),
                                'first_name': openapi.Schema(type=openapi.TYPE_STRING),
                                'last_name': openapi.Schema(type=openapi.TYPE_STRING),
                                'role': openapi.Schema(type=openapi.TYPE_STRING),
                                'plant': openapi.Schema(
                                    type=openapi.TYPE_OBJECT,
                                    properties={
                                        'id': openapi.Schema(type=openapi.TYPE_INTEGER),
                                        'name': openapi.Schema(type=openapi.TYPE_STRING),
                                        'address': openapi.Schema(type=openapi.TYPE_STRING),
                                    }
                                )
                            }
                        )
                    }
                )
            ),
            400: "Invalid credentials"
        }
    )
    def post(self, request):
        serializer = UserLoginSerializer(data=request.data)
        if serializer.is_valid():
            print(f"Login attempt for email: {serializer.validated_data['email']}")
            user = authenticate(
                email=serializer.validated_data['email'],
                password=serializer.validated_data['password']
            )
            print(f"Authentication result: {user}")
            if user:
                refresh = RefreshToken.for_user(user)
                return Response({
                    'refresh': str(refresh),
                    'access': str(refresh.access_token),
                    'user': {
                        'id': user.id,
                        'email': user.email,
                        'first_name': user.first_name,
                        'last_name': user.last_name,
                        'role': user.role,
                        'force_password_change': user.force_password_change,
                        'has_changed_password': user.has_changed_password,
                        'plant': {
                            'id': user.plant.id,
                            'name': user.plant.name,
                            'address': user.plant.address
                        } if user.plant else None
                    }
                })
            return Response(
                {'detail': 'Invalid email or password'}, 
                status=status.HTTP_401_UNAUTHORIZED
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
