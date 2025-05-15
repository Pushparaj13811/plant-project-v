import os
import sys
from decimal import Decimal
from pathlib import Path

# Add the parent directory to sys.path
sys.path.append(str(Path(__file__).parent))

from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.models.plant_data import FormulaVariable
from app.crud.plant_data import formula_variable
from app.core.logging import setup_logging

# Setup logging
setup_logging()

def create_formula_variables(db: Session):
    """Create default formula variables if they don't exist."""
    # Check if variables already exist
    variables = formula_variable.get_multi(db)
    if variables:
        print("Formula variables already exist. Do you want to:")
        print("1. Keep existing variables")
        print("2. Reset to default values")
        print("3. Delete all variables and create new ones")
        
        choice = input("Enter your choice (1-3): ")
        
        if choice == "1":
            print("Keeping existing variables")
            return
        elif choice == "2":
            print("Resetting to default values...")
            for var in variables:
                var.value = var.default_value
            db.commit()
            print("Variables reset to default values")
            return
        elif choice == "3":
            print("Deleting existing variables...")
            db.query(FormulaVariable).delete()
            db.commit()
            print("Existing variables deleted")
        else:
            print("Invalid choice. Exiting.")
            return
    
    # Default variables
    default_variables = [
        {"name": "dm_factor", "value": Decimal("100"), "default_value": Decimal("100"), 
         "description": "DM calculation factor", "display_name": "DM Factor"},
        {"name": "oil_factor", "value": Decimal("2.5"), "default_value": Decimal("2.5"), 
         "description": "Oil value calculation factor", "display_name": "Oil Factor"},
        {"name": "net_wo_factor", "value": Decimal("1.5"), "default_value": Decimal("1.5"), 
         "description": "Net without oil and fiber calculation factor", "display_name": "Net (wo Oil & Fiber) Factor"},
        {"name": "starch_per_point_factor", "value": Decimal("100"), "default_value": Decimal("100"), 
         "description": "Starch per point calculation factor", "display_name": "Starch Per Point Factor"},
        {"name": "grain_factor", "value": Decimal("1.2"), "default_value": Decimal("1.2"), 
         "description": "Grain calculation factor", "display_name": "Grain Factor"},
        {"name": "doc_factor", "value": Decimal("1.05"), "default_value": Decimal("1.05"), 
         "description": "DOC calculation factor", "display_name": "DOC Factor"},
    ]
    
    # Create variables
    for var_data in default_variables:
        db_var = FormulaVariable(**var_data)
        db.add(db_var)
        print(f"Created variable: {var_data['display_name']} ({var_data['name']})")
    
    db.commit()
    print("\nAll formula variables created successfully!")

def main():
    """Main function to create formula variables."""
    # Create a new database session
    db = SessionLocal()
    try:
        create_formula_variables(db)
    finally:
        db.close()

if __name__ == "__main__":
    main() 