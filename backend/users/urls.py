from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import UserViewSet, PlantViewSet, RoleViewSet

router = DefaultRouter()
router.register(r'users', UserViewSet)
router.register(r'plants', PlantViewSet)
router.register(r'roles', RoleViewSet)

urlpatterns = [
    path('', include(router.urls)),
] 