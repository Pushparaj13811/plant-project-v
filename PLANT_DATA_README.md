# Plant Data App - Changes and Instructions

## Changes Made

1. **API Connection Fix**:
   - Updated the API endpoint in `frontend/src/services/plantDataApi.ts` to correctly use `/api/plant-data` prefix
   - This ensures proper communication with the backend API endpoints

2. **Standardized Toast Notifications**:
   - Created a utility file `frontend/src/utils/toast.ts` to standardize toast notifications across components
   - Updated components to use the standardized toast utility

3. **Added Missing Route**:
   - Added the missing route for editing plant records in `App.tsx`
   - The route `/plant-data/edit/:id` now correctly loads the AddPlantData component with edit mode enabled

## How to Use the Plant Data App

### Viewing Records

1. Navigate to `/plant-data` to see the list of all plant records
2. Use the filters at the top to filter records by plant and date range
3. The table displays key information about each record, including both input and calculated values

### Adding Records

1. Click the "Add Record" button on the Plant Data page
2. Fill in all required fields in the form:
   - Select a plant
   - Choose a date
   - Fill in all general information fields
   - Enter values for all input variables
3. Click "Create" to save the record
4. The calculated (dry) variables will be automatically computed on the server

### Editing Records

1. Click the edit icon (pencil) next to any record in the table
2. Update the fields as needed
3. Click "Update" to save your changes
4. The calculated values will be automatically updated based on your changes

### Deleting Records

1. Click the delete icon (trash) next to any record
2. Confirm the deletion when prompted

## API Endpoints

The app uses the following API endpoints:

- `GET /api/plant-data/plant-records/` - Get all plant records (with optional filtering)
- `GET /api/plant-data/plant-records/{id}/` - Get a specific plant record
- `POST /api/plant-data/plant-records/` - Create a new plant record
- `PATCH /api/plant-data/plant-records/{id}/` - Update a plant record
- `DELETE /api/plant-data/plant-records/{id}/` - Delete a plant record
- `GET /api/plant-data/plant-records/statistics/` - Get statistics for plant records
- `GET /api/plant-data/plant-records/available_columns/` - Get information about available columns

## Troubleshooting

If you encounter any issues:

1. Check the browser console for error messages
2. Verify that the backend server is running
3. Make sure you're authenticated (the API requires authentication)
4. Check network requests in the browser developer tools to see API responses 