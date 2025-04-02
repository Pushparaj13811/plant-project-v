#!/bin/bash

# Exit on error
set -e

echo "==============================================" 
echo "FastAPI Plant Management Migration Script"
echo "==============================================" 

# Check if .env file exists
if [ ! -f .env ]; then
    echo "Error: .env file not found!"
    echo "Please create a .env file with the required environment variables."
    exit 1
fi

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "Error: Python 3 is not installed!"
    exit 1
fi

# Check if pip is installed
if ! command -v pip3 &> /dev/null; then
    echo "Error: pip3 is not installed!"
    exit 1
fi

# Install/upgrade required packages
echo "Installing/upgrading required packages..."
pip3 install -r requirements.txt

# Create database tables
echo "Creating database tables..."
python3 create_tables.py

# Run Alembic migrations
echo "Running database migrations..."
alembic upgrade head

# Create demo user
echo "Creating demo user..."
python3 create_demo_user.py

# Create plants
echo "Creating plants..."
python3 create_plants.py

# Create sample data
echo "Creating sample data..."
python3 create_sample_data.py

# Initialize database with default data
echo "Initializing database with default data..."
python3 -c "
from app.core.database import SessionLocal
from app.db.init_db import init_db
db = SessionLocal()
try:
    init_db(db)
    print('Database initialized with default data')
finally:
    db.close()
"

echo "==============================================" 
echo "Migration completed successfully!"
echo "==============================================" 
echo "You can now:"
echo "1. Run the FastAPI application:"
echo "   uvicorn app.main:app --reload"
echo ""
echo "2. Create a custom superuser (if needed):"
echo "   python3 create_superuser.py"
echo "==============================================" 