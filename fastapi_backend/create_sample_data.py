import os
import sys
import datetime
import random
from decimal import Decimal
from pathlib import Path
import getpass

# Add the parent directory to sys.path
sys.path.append(str(Path(__file__).parent))

from sqlalchemy.orm import Session
from app.core.database import SessionLocal, engine, Base
from app.core.config import settings
from app.models.plant import Plant
from app.models.plant_data import PlantRecord, FormulaVariable
from app.crud.plant_data import formula_variable
from app.core.logging import setup_logging

# Setup logging
setup_logging()

def create_sample_formula_variables(db: Session):
    """Create default formula variables if they don't exist."""
    # Check if variables already exist
    variables = formula_variable.get_multi(db)
    if variables:
        print("Formula variables already exist, skipping creation")
        return
    
    # Default variables
    default_variables = [
        {"name": "dm_factor", "value": Decimal("100"), "default_value": Decimal("100"), 
         "description": "DM calculation factor"},
        {"name": "oil_factor", "value": Decimal("2.5"), "default_value": Decimal("2.5"), 
         "description": "Oil value calculation factor"},
        {"name": "net_wo_factor", "value": Decimal("1.5"), "default_value": Decimal("1.5"), 
         "description": "Net without oil and fiber calculation factor"},
        {"name": "starch_per_point_factor", "value": Decimal("100"), "default_value": Decimal("100"), 
         "description": "Starch per point calculation factor"},
        {"name": "grain_factor", "value": Decimal("1.2"), "default_value": Decimal("1.2"), 
         "description": "Grain calculation factor"},
        {"name": "doc_factor", "value": Decimal("1.05"), "default_value": Decimal("1.05"), 
         "description": "DOC calculation factor"},
    ]
    
    for var_data in default_variables:
        db_var = FormulaVariable(**var_data)
        db.add(db_var)
    
    db.commit()
    print("Created default formula variables")

def create_sample_records(db: Session):
    """Create sample plant records."""
    # Check plants exist
    plants = db.query(Plant).all()
    if not plants:
        print("No plants found in database. Please run create_plants.py first.")
        return False
    
    # Ask for confirmation before creating records
    response = input("This will create sample records for all plants. Continue? (y/n): ")
    if response.lower() != 'y':
        print("Operation cancelled.")
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
    
    # Get formula variables for calculation
    variables = {
        var.name: float(var.value) 
        for var in db.query(FormulaVariable).all()
    }
    
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

def create_admin_user(db: Session):
    """Create an admin user if no users exist."""
    from app.models.user import User, Role
    from app.core.security import get_password_hash
    
    # Check if users already exist
    users = db.query(User).all()
    if users:
        print("Users already exist, skipping admin creation")
        return
    
    # Get user input
    print("\nCreating admin user:")
    print("--------------------")
    while True:
        email = input("Admin email: ")
        if "@" in email and "." in email:
            break
        print("Please enter a valid email address")
    
    # Get password
    while True:
        password = getpass.getpass("Admin password: ")
        if len(password) >= 6:
            password_confirm = getpass.getpass("Confirm password: ")
            if password == password_confirm:
                break
            print("Passwords don't match, try again")
        else:
            print("Password must be at least 6 characters")
    
    full_name = input("Admin full name: ")
    
    # Create admin role if it doesn't exist
    admin_role = db.query(Role).filter(Role.name == "admin").first()
    if not admin_role:
        admin_role = Role(
            name="admin",
            description="Administrator role with full access",
            category="ADMIN"
        )
        db.add(admin_role)
        db.commit()
        db.refresh(admin_role)
    
    # Create admin user
    admin_user = User(
        email=email,
        hashed_password=get_password_hash(password),
        full_name=full_name,
        is_active=True,
        is_superuser=True,
        role_id=admin_role.id
    )
    db.add(admin_user)
    db.commit()
    print(f"Admin user {email} created successfully!")

def main():
    """Main function to create sample data."""
    # Create a new database session
    db = SessionLocal()
    try:
        # Create formula variables
        create_sample_formula_variables(db)
        
        # Create sample records
        if not create_sample_records(db):
            print("Sample records creation skipped or failed")
        
        # Create admin user
        create_admin_user(db)
        
    finally:
        db.close()

if __name__ == "__main__":
    main()
