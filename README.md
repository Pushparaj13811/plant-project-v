# Plant Analytics & Metrics System

A comprehensive application for tracking, analyzing, and visualizing plant data with calculated metrics. The system provides advanced data management capabilities including bulk Excel uploads, custom formula calculations, and AI-powered analytics. Built with a FastAPI backend and a React/TypeScript frontend.

## Features

### Core Functionality
- **Plant Records Management**: Create, read, update, and delete plant data records with multiple input and calculated variables
- **Data Visualization**: Interactive charts and visual analytics for plant performance metrics using Chart.js and Recharts
- **Excel Data Import**: Bulk upload plant data directly from Excel spreadsheets using SheetJS
- **Formula Variable Management**: Customize calculation parameters for derived metrics
- **Calculation Engine**: Automatic computation of derived metrics based on configurable formulas

### User Experience
- **Responsive UI**: Modern interface that works seamlessly on desktop and mobile devices built with Tailwind CSS
- **Data Filtering**: Filter records by plant, date range, and other parameters
- **Data Export**: Export data to CSV for external analysis
- **Interactive Tables**: Sort, filter, and paginate through large datasets efficiently

### System Features
- **User Authentication**: Secure JWT-based authentication with access and refresh tokens
- **Role-Based Access Control**: Granular permissions based on user roles
- **Multi-Plant Support**: Manage data across multiple plant locations
- **AI-Powered Chat Assistant**: Ask questions about your data using natural language (powered by Groq API)

## Technology Stack

### Frontend
- **Framework**: React 19 with TypeScript
- **State Management**: Redux Toolkit with Redux Persist
- **Routing**: React Router v7
- **UI Components**: Custom components built with Radix UI primitives
- **Styling**: Tailwind CSS with class-variance-authority
- **HTTP Client**: Axios
- **Charting**: Chart.js, React-Chartjs-2, and Recharts
- **Date Handling**: date-fns
- **Icons**: Lucide React
- **Form Handling**: React Hook Form
- **Excel Processing**: SheetJS (xlsx)
- **Build Tool**: Vite

### Backend
- **Framework**: FastAPI
- **ORM**: SQLAlchemy 2.0 with Alembic for migrations
- **Database**: PostgreSQL
- **Authentication**: JWT with python-jose, passlib, and bcrypt
- **Validation**: Pydantic v2
- **AI Integration**: Groq Python client
- **Email**: aiosmtplib
- **Logging**: structlog

## Project Structure

This project is organized into two main components:

- **Backend**: FastAPI application with PostgreSQL database
- **Frontend**: React application built with Vite, TypeScript, and Tailwind CSS

## Getting Started

### Prerequisites

- Python 3.13.2
- Node.js (v20 or later)
- PostgreSQL database
- Groq API key (for chat functionality)

### Local Development Setup

#### Backend Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/plant-analytics-metrics.git
   cd plant-analytics-metrics
   ```

2. Set up a virtual environment:
   ```bash
   cd fastapi_backend
   python3.13 -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Create a `.env` file based on `.env.example`:
   ```
   DEBUG=True
   SECRET_KEY=your-development-secret-key
   DB_NAME=your-local-db-name
   DB_USER=your-local-db-user
   DB_PASSWORD=your-local-db-password
   DB_HOST=localhost
   DB_PORT=5432
   
   # Email Configuration
   SMTP_USER=your-email@gmail.com
   SMTP_PASSWORD=your-email-password
   SMTP_SERVER=smtp.gmail.com
   SMTP_PORT=587
   EMAILS_USE_TLS=True
   
   # Frontend URL
   FRONTEND_URL=http://localhost:5173
   
   # Groq API Key
   GROQ_API_KEY=your-groq-api-key
   ```

5. Apply migrations:
   ```bash
   alembic upgrade head
   ```

6. Start the development server:
   ```bash
   uvicorn app.main:app --reload
   ```

#### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file:
   ```
   VITE_API_URL=http://localhost:8000/api
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

5. Access the application at `http://localhost:5173`

## Usage Guide

### Viewing Records

1. Navigate to `/plant-data` to see the list of all plant records
2. Use the filters at the top to filter records by plant and date range
3. The table displays key information about each record, including both input and calculated values
4. Toggle between table and card views using the view switcher

### Adding Records

#### Manual Entry
1. Click the "Add Record" button on the Plant Data page
2. Fill in all required fields in the form:
   - Select a plant
   - Choose a date
   - Fill in all general information fields
   - Enter values for all input variables
3. Click "Create" to save the record
4. The calculated (dry) variables will be automatically computed on the server

#### Excel Bulk Upload
1. Click the Excel icon on the Plant Data page
2. Select a plant for the imported records
3. Upload an Excel file with plant data
4. Map Excel columns to system fields
5. Review the data preview
6. Click "Process Excel Data" to start the upload
7. View the success/failure summary after processing completes

### Editing Records

1. Click the edit icon (pencil) next to any record in the table
2. Update the fields as needed
3. Click "Update" to save your changes
4. The calculated values will be automatically updated based on your changes

### Deleting Records

1. Click the delete icon (trash) next to any record
2. Confirm the deletion when prompted

### Using the AI Chat Assistant

1. Navigate to the Chat page
2. Type your question about plant data
3. The AI assistant will provide answers based on the data in your system

## API Endpoints

The application exposes the following key API endpoints:

### Authentication
- `POST /api/auth/register/` - Register a new user
- `POST /api/auth/login/` - Login and get authentication tokens
- `POST /api/auth/token/refresh/` - Refresh authentication token

### Users and Plants
- `GET /api/users/` - Get users (admin only)
- `GET /api/plants/` - Get all plants
- `GET /api/roles/` - Get user roles

### Plant Records
- `GET /api/plant-data/plant-records/` - Get all plant records (with optional filtering)
- `GET /api/plant-data/plant-records/{id}/` - Get a specific plant record
- `POST /api/plant-data/plant-records/` - Create a new plant record
- `POST /api/plant-data/plant-records/bulk-upload/` - Upload multiple records from Excel
- `PATCH /api/plant-data/plant-records/{id}/` - Update a plant record
- `DELETE /api/plant-data/plant-records/{id}/` - Delete a plant record
- `GET /api/plant-data/plant-records/statistics/` - Get statistics for plant records
- `GET /api/plant-data/plant-records/available_columns/` - Get information about available columns

### Formula Variables
- `GET /api/plant-data/formula-variables/` - Get all formula variables
- `PATCH /api/plant-data/formula-variables/{id}/` - Update a formula variable
- `POST /api/plant-data/formula-variables/reset_all/` - Reset all formula variables to defaults

### Chat
- `POST /api/plant-data/chat/` - Send a message to the AI assistant

## Deployment

For detailed instructions on how to deploy this application to Azure, please refer to our comprehensive [Deployment Guide](./DEPLOYMENT_GUIDE.md).

The deployment guide covers:
- Preparing the application for production
- Setting up Azure resources
- Deploying backend and frontend
- CI/CD pipeline configuration
- Post-deployment setup
- Maintenance and monitoring
- Security best practices
- Troubleshooting common issues

## Troubleshooting

If you encounter any issues during development:

1. Check the browser console for error messages
2. Verify that the backend server is running
3. Make sure you're authenticated (the API requires authentication)
4. Check network requests in the browser developer tools to see API responses
5. Verify your environment variables are set correctly

For deployment-related issues, refer to the [Troubleshooting section in the Deployment Guide](./DEPLOYMENT_GUIDE.md#8-troubleshooting).

## License

This project is licensed under the MIT License.

## Contact

For questions and support, please contact the project maintainers. 