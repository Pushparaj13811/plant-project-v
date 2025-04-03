import os
import sys
from pathlib import Path
import getpass

# Add the parent directory to sys.path
sys.path.append(str(Path(__file__).parent))

from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
from app.core.database import SessionLocal
from app.models.user import User, Role, RoleCategoryEnum
from app.core.security import get_password_hash
from app.core.logging import setup_logging

# Setup logging
setup_logging()

def create_superuser(email: str, password: str, first_name: str, last_name: str):
    """
    Create a superuser with admin privileges
    """
    # Create a new database session
    db = SessionLocal()
    try:
        # Check if user already exists
        existing_user = db.query(User).filter(User.email == email).first()
        if existing_user:
            print(f"User with email {email} already exists")
            return False
        
        # Create superuser with role_id 3 (super admin)
        superuser = User(
            email=email,
            hashed_password=get_password_hash(password),
            first_name=first_name,
            last_name=last_name,
            is_active=True,
            is_superuser=True,
            role_id=3  # Super admin role ID
        )
        db.add(superuser)
        db.commit()
        db.refresh(superuser)
        
        print(f"Superuser {email} created successfully!")
        return True
        
    except SQLAlchemyError as e:
        print(f"Database error: {str(e)}")
        db.rollback()
        return False
    except Exception as e:
        print(f"Error creating superuser: {str(e)}")
        db.rollback()
        return False
    finally:
        db.close()

def main():
    print("=============================================")
    print("Create FastAPI Plant Management Superuser")
    print("=============================================")
    
    try:
        # Get input from user with validation
        while True:
            email = input("Email: ").strip()
            if "@" in email and "." in email:
                break
            print("Please enter a valid email address")
        
        # Get password (hidden input)
        while True:
            password = getpass.getpass("Password: ")
            if len(password) >= 8:  # Minimum length of 8 for better security
                password_confirm = getpass.getpass("Confirm password: ")
                if password == password_confirm:
                    break
                print("Passwords don't match, try again")
            else:
                print("Password must be at least 8 characters")
        
        first_name = input("First name: ").strip()
        while not first_name:
            print("First name cannot be empty")
            first_name = input("First name: ").strip()
            
        last_name = input("Last name: ").strip()
        while not last_name:
            print("Last name cannot be empty")
            last_name = input("Last name: ").strip()
        
        # Create the superuser
        success = create_superuser(email, password, first_name, last_name)
        
        if success:
            print("=============================================")
            print("Superuser created successfully!")
            print("You can now log in with your email and password.")
            print("=============================================")
        else:
            print("=============================================")
            print("Failed to create superuser.")
            print("Please check the error messages above.")
            print("=============================================")
            sys.exit(1)
            
    except KeyboardInterrupt:
        print("\nOperation cancelled by user")
        sys.exit(1)
    except Exception as e:
        print(f"\nUnexpected error: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    main() 