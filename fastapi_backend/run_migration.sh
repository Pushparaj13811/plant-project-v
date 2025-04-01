#!/bin/bash

echo "==============================================" 
echo "FastAPI Plant Management Migration Script"
echo "==============================================" 

# Create database tables
echo "Creating database tables..."
python create_tables.py

# Create demo user
echo "Creating demo user..."
python create_demo_user.py

# Create plants
echo "Creating plants..."
python create_plants.py

# Create sample data
echo "Creating sample data..."
python create_sample_data.py

echo "==============================================" 
echo "Migration completed successfully!"
echo "==============================================" 
echo "You can now:"
echo "1. Run the FastAPI application:"
echo "   uvicorn app.main:app --reload"
echo ""
echo "2. Create a custom superuser (if needed):"
echo "   python create_superuser.py"
echo "==============================================" 