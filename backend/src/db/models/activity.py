import enum

from tortoise import fields

from src.db.models.base import BaseModel


class ActivityEventType(enum.StrEnum):
    search = "search"
    feature_usage = "feature_usage"


class UserActivity(BaseModel):
    user: fields.ForeignKeyRelation = fields.ForeignKeyField(  # type: ignore
        "models.User", related_name="activities", on_delete=fields.CASCADE
    )
    event_type = fields.CharEnumField(ActivityEventType)
    query = fields.CharField(max_length=512, null=True)
    feature = fields.CharField(max_length=128, null=True)
    metadata = fields.JSONField(null=True)

    class Meta:
        table = "user_activities"
