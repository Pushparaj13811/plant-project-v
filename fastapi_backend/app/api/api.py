from fastapi import APIRouter

from app.api.endpoints import auth, users, plants, plant_records, formula_variables, chat

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(users.router, prefix="/management/users", tags=["users"])
api_router.include_router(plants.router, prefix="/plants", tags=["plants"])
api_router.include_router(plant_records.router, prefix="/plant-data/plant-records", tags=["plant-records"])
api_router.include_router(formula_variables.router, prefix="/formula-variables", tags=["formula-variables"])
api_router.include_router(chat.router, prefix="/chat", tags=["chat"])

# Add management routes
api_router.include_router(users.role_router, prefix="/management/roles", tags=["Management"])
api_router.include_router(plants.management_router, prefix="/management/plants", tags=["Management"]) 