from datetime import datetime, timezone
from typing import Generic, List, Optional, TypeVar
from uuid import uuid4

from pydantic import BaseModel, Field

T = TypeVar("T")


class SuccessResponse(BaseModel, Generic[T]):
    request_id: str = Field(default_factory=lambda: str(uuid4()))
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    message: str = "success"
    data: T


class ErrorDetail(BaseModel):
    code: str
    field: Optional[str] = None


class FailedResponse(BaseModel):
    request_id: str = Field(default_factory=lambda: str(uuid4()))
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    message: str
    errors: Optional[List[ErrorDetail]] = None


def ok(data: T, message: str = "success") -> SuccessResponse[T]:
    return SuccessResponse(data=data, message=message)


def fail(message: str, errors: Optional[List[ErrorDetail]] = None) -> FailedResponse:
    return FailedResponse(message=message, errors=errors)
