#!/bin/bash

# Activate virtual environment
source venv/bin/activate

# Apply migrations
python manage.py migrate

# Run server
python manage.py runserver 