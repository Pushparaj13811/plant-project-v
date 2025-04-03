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

# Drop existing schema and recreate it
echo "Dropping existing schema..."
PGPASSWORD=Feed\!2712 psql -h postgres251.postgres.database.azure.com -U postgres -d postgres -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"

# Remove existing migrations
echo "Removing existing migrations..."
rm -f migrations/versions/*.py
rm -f migrations/versions/*.pyc
rm -f migrations/versions/__pycache__/*

# Create a fresh migration
echo "Creating fresh migration..."
alembic revision --autogenerate -m "initial_migration"

# Run Alembic migrations
echo "Running database migrations..."
alembic upgrade head

# Create initial roles
echo "Creating initial roles..."
PGPASSWORD=Feed\!2712 psql -h postgres251.postgres.database.azure.com -U postgres -d postgres -c "
INSERT INTO roles (id, name, category, description, parent_id, level, permissions, created_at, updated_at) VALUES 
(1, 'user', 'USER', 'Regular user role', NULL, 1, '{\"can_view\": true}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(2, 'admin', 'ADMIN', 'Administrator role', NULL, 2, '{\"can_view\": true, \"can_edit\": true, \"can_delete\": true}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(3, 'super_admin', 'SUPER_ADMIN', 'Super Administrator role', NULL, 3, '{\"can_view\": true, \"can_edit\": true, \"can_delete\": true, \"can_manage_users\": true}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (id) DO NOTHING;"

# Create initial superuser
echo "Creating superuser..."
python3 create_superuser.py

# Create initial plants
echo "Creating plants..."
python create_plants.py

# Create formula variables
echo "Creating formula variables..."
python create_formula_variables.py

# Create sample data
echo "Creating sample data..."
python create_sample_data.py

echo "==============================================" 
echo "Migration completed successfully!"
echo "==============================================" 
echo "Next steps:"
echo "1. Run the FastAPI application:"
echo "   uvicorn app.main:app --reload"
echo "==============================================" 