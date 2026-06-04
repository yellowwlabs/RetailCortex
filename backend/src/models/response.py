from datetime import UTC, datetime
from typing import TypeVar
from uuid import uuid4

from pydantic import BaseModel, Field

T = TypeVar("T")


class SuccessResponse[T](BaseModel):
    request_id: str = Field(default_factory=lambda: str(uuid4()))
    timestamp: datetime = Field(default_factory=lambda: datetime.now(UTC))
    message: str = "success"
    data: T


class ErrorDetail(BaseModel):
    code: str
    field: str | None = None


class FailedResponse(BaseModel):
    request_id: str = Field(default_factory=lambda: str(uuid4()))
    timestamp: datetime = Field(default_factory=lambda: datetime.now(UTC))
    message: str
    errors: list[ErrorDetail] | None = None


def ok[T](data: T, message: str = "success") -> SuccessResponse[T]:
    return SuccessResponse(data=data, message=message)


def fail(message: str, errors: list[ErrorDetail] | None = None) -> FailedResponse:
    return FailedResponse(message=message, errors=errors)
