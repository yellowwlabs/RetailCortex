import enum
from typing import Optional

from tortoise import fields

from src.db.models.base import BaseModel


class IssueSeverity(str, enum.Enum):
    low = "low"
    medium = "medium"
    high = "high"
    critical = "critical"


class IssueStatus(str, enum.Enum):
    open = "open"
    in_progress = "in_progress"
    resolved = "resolved"


class FacilityIssue(BaseModel):
    zone: Optional[fields.ForeignKeyRelation] = fields.ForeignKeyField(
        "models.Zone", related_name="facility_issues", on_delete=fields.SET_NULL, null=True
    )
    title = fields.CharField(max_length=255)
    description = fields.TextField(default="")
    severity = fields.CharEnumField(IssueSeverity, default=IssueSeverity.medium)
    status = fields.CharEnumField(IssueStatus, default=IssueStatus.open)
    reported_at = fields.DatetimeField(auto_now_add=True)
    resolved_at = fields.DatetimeField(null=True)

    class Meta:
        table = "facility_issues"
