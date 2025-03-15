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
    
    def post(self, request):
        """Handle chat requests and generate responses"""
        messages = request.data.get('messages', [])
        plant_id = request.data.get('plant_id')
        start_date = request.data.get('start_date')
        end_date = request.data.get('end_date')
        
        if not messages:
            return Response({"error": "No messages provided"}, status=status.HTTP_400_BAD_REQUEST)
        
        # Get the last user message
        last_message = next((m for m in reversed(messages) if m.get('role') == 'user'), None)
        
        if not last_message:
            return Response({"error": "No user message found"}, status=status.HTTP_400_BAD_REQUEST)
        
        user_query = last_message.get('content', '')
        
        # Get relevant data for the query - no role-based filtering
        queryset = PlantRecord.objects.all()
        
        if plant_id:
            queryset = queryset.filter(plant_id=plant_id)
        
        if start_date:
            queryset = queryset.filter(date__gte=start_date)
        
        if end_date:
            queryset = queryset.filter(date__lte=end_date)
        
        # Generate a response based on the query
        response_message = self.generate_response(user_query, queryset)
        
        return Response({
            "message": response_message,
            "data": None  # You can include data for visualization here if needed
        })
    
    def generate_response(self, query, queryset):
        """Generate a response based on the user query and available data"""
        query = query.lower()
        
        # Calculate some basic statistics
        count = queryset.count()
        
        if count == 0:
            return "I don't have any data matching your criteria. Please try adjusting your filters."
        
        # Handle different types of queries
        if 'average' in query or 'mean' in query:
            if 'rate' in query:
                avg = queryset.aggregate(avg=Avg('rate'))['avg']
                return f"The average rate is {avg:.2f}, calculated from {count} records."
            
            if 'oil' in query:
                avg = queryset.aggregate(avg=Avg('oil'))['avg']
                return f"The average oil content is {avg:.2f}%, calculated from {count} records."
            
            if 'starch' in query:
                avg = queryset.aggregate(avg=Avg('starch'))['avg']
                return f"The average starch content is {avg:.2f}%, calculated from {count} records."
            
            if 'fiber' in query:
                avg = queryset.aggregate(avg=Avg('fiber'))['avg']
                return f"The average fiber content is {avg:.2f}%, calculated from {count} records."
        
        if 'highest' in query or 'maximum' in query:
            if 'rate' in query:
                max_val = queryset.aggregate(max=Max('rate'))['max']
                return f"The highest rate is {max_val:.2f}."
            
            if 'oil' in query:
                max_val = queryset.aggregate(max=Max('oil'))['max']
                return f"The highest oil content is {max_val:.2f}%."
        
        if 'lowest' in query or 'minimum' in query:
            if 'rate' in query:
                min_val = queryset.aggregate(min=Min('rate'))['min']
                return f"The lowest rate is {min_val:.2f}."
            
            if 'oil' in query:
                min_val = queryset.aggregate(min=Min('oil'))['min']
                return f"The lowest oil content is {min_val:.2f}%."
        
        if 'trend' in query or 'over time' in query:
            return "I can see some interesting trends in the data. The values fluctuate over time, with some periods showing higher values than others."
        
        if 'compare' in query:
            if 'oil' in query and 'starch' in query:
                oil_avg = queryset.aggregate(avg=Avg('oil'))['avg']
                starch_avg = queryset.aggregate(avg=Avg('starch'))['avg']
                return f"Comparing oil and starch: The average oil content is {oil_avg:.2f}% while the average starch content is {starch_avg:.2f}%."
        
        # Default response
        return f"I've analyzed {count} plant records. What specific information would you like to know about the data?"
