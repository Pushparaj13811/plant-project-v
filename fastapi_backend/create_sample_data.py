import os
import sys
import datetime
import random
from decimal import Decimal
from pathlib import Path

# Add the parent directory to sys.path
sys.path.append(str(Path(__file__).parent))

from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.models.plant import Plant
from app.models.plant_data import PlantRecord, FormulaVariable
from app.core.logging import setup_logging

# Setup logging
setup_logging()

def create_sample_records(db: Session):
    """Create sample plant records."""
    # Check plants exist
    plants = db.query(Plant).all()
    if not plants:
        print("No plants found in database. Please run create_plants.py first.")
        return False
        
    # Get formula variables for calculation
    variables = {
        var.name: float(var.value) 
        for var in db.query(FormulaVariable).all()
    }
    
    if not variables:
        print("No formula variables found. Please run create_formula_variables.py first.")
        return False
    
    # List of 20 unique party names
    party_names = [
        "Radha Enterprises - Kichha",
        "Shree Ram Trading Co.",
        "Mahadev Agro Industries",
        "Hari Om Grain Suppliers",
        "Krishna Food Processing",
        "Annapurna Agro Traders",
        "Ganesh Agri Solutions",
        "Vishnu Agri Products",
        "Balaji Grain Suppliers",
        "Shakti Trading Company",
        "Ganga Agro Mills",
        "Shree Krishna Enterprises",
        "Laxmi Agri Traders",
        "Om Sai Agro Exports",
        "Jay Ambe Commodities",
        "Parvati Food Industries",
        "Shree Shyam Agro Tech",
        "Durga Agri Business",
        "Shree Siddhivinayak Traders",
        "Rudra Agro Corporation"
    ]
    
    # Check if there are existing records
    existing_records = db.query(PlantRecord).count()
    if existing_records > 0:
        print(f"Found {existing_records} existing records")
        response = input("Do you want to delete existing records and create new ones? (y/n): ")
        if response.lower() == 'y':
            db.query(PlantRecord).delete()
            db.commit()
            print("Deleted existing records")
        else:
            print("Keeping existing records. Will add new records.")
    
    # Create records for each plant
    for plant in plants:
        print(f"Creating sample records for plant: {plant.name} (ID: {plant.id})")
        
        for i in range(10):
            date = datetime.date.today() - datetime.timedelta(days=i)
            
            # Varying value ranges based on plant ID - using thousands instead of hundreds
            base_rate = 1000 + i * 100 if plant.id % 3 == 0 else 1500 + i * 50 if plant.id % 3 == 1 else 2000 + i * 80
            mv_value = 10 + i if plant.id % 3 == 0 else 20 + i * 2 if plant.id % 3 == 1 else 30 + i * 3
            oil_value = 5 + i if plant.id % 3 == 0 else 8 + i * 1.5 if plant.id % 3 == 1 else 10 + i * 2
            fiber_value = 3 + i if plant.id % 3 == 0 else 6 + i * 1.2 if plant.id % 3 == 1 else 9 + i * 1.5
            starch_value = 50 + i * 2 if plant.id % 3 == 0 else 70 + i * 2.5 if plant.id % 3 == 1 else 90 + i * 3
            maize_rate = 800 + i * 50 if plant.id % 3 == 0 else 1000 + i * 60 if plant.id % 3 == 1 else 1200 + i * 70
            
            # Create record
            record = PlantRecord(
                plant_id=plant.id,
                date=date,
                code=f'PLANT{plant.id}_{i}',
                product='Maize',
                truck_no=f'TN-{plant.id}-{i}',
                bill_no=f'BN-{plant.id}-{i}',
                party_name=random.choice(party_names),
                rate=Decimal(str(base_rate)),
                mv=Decimal(str(mv_value)),
                oil=Decimal(str(oil_value)),
                fiber=Decimal(str(fiber_value)),
                starch=Decimal(str(starch_value)),
                maize_rate=Decimal(str(maize_rate))
            )
            
            # Calculate derived values
            record.calculate_derived_values(variables)
            
            db.add(record)
            print(f"Created record for Plant {plant.id} - Entry {i+1}: {record.party_name}")
    
    db.commit()
    print("Sample data creation complete!")
    return True

def main():
    """Main function to create sample plant records."""
    print("=============================================")
    print("Creating Sample Plant Records")
    print("=============================================")
    
    # Create a new database session
    db = SessionLocal()
    try:
        if not create_sample_records(db):
            print("Sample records creation failed")
            sys.exit(1)
    except Exception as e:
        print(f"Error creating sample records: {str(e)}")
        sys.exit(1)
    finally:
        db.close()

if __name__ == "__main__":
    main()
