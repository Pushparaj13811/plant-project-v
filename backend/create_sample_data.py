import os
import django
import datetime
from decimal import Decimal

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

# Import models
from plant_data.models import PlantRecord
from users.models import Plant

def create_sample_records():
    plant_ids = [1, 3, 4]
    plants = Plant.objects.filter(id__in=plant_ids)
    
    if not plants.exists():
        print("No matching plants found in the database.")
        return
    
    for plant in plants:
        print(f"Creating sample records for plant: {plant.name} (ID: {plant.id})")
        
        for i in range(10):
            date = datetime.date.today() - datetime.timedelta(days=i)
            
            # Varying value ranges based on plant ID
            base_rate = 100 + i * 10 if plant.id == 1 else 150 + i * 5 if plant.id == 3 else 200 + i * 8
            mv_value = 10 + i if plant.id == 1 else 20 + i * 2 if plant.id == 3 else 30 + i * 3
            oil_value = 5 + i if plant.id == 1 else 8 + i * 1.5 if plant.id == 3 else 10 + i * 2
            fiber_value = 3 + i if plant.id == 1 else 6 + i * 1.2 if plant.id == 3 else 9 + i * 1.5
            starch_value = 50 + i * 2 if plant.id == 1 else 70 + i * 2.5 if plant.id == 3 else 90 + i * 3
            maize_rate = 80 + i * 5 if plant.id == 1 else 100 + i * 6 if plant.id == 3 else 120 + i * 7
            
            record = PlantRecord.objects.create(
                plant=plant,
                date=date,
                code=f'TEST{plant.id}_{i}',
                product='Maize',
                truck_no=f'TN-{plant.id}-{i}',
                bill_no=f'BN-{plant.id}-{i}',
                party_name=f'Test Party {plant.id}',
                rate=Decimal(base_rate),
                mv=Decimal(mv_value),
                oil=Decimal(oil_value),
                fiber=Decimal(fiber_value),
                starch=Decimal(starch_value),
                maize_rate=Decimal(maize_rate)
            )
            
            print(f"Created record for Plant {plant.id} - Entry {i+1}: {record}")
    
    print("Sample data creation complete!")

if __name__ == "__main__":
    create_sample_records()
