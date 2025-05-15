import os
import sys
from decimal import Decimal
from pathlib import Path
import getpass
from datetime import datetime

# Add the parent directory to sys.path
sys.path.append(str(Path(__file__).parent))

from sqlalchemy.orm import Session
from app.core.database import SessionLocal, engine, Base
from app.core.config import settings
from app.core.security import get_password_hash
from app.models.user import User, Role, RoleCategoryEnum
from app.models.plant import Plant
from app.models.plant_data import FormulaVariable, PlantRecord
from app.core.logging import setup_logging

# Setup logging
setup_logging()

def create_tables():
    """Create all database tables."""
    print("Creating database tables...")
    Base.metadata.create_all(bind=engine)
    print("Database tables created successfully!")

def create_roles(db: Session):
    """Create default roles if they don't exist."""
    print("\nCreating roles...")
    
    # Default roles
    default_roles = [
        {
            "name": "super_admin",
            "category": RoleCategoryEnum.SUPER_ADMIN,
            "description": "Super Administrator with full access",
            "permissions": {"*": "*"}
        },
        {
            "name": "admin",
            "category": RoleCategoryEnum.ADMIN,
            "description": "Administrator with management access",
            "permissions": {
                "users": ["read", "create", "update"],
                "plants": ["read", "create", "update", "delete"],
                "records": ["read", "create", "update", "delete"],
                "formula_variables": ["read", "update"]
            }
        },
        {
            "name": "user",
            "category": RoleCategoryEnum.USER,
            "description": "Regular user with basic access",
            "permissions": {
                "plants": ["read"],
                "records": ["read", "create"],
                "formula_variables": ["read"]
            }
        }
    ]
    
    for role_data in default_roles:
        role = db.query(Role).filter(Role.name == role_data["name"]).first()
        if not role:
            role = Role(**role_data)
            db.add(role)
            print(f"Created role: {role_data['name']}")
    
    db.commit()
    print("Roles created successfully!")

def create_formula_variables(db: Session):
    """Create default formula variables if they don't exist."""
    print("\nCreating formula variables...")
    
    # Default variables
    default_variables = [
        {
            "name": "dm_factor",
            "display_name": "DM Factor",
            "value": Decimal("100"),
            "default_value": Decimal("100"),
            "description": "DM calculation factor"
        },
        {
            "name": "oil_factor",
            "display_name": "Oil Factor",
            "value": Decimal("2.5"),
            "default_value": Decimal("2.5"),
            "description": "Oil value calculation factor"
        },
        {
            "name": "net_wo_factor",
            "display_name": "Net (wo Oil & Fiber) Factor",
            "value": Decimal("1.5"),
            "default_value": Decimal("1.5"),
            "description": "Net without oil and fiber calculation factor"
        },
        {
            "name": "starch_per_point_factor",
            "display_name": "Starch Per Point Factor",
            "value": Decimal("100"),
            "default_value": Decimal("100"),
            "description": "Starch per point calculation factor"
        },
        {
            "name": "grain_factor",
            "display_name": "Grain Factor",
            "value": Decimal("1.2"),
            "default_value": Decimal("1.2"),
            "description": "Grain calculation factor"
        },
        {
            "name": "doc_factor",
            "display_name": "DOC Factor",
            "value": Decimal("1.05"),
            "default_value": Decimal("1.05"),
            "description": "DOC calculation factor"
        }
    ]
    
    for var_data in default_variables:
        var = db.query(FormulaVariable).filter(FormulaVariable.name == var_data["name"]).first()
        if not var:
            var = FormulaVariable(**var_data)
            db.add(var)
            print(f"Created variable: {var_data['display_name']}")
    
    db.commit()
    print("Formula variables created successfully!")

def create_plants(db: Session):
    """Create sample plants if they don't exist."""
    print("\nCreating plants...")
    
    # Sample plants
    sample_plants = [
        {
            "name": "Plant 1",
            "location": "Location 1",
            "description": "Main processing plant"
        },
        {
            "name": "Plant 2",
            "location": "Location 2",
            "description": "Secondary processing plant"
        }
    ]
    
    for plant_data in sample_plants:
        plant = db.query(Plant).filter(Plant.name == plant_data["name"]).first()
        if not plant:
            plant = Plant(**plant_data)
            db.add(plant)
            print(f"Created plant: {plant_data['name']}")
    
    db.commit()
    print("Plants created successfully!")

def create_admin_user(db: Session):
    """Create an admin user if no users exist."""
    print("\nCreating admin user...")
    
    # Check if users already exist
    users = db.query(User).all()
    if users:
        print("Users already exist, skipping admin creation")
        return
    
    # Get admin role
    admin_role = db.query(Role).filter(Role.name == "admin").first()
    if not admin_role:
        print("Admin role not found, please run create_roles first")
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
    
    first_name = input("Admin first name: ")
    last_name = input("Admin last name: ")
    
    # Create admin user
    admin_user = User(
        email=email,
        first_name=first_name,
        last_name=last_name,
        hashed_password=get_password_hash(password),
        is_active=True,
        is_superuser=True,
        is_staff=True,
        role_id=admin_role.id,
        has_changed_password=True,
        force_password_change=False
    )
    
    db.add(admin_user)
    db.commit()
    print(f"Admin user {email} created successfully!")

def main():
    """Main function to initialize the database."""
    # Create a new database session
    db = SessionLocal()
    try:
        # Create tables
        create_tables()
        
        # Create roles
        create_roles(db)
        
        # Create formula variables
        create_formula_variables(db)
        
        # Create plants
        create_plants(db)
        
        # Create admin user
        create_admin_user(db)
        
        print("\nDatabase initialization complete!")
        
    finally:
        db.close()

if __name__ == "__main__":
    main() 