from typing import Optional

from pydantic import BaseModel


class Token(BaseModel):
    access_token: str
    token_type: str
    refresh_token: Optional[str] = None


class TokenPayload(BaseModel):
    sub: Optional[str] = None
    exp: Optional[int] = None
    refresh: Optional[bool] = None


class TokenData(BaseModel):
    email: Optional[str] = None
    refresh: Optional[bool] = None 