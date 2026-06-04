import enum
from datetime import datetime
from typing import Any, Optional
from uuid import UUID

from pydantic import BaseModel


class ActivityEventType(str, enum.Enum):
    search = "search"
    feature_usage = "feature_usage"


class RecordActivityRequest(BaseModel):
    event_type: ActivityEventType
    query: Optional[str] = None
    feature: Optional[str] = None
    metadata: Optional[dict[str, Any]] = None


class ActivityResponse(BaseModel):
    id: UUID
    event_type: ActivityEventType
    query: Optional[str] = None
    feature: Optional[str] = None
    metadata: Optional[dict[str, Any]] = None
    created_at: datetime

    model_config = {"from_attributes": True}


class ActivityListResponse(BaseModel):
    items: list[ActivityResponse]
    total: int
    limit: int
    offset: int
