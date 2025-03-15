from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PlantRecordViewSet, FormulaVariableViewSet, ChatView

router = DefaultRouter()
router.register(r'plant-records', PlantRecordViewSet, basename='plant-records')
router.register(r'formula-variables', FormulaVariableViewSet, basename='formula-variables')

urlpatterns = [
    path('', include(router.urls)),
    path('chat/', ChatView.as_view(), name='chat'),
] 