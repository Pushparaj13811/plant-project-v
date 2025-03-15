from rest_framework import serializers
from .models import PlantRecord, FormulaVariable
from users.serializers import PlantSerializer
from users.models import Plant

class PlantRecordSerializer(serializers.ModelSerializer):
    plant = PlantSerializer(read_only=True)
    plant_id = serializers.IntegerField(write_only=True)
    
    class Meta:
        model = PlantRecord
        fields = [
            'id', 'plant', 'plant_id', 'date', 'code', 'product', 'truck_no',
            'bill_no', 'party_name', 
            # Input Variables
            'rate', 'mv', 'oil', 'fiber', 'starch', 'maize_rate',
            # Calculated (Dry) Variables
            'dm', 'rate_on_dm', 'oil_value', 'net_wo_oil_fiber', 
            'starch_per_point', 'starch_value', 'grain', 'doc',
            # Metadata
            'created_at', 'updated_at'
        ]
        read_only_fields = [
            'dm', 'rate_on_dm', 'oil_value', 'net_wo_oil_fiber', 
            'starch_per_point', 'starch_value', 'grain', 'doc',
            'created_at', 'updated_at'
        ]

    def validate(self, data):
        # Validate that all required fields are provided
        required_fields = ['rate', 'mv', 'oil', 'fiber', 'starch', 'maize_rate']
        for field in required_fields:
            if field not in data:
                raise serializers.ValidationError(f"{field} is required.")
        return data

    def create(self, validated_data):
        plant_id = validated_data.pop('plant_id')
        plant = Plant.objects.get(id=plant_id)
        return PlantRecord.objects.create(plant=plant, **validated_data)

class FormulaVariableSerializer(serializers.ModelSerializer):
    class Meta:
        model = FormulaVariable
        fields = ['id', 'name', 'display_name', 'description', 'value', 'default_value', 'created_at', 'updated_at']
        read_only_fields = ['id', 'name', 'display_name', 'description', 'default_value', 'created_at', 'updated_at'] 