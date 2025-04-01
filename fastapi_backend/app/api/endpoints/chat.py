import os
from typing import Any, Dict, Optional
from datetime import date

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from pydantic import BaseModel

from app.core.database import get_db
from app.crud import plant_record
from app.api.dependencies.auth import get_current_active_user
from app.models.user import User
from app.core.config import settings

try:
    from groq import Groq
    GROQ_AVAILABLE = True
except ImportError:
    GROQ_AVAILABLE = False

router = APIRouter()

class ChatRequest(BaseModel):
    message: str
    plant_id: Optional[int] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None

class ChatResponse(BaseModel):
    message: str
    data: Optional[Dict] = None

@router.post("/", response_model=ChatResponse)
async def chat(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    chat_request: ChatRequest,
) -> Any:
    """
    Handle chat requests using Groq API
    """
    if not GROQ_AVAILABLE:
        raise HTTPException(
            status_code=status.HTTP_501_NOT_IMPLEMENTED,
            detail="Groq API is not available. Please install the Groq client with 'pip install groq'."
        )
    
    # Check for API key in settings
    if not settings.GROQ_API_KEY:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="GROQ_API_KEY environment variable is not set."
        )

    # Create Groq client
    client = Groq(api_key=settings.GROQ_API_KEY)
    
    # Filter records based on request parameters
    records = plant_record.get_filtered(
        db,
        plant_id=chat_request.plant_id,
        start_date=chat_request.start_date,
        end_date=chat_request.end_date,
        skip=0,
        limit=50  # Limit to 50 records like in Django
    )
    
    # Get count of filtered records
    count = plant_record.get_count(
        db,
        plant_id=chat_request.plant_id,
        start_date=chat_request.start_date,
        end_date=chat_request.end_date
    )
    
    # Prepare context
    context = prepare_context(records, count)
    
    # Create system message with context
    system_message = {
        "role": "system",
        "content": f"""You are a helpful assistant for a plant data management system. 
        You have access to the following data context:
        {context}
        
        Please provide accurate and helpful responses based on this data. 
        If the data is not sufficient to answer the query, please say so."""
    }
    
    # Prepare messages for Groq
    groq_messages = [
        system_message,
        {"role": "user", "content": chat_request.message}
    ]
    
    try:
        # Call Groq API
        chat_completion = client.chat.completions.create(
            messages=groq_messages,
            model="llama-3.3-70b-versatile",
            temperature=0.7,
            max_tokens=1000
        )
        
        response_message = chat_completion.choices[0].message.content
        
        return ChatResponse(
            message=response_message,
            data=None
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate response: {str(e)}"
        )

def prepare_context(records, count):
    """Prepare context from the records for the AI"""
    if count == 0:
        return "No data available for the specified criteria."
    
    # Format the basic statistics
    if records:
        min_date = min(record.date for record in records)
        max_date = max(record.date for record in records)
    else:
        min_date = "N/A"
        max_date = "N/A"
    
    context = f"""
    Total Records: {count}
    Date Range: {min_date} to {max_date}
    
    Individual Records:
    """
    
    # Add records data
    for i, record in enumerate(records, 1):
        context += f"""
    Record {i}:
    - Date: {record.date}
    - Code: {record.code}
    - Product: {record.product}
    - Truck No: {record.truck_no}
    - Bill No: {record.bill_no}
    - Party Name: {record.party_name}
    - Rate: {record.rate}
    - MV: {record.mv}
    - Oil: {record.oil}
    - Fiber: {record.fiber}
    - Starch: {record.starch}
    - Maize Rate: {record.maize_rate}
    - DM: {record.dm}
    - Rate on DM: {record.rate_on_dm}
    - Oil Value: {record.oil_value}
    - Net (wo Oil & Fiber): {record.net_wo_oil_fiber}
    - Starch Per Point: {record.starch_per_point}
    - Starch Value: {record.starch_value}
    - Grain: {record.grain}
    - DOC: {record.doc}
    """
    
    if count > 50:
        context += f"\n(Showing 50 of {count} total records)"
    
    return context 