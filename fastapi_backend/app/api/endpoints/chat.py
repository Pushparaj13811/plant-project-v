import os
from typing import Any, Dict, Optional, List
from datetime import date, datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from pydantic import BaseModel

from app.core.database import get_db
from app.crud import plant_record
from app.api.dependencies.auth import get_current_active_user
from app.models.user import User, RoleCategoryEnum
from app.core.config import settings
from groq import Groq
from dotenv import load_dotenv
from app.schemas.chat import ChatRequest, ChatResponse
import logging
import httpx

load_dotenv()

# Configure logging
logger = logging.getLogger(__name__)

router = APIRouter()

class Chat:
    def __init__(self, client: 'CustomGroqClient'):
        self.client = client
        self.completions = Completions(client)

class Completions:
    def __init__(self, client: 'CustomGroqClient'):
        self.client = client

    def create(self, messages: List[Dict[str, str]], model: str, temperature: float, max_tokens: int) -> Any:
        response = self.client._client.post(
            "/openai/v1/chat/completions",
            json={
                "messages": messages,
                "model": model,
                "temperature": temperature,
                "max_tokens": max_tokens
            }
        )
        response.raise_for_status()
        return response.json()

class CustomGroqClient:
    def __init__(self, api_key: str):
        self.api_key = api_key
        self._client = httpx.Client(
            base_url="https://api.groq.com",
            headers={"Authorization": f"Bearer {api_key}"}
        )
        self.chat = Chat(self)

@router.post("/", response_model=ChatResponse)
async def chat(
    request: ChatRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Chat endpoint that uses Groq API to generate responses based on plant data.
    """
    try:
        # Log user info for debugging
        logger.debug(f"Current user: {current_user.email}, Role: {current_user.role.category}, Plant ID: {current_user.plant_id}")
        
        # Check if user has access to the requested plant
        if current_user.role.category == RoleCategoryEnum.USER and request.plant_id != current_user.plant_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You don't have access to this plant's data"
            )
        
        # Get filtered records
        records = plant_record.get_filtered(
            db,
            plant_id=request.plant_id,
            start_date=request.start_date,
            end_date=request.end_date,
            limit=50  # Limit to 50 records to avoid context length issues
        )
        
        # Prepare context from records
        context = prepare_context(records)
        
        # Initialize Groq client with custom implementation
        try:
            client = CustomGroqClient(api_key=settings.GROQ_API_KEY)
        except Exception as e:
            logger.error(f"Failed to initialize Groq client: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to initialize AI service"
            )
        
        # Create system message with context
        system_message = {
            "role": "system",
            "content": f"""You are a helpful assistant for a plant data management system. 
            You have access to the following data context:
            {context}
            
            Please provide responses in the following markdown format with clear structure and styling:

            # 📊 Analysis Summary
            [Provide a brief 2-3 sentence summary of your analysis]

            ## 🔍 Key Findings
            - [List 3-5 key findings as bullet points]
            - [Use sub-bullets for detailed points]
            - [Include relevant metrics and numbers]

            ## 📈 Data Insights
            ### Production Metrics
            | Metric | Value | Trend |
            |--------|-------|--------|
            | [Metric 1] | [Value] | [Trend] |
            | [Metric 2] | [Value] | [Trend] |

            ### Quality Metrics
            | Metric | Value | Target |
            |--------|-------|--------|
            | [Metric 1] | [Value] | [Target] |
            | [Metric 2] | [Value] | [Target] |

            ## 💡 Recommendations
            1. [Priority 1 recommendation]
            2. [Priority 2 recommendation]
            3. [Priority 3 recommendation]

            ## ⚠️ Important Notes
            > [Any critical warnings or important context]

            ## 📝 Additional Context
            - [Supporting information]
            - [Technical details if relevant]

            Formatting Guidelines:
            1. Use emojis for section headers (📊, 🔍, 📈, 💡, ⚠️, 📝)
            2. Use tables for numerical data
            3. Use > for important warnings
            4. Use **bold** for key metrics
            5. Use `code` for technical terms
            6. Use - for bullet points
            7. Use 1. for numbered lists
            8. Keep sections concise and focused

            If the data is not sufficient to answer the query, please say so and explain what additional data would be helpful."""
        }
        
        # Prepare messages for Groq
        groq_messages = [
            system_message,
            {"role": "user", "content": request.message}
        ]
        
        # Call Groq API
        chat_completion = client.chat.completions.create(
            messages=groq_messages,
            model="llama-3.3-70b-versatile",
            temperature=0.7,
            max_tokens=1000
        )
        
        response_message = chat_completion["choices"][0]["message"]["content"]
        
        # Ensure the response is properly formatted markdown
        if not response_message.startswith("#"):
            response_message = f"# 📊 Analysis\n\n{response_message}"
        
        return ChatResponse(
            message=response_message,
            data=None
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in chat endpoint: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while processing your request"
        )

def prepare_context(records: List) -> str:
    """Prepare context from plant records for the AI"""
    if not records:
        return "No data available for the specified criteria."
    
    # Calculate basic statistics
    stats = {
        'total_records': len(records),
        'date_range': {
            'min': min(record.date for record in records),
            'max': max(record.date for record in records),
        },
    }
    
    # Format the basic statistics
    context = f"""
    Total Records: {stats['total_records']}
    Date Range: {stats['date_range']['min']} to {stats['date_range']['max']}
    
    Individual Records:
    """
    
    # Add all records data
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
    
    return context 