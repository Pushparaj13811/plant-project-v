import os
import sys
from pathlib import Path

# Add the parent directory to sys.path
sys.path.append(str(Path(__file__).parent))

from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.models.plant import Plant
from app.core.logging import setup_logging

# Setup logging
setup_logging()

def create_plants():
    """
    Create 10 sample plants
    """
    # Sample plants data
    plants_data = [
        {"id": 1, "name": "Kichha Plant", "location": "Kichha", "description": "Main processing plant in Kichha"},
        {"id": 2, "name": "Rudrapur Plant", "location": "Rudrapur", "description": "Plant facility in Rudrapur industrial area"},
        {"id": 3, "name": "Rampur Plant", "location": "Rampur", "description": "Rampur processing facility"},
        {"id": 4, "name": "Sitarganj Plant", "location": "Sitarganj", "description": "Plant located in Sitarganj"},
        {"id": 5, "name": "Kashipur Plant", "location": "Kashipur", "description": "Kashipur processing center"},
        {"id": 6, "name": "Bazpur Plant", "location": "Bazpur", "description": "Plant operations in Bazpur"},
        {"id": 7, "name": "Haldwani Plant", "location": "Haldwani", "description": "Processing facility in Haldwani"},
        {"id": 8, "name": "Jaspur Plant", "location": "Jaspur", "description": "Jaspur manufacturing plant"},
        {"id": 9, "name": "Bilaspur Plant", "location": "Bilaspur", "description": "Bilaspur plant facility"},
        {"id": 10, "name": "Gadarpur Plant", "location": "Gadarpur", "description": "Processing unit in Gadarpur"}
    ]
    
    # Create a new database session
    db = SessionLocal()
    try:
        # Check for existing plants
        existing_plants = db.query(Plant).all()
        if existing_plants:
            print(f"Found {len(existing_plants)} existing plants")
            
            # Ask user if they want to delete existing plants
            response = input("Do you want to delete existing plants and create new ones? (y/n): ")
            if response.lower() != 'y':
                print("Keeping existing plants. Operation cancelled.")
                return False
            
            # Delete existing plants
            for plant in existing_plants:
                db.delete(plant)
            db.commit()
            print("Deleted existing plants")
        
        # Create new plants
        created_count = 0
        for plant_data in plants_data:
            plant = Plant(**plant_data)
            db.add(plant)
            created_count += 1
            print(f"Added plant: {plant_data['name']} (ID: {plant_data['id']})")
        
        db.commit()
        print(f"Successfully created {created_count} plants")
        return True
        
    except Exception as e:
        db.rollback()
        print(f"Error creating plants: {str(e)}")
        return False
        
    finally:
        db.close()

if __name__ == "__main__":
    print("=============================================")
    print("Creating 10 plants for FastAPI Plant Management")
    print("=============================================")
    
    success = create_plants()
    
    if success:
        print("=============================================")
        print("Plants created successfully!")
        print("=============================================")
    else:
        print("=============================================")
        print("Failed to create plants.")
        print("=============================================") 