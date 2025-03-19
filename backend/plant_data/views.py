from django.shortcuts import render
from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Avg, Min, Max
from .models import PlantRecord, FormulaVariable
from .serializers import PlantRecordSerializer, FormulaVariableSerializer
from users.models import RoleCategory
from django.core.paginator import Paginator
from rest_framework.views import APIView
import os
from groq import Groq
from dotenv import load_dotenv

load_dotenv()

# Create your views here.

class IsPlantUser(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated

    def has_object_permission(self, request, view, obj):
        # Allow all authenticated users to access plant records
        return True

class FormulaVariableViewSet(viewsets.ModelViewSet):
    queryset = FormulaVariable.objects.all()
    serializer_class = FormulaVariableSerializer
    permission_classes = [permissions.IsAuthenticated]
    http_method_names = ['get', 'patch', 'head', 'options']  # Limit to READ and UPDATE only
    
    @action(detail=False, methods=['post'])
    def reset_all(self, request):
        """Reset all formula variables to their default values"""
        variables = FormulaVariable.objects.all()
        for variable in variables:
            variable.reset_to_default()
        return Response({"status": "All variables reset to defaults"}, status=status.HTTP_200_OK)
    
    @action(detail=True, methods=['post'])
    def reset(self, request, pk=None):
        """Reset a specific formula variable to its default value"""
        variable = self.get_object()
        variable.reset_to_default()
        serializer = self.get_serializer(variable)
        return Response(serializer.data)

class PlantRecordViewSet(viewsets.ModelViewSet):
    serializer_class = PlantRecordSerializer
    permission_classes = [permissions.IsAuthenticated, IsPlantUser]

    def get_queryset(self):
        # Return all plant records for any authenticated user
        return PlantRecord.objects.all()
    
    def get_queryset_with_filters(self):
        queryset = self.get_queryset()
        
        # Apply date range filters if provided
        start_date = self.request.query_params.get('start_date')
        end_date = self.request.query_params.get('end_date')
        
        if start_date:
            queryset = queryset.filter(date__gte=start_date)
        if end_date:
            queryset = queryset.filter(date__lte=end_date)
            
        # Filter by plant if provided
        plant_id = self.request.query_params.get('plant_id')
        if plant_id:
            queryset = queryset.filter(plant_id=plant_id)
            
        return queryset
    
    def list(self, request):
        queryset = self.get_queryset_with_filters()
        
        # Get pagination parameters
        page = request.query_params.get('page')
        per_page = request.query_params.get('per_page')
        
        try:
            if page is not None:
                page = int(page)
            if per_page is not None:
                per_page = int(per_page)
        except (TypeError, ValueError):
            page = None
            per_page = None
        
        # Apply pagination if parameters are provided
        if page is not None and per_page is not None:
            paginator = Paginator(queryset, per_page)
            page_obj = paginator.get_page(page)
            
            serializer = self.get_serializer(page_obj, many=True)
            
            # Return paginated response
            return Response({
                'results': serializer.data,
                'count': paginator.count,
                'next': page < paginator.num_pages,
                'previous': page > 1
            })
        else:
            # Return all records if no pagination parameters
            serializer = self.get_serializer(queryset, many=True)
            return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def statistics(self, request):
        """Get statistics for plant records"""
        queryset = self.get_queryset_with_filters()
        
        stats = {
            'total_records': queryset.count(),
            'date_range': {
                'min': queryset.aggregate(min_date=Min('date'))['min_date'],
                'max': queryset.aggregate(max_date=Max('date'))['max_date'],
            },
            'averages': {
                'rate': queryset.aggregate(avg=Avg('rate'))['avg'],
                'mv': queryset.aggregate(avg=Avg('mv'))['avg'],
                'oil': queryset.aggregate(avg=Avg('oil'))['avg'],
                'fiber': queryset.aggregate(avg=Avg('fiber'))['avg'],
                'starch': queryset.aggregate(avg=Avg('starch'))['avg'],
                'maize_rate': queryset.aggregate(avg=Avg('maize_rate'))['avg'],
                'dm': queryset.aggregate(avg=Avg('dm'))['avg'],
                'rate_on_dm': queryset.aggregate(avg=Avg('rate_on_dm'))['avg'],
                'oil_value': queryset.aggregate(avg=Avg('oil_value'))['avg'],
                'net_wo_oil_fiber': queryset.aggregate(avg=Avg('net_wo_oil_fiber'))['avg'],
                'starch_per_point': queryset.aggregate(avg=Avg('starch_per_point'))['avg'],
                'starch_value': queryset.aggregate(avg=Avg('starch_value'))['avg'],
                'grain': queryset.aggregate(avg=Avg('grain'))['avg'],
                'doc': queryset.aggregate(avg=Avg('doc'))['avg'],
            }
        }
        
        return Response(stats)

    @action(detail=False, methods=['get'])
    def available_columns(self, request):
        """Get all available columns information for plant records"""
        
        # Define column categories
        column_categories = {
            'input_variables': [
                {'name': 'rate', 'label': 'Rate', 'type': 'number'},
                {'name': 'mv', 'label': 'Mv', 'type': 'number'},
                {'name': 'oil', 'label': 'Oil', 'type': 'number'},
                {'name': 'fiber', 'label': 'Fiber', 'type': 'number'},
                {'name': 'starch', 'label': 'Starch', 'type': 'number'},
                {'name': 'maize_rate', 'label': 'Maize Rate', 'type': 'number'},
            ],
            'dry_variables': [
                {'name': 'dm', 'label': 'DM', 'type': 'number'},
                {'name': 'rate_on_dm', 'label': 'Rate on DM', 'type': 'number'},
                {'name': 'oil_value', 'label': 'Oil Value', 'type': 'number'},
                {'name': 'net_wo_oil_fiber', 'label': 'Net (wo Oil & Fiber)', 'type': 'number'},
                {'name': 'starch_per_point', 'label': 'Starch Per Point', 'type': 'number'},
                {'name': 'starch_value', 'label': 'Starch Value', 'type': 'number'},
                {'name': 'grain', 'label': 'Grain', 'type': 'number'},
                {'name': 'doc', 'label': 'DOC', 'type': 'number'},
            ],
            'general_info': [
                {'name': 'date', 'label': 'Date', 'type': 'date'},
                {'name': 'code', 'label': 'Code', 'type': 'text'},
                {'name': 'product', 'label': 'Product', 'type': 'text'},
                {'name': 'truck_no', 'label': 'Truck No', 'type': 'text'},
                {'name': 'bill_no', 'label': 'Bill No', 'type': 'text'},
                {'name': 'party_name', 'label': 'Party Name', 'type': 'text'},
            ]
        }
        
        return Response(column_categories)

class ChatView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.client = Groq(
            api_key=os.getenv("GROQ_API_KEY"),
        )
    
    def post(self, request):
        """Handle chat requests using Groq API"""
        message = request.data.get('message')
        plant_id = request.data.get('plant_id')
        start_date = request.data.get('start_date')
        end_date = request.data.get('end_date')
        
        if not message:
            return Response({"error": "No message provided"}, status=status.HTTP_400_BAD_REQUEST)
        
        # Get relevant data for the query
        queryset = PlantRecord.objects.all()
        
        if plant_id:
            queryset = queryset.filter(plant_id=plant_id)
        
        if start_date:
            queryset = queryset.filter(date__gte=start_date)
        
        if end_date:
            queryset = queryset.filter(date__lte=end_date)
        
        # Prepare context from the queryset
        context = self.prepare_context(queryset)
        
        # Create system message with context
        system_message = {
            "role": "system",
            "content": f"""You are a helpful assistant for a plant data management system. 
            You have access to the following data context:
            {context}
            
            Please provide accurate and helpful responses based on this data. 
            If the data is not sufficient to answer the query, please say so."""
        }
        
        # Prepare messages for Groq
        groq_messages = [
            system_message,
            {"role": "user", "content": message}
        ]
        
        try:
            # Call Groq API
            chat_completion = self.client.chat.completions.create(
                messages=groq_messages,
                model="llama-3.3-70b-versatile",
                temperature=0.7,
                max_tokens=1000
            )
            
            response_message = chat_completion.choices[0].message.content
            
            return Response({
                "message": response_message,
                "data": None
            })
            
        except Exception as e:
            return Response({
                "error": f"Failed to generate response: {str(e)}"
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def prepare_context(self, queryset):
        """Prepare context from the queryset for the AI"""
        count = queryset.count()
        
        if count == 0:
            return "No data available for the specified criteria."
        
        # Calculate basic statistics
        stats = {
            'total_records': count,
            'date_range': {
                'min': queryset.aggregate(min_date=Min('date'))['min_date'],
                'max': queryset.aggregate(max_date=Max('date'))['max_date'],
            },
            'averages': {
                'rate': queryset.aggregate(avg=Avg('rate'))['avg'],
                'mv': queryset.aggregate(avg=Avg('mv'))['avg'],
                'oil': queryset.aggregate(avg=Avg('oil'))['avg'],
                'fiber': queryset.aggregate(avg=Avg('fiber'))['avg'],
                'starch': queryset.aggregate(avg=Avg('starch'))['avg'],
                'maize_rate': queryset.aggregate(avg=Avg('maize_rate'))['avg'],
                'dm': queryset.aggregate(avg=Avg('dm'))['avg'],
                'rate_on_dm': queryset.aggregate(avg=Avg('rate_on_dm'))['avg'],
                'oil_value': queryset.aggregate(avg=Avg('oil_value'))['avg'],
                'net_wo_oil_fiber': queryset.aggregate(avg=Avg('net_wo_oil_fiber'))['avg'],
                'starch_per_point': queryset.aggregate(avg=Avg('starch_per_point'))['avg'],
                'starch_value': queryset.aggregate(avg=Avg('starch_value'))['avg'],
                'grain': queryset.aggregate(avg=Avg('grain'))['avg'],
                'doc': queryset.aggregate(avg=Avg('doc'))['avg'],
            }
        }
        
        # Format the context
        context = f"""
        Total Records: {stats['total_records']}
        Date Range: {stats['date_range']['min']} to {stats['date_range']['max']}
        
        Averages:
        - Rate: {stats['averages']['rate']:.2f}
        - MV: {stats['averages']['mv']:.2f}
        - Oil: {stats['averages']['oil']:.2f}%
        - Fiber: {stats['averages']['fiber']:.2f}%
        - Starch: {stats['averages']['starch']:.2f}%
        - Maize Rate: {stats['averages']['maize_rate']:.2f}
        - DM: {stats['averages']['dm']:.2f}
        - Rate on DM: {stats['averages']['rate_on_dm']:.2f}
        - Oil Value: {stats['averages']['oil_value']:.2f}
        - Net (wo Oil & Fiber): {stats['averages']['net_wo_oil_fiber']:.2f}
        - Starch Per Point: {stats['averages']['starch_per_point']:.2f}
        - Starch Value: {stats['averages']['starch_value']:.2f}
        - Grain: {stats['averages']['grain']:.2f}
        - DOC: {stats['averages']['doc']:.2f}
        """
        
        return context
