import os
import sys
from pathlib import Path

# Add the parent directory to sys.path
sys.path.append(str(Path(__file__).parent))

from app.core.config import settings
from app.core.database import Base, engine
from app.models import plant, plant_data, user

def create_tables():
    """Create all database tables."""
    print("Creating database tables...")
    
    # Create all tables
    Base.metadata.create_all(bind=engine)
    
    print("Database tables created successfully!")

if __name__ == "__main__":
    create_tables() 