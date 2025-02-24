from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import UserViewSet, PlantViewSet

router = DefaultRouter()
router.register(r'users', UserViewSet)
router.register(r'plants', PlantViewSet)

urlpatterns = [
    path('', include(router.urls)),
] 