# FastAPI Plant Management System

This is a FastAPI-based backend for the Plant Management System. It provides a robust API for managing plant data, user authentication, and analytical operations.

## Features

- **User Management**: Complete authentication system with JWT tokens, role-based access control, and user activity tracking
- **Plant Management**: CRUD operations for plants and plant records
- **Formula Variables**: Configuration for calculation variables used in plant data analysis
- **Statistics and Analysis**: Endpoints for retrieving plant data statistics and averages
- **Chat Integration**: AI-assisted chat functionality using Groq's API
- **Comprehensive Logging**: Configurable logging for both development and production environments

## Getting Started

### Prerequisites

- Python 3.8+
- PostgreSQL (or compatible database)
- Environment variables configured (see `.env.example`)

### Installation

1. Clone the repository
2. Create and activate a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Configure environment variables:
   ```bash
   cp .env.example .env
   # Edit .env file with your configuration
   ```
5. Run the application:
   ```bash
   uvicorn app.main:app --reload
   ```

### Docker Deployment

You can also run the application using Docker:

```bash
docker build -t plant-management-api .
docker run -p 8000:8000 --env-file .env plant-management-api
```

## API Documentation

After starting the server, you can access:
- Interactive API documentation: http://localhost:8000/api/v1/docs
- OpenAPI specification: http://localhost:8000/api/v1/openapi.json

## API Endpoints

### Authentication
- `POST /api/v1/auth/login` - Obtain JWT token
- `POST /api/v1/auth/refresh` - Refresh JWT token
- `POST /api/v1/auth/register` - Register new user (dev mode only)
- `POST /api/v1/auth/password-reset` - Request password reset
- `POST /api/v1/auth/password-reset-confirm` - Confirm password reset with token

### Users
- `GET /api/v1/users/` - List users
- `POST /api/v1/users/` - Create user
- `GET /api/v1/users/me` - Get current user
- `PUT /api/v1/users/me` - Update current user
- `GET /api/v1/users/{id}` - Get user by ID
- `PUT /api/v1/users/{id}` - Update user
- `DELETE /api/v1/users/{id}` - Delete user

### Plants
- `GET /api/v1/plants/` - List plants
- `POST /api/v1/plants/` - Create plant
- `GET /api/v1/plants/{id}` - Get plant by ID
- `PUT /api/v1/plants/{id}` - Update plant
- `DELETE /api/v1/plants/{id}` - Delete plant

### Plant Records
- `GET /api/v1/plant-records/` - List plant records (with filtering)
- `POST /api/v1/plant-records/` - Create plant record
- `GET /api/v1/plant-records/{id}` - Get plant record by ID
- `PATCH /api/v1/plant-records/{id}` - Update plant record
- `DELETE /api/v1/plant-records/{id}` - Delete plant record
- `GET /api/v1/plant-records/statistics` - Get plant record statistics
- `GET /api/v1/plant-records/available_columns` - Get available columns

### Formula Variables
- `GET /api/v1/formula-variables/` - List formula variables
- `POST /api/v1/formula-variables/` - Create formula variable
- `GET /api/v1/formula-variables/{name}` - Get formula variable by name
- `PUT /api/v1/formula-variables/{name}` - Update formula variable
- `DELETE /api/v1/formula-variables/{name}` - Delete formula variable
- `POST /api/v1/formula-variables/reset` - Reset all formula variables
- `POST /api/v1/formula-variables/reset/{name}` - Reset specific formula variable

### Chat
- `POST /api/v1/chat/` - Send chat message and get AI response

## Environment Variables

The application uses the following environment variables:

### General Configuration
- `PROJECT_NAME` - Name of the project
- `ENVIRONMENT` - Environment (development, staging, production)
- `API_V1_STR` - API version prefix
- `SECRET_KEY` - Secret key for JWT tokens
- `ALGORITHM` - JWT algorithm (default: HS256)
- `ACCESS_TOKEN_EXPIRE_MINUTES` - JWT token expiration time in minutes
- `REFRESH_TOKEN_EXPIRE_DAYS` - Refresh token expiration time in days

### Database Configuration
- `DATABASE_URL` - Database connection string
- `DB_USE_SSL` - Whether to use SSL for database connection

### CORS Configuration
- `BACKEND_CORS_ORIGINS` - List of allowed CORS origins

### Email Configuration
- `SMTP_SERVER` - SMTP server address
- `SMTP_PORT` - SMTP server port
- `SMTP_USER` - SMTP username
- `SMTP_PASSWORD` - SMTP password
- `EMAILS_FROM_EMAIL` - From email address
- `EMAILS_FROM_NAME` - From name
- `EMAILS_USE_TLS` - Use TLS for email

### Logging Configuration
- `LOG_LEVEL` - General logging level
- `SQL_LOG_LEVEL` - SQL-related logging level
- `LOG_DIR` - Directory to store log files in production

### External API Configuration
- `GROQ_API_KEY` - Groq API key for chat functionality

## License

This project is licensed under the MIT License. 