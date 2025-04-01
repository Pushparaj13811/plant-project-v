from fastapi import APIRouter

from app.api.endpoints import auth, users, plants, plant_records, formula_variables, chat

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(users.router, prefix="/users", tags=["Users"])
api_router.include_router(plants.router, prefix="/plants", tags=["Plants"])
api_router.include_router(plant_records.router, prefix="/plant-records", tags=["Plant Records"])
api_router.include_router(formula_variables.router, prefix="/formula-variables", tags=["Formula Variables"])
api_router.include_router(chat.router, prefix="/chat", tags=["Chat"])

# Add management route for roles
api_router.include_router(users.role_router, prefix="/management/roles", tags=["Management"]) 