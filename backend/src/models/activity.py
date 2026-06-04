import enum
from datetime import datetime
from typing import Any
from uuid import UUID

from pydantic import BaseModel


class ActivityEventType(enum.StrEnum):
    search = "search"
    feature_usage = "feature_usage"


class RecordActivityRequest(BaseModel):
    event_type: ActivityEventType
    query: str | None = None
    feature: str | None = None
    metadata: dict[str, Any] | None = None


class ActivityResponse(BaseModel):
    id: UUID
    event_type: ActivityEventType
    query: str | None = None
    feature: str | None = None
    metadata: dict[str, Any] | None = None
    created_at: datetime

    model_config = {"from_attributes": True}


class ActivityListResponse(BaseModel):
    items: list[ActivityResponse]
    total: int
    limit: int
    offset: int
