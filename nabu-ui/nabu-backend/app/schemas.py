from pydantic import BaseModel, Field
from typing import Optional, Dict, Any

class SaveContentRequest(BaseModel):
    content: str
    metadata: Optional[Dict[str, Any]] = Field(default_factory=dict)

class SaveContentResponse(BaseModel):
    key: str
    uri: str

class PresignRequest(BaseModel):
    scribe_id: str
    filename: str
    prefix: str = "uploads"  # logical folder

class PresignResponse(BaseModel):
    key: str
    url: str
    fields: dict

class ListItemsResponse(BaseModel):
    items: list[dict]
