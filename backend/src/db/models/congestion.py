import enum

from tortoise import fields

from src.db.models.base import BaseModel


class CongestionLevel(str, enum.Enum):
    low = "low"
    medium = "medium"
    high = "high"
    critical = "critical"


class CongestionEvent(BaseModel):
    zone: fields.ForeignKeyRelation = fields.ForeignKeyField(
        "models.Zone", related_name="congestion_events", on_delete=fields.CASCADE
    )
    occupancy = fields.IntField()
    level = fields.CharEnumField(CongestionLevel)
    recorded_at = fields.DatetimeField(auto_now_add=True)

    class Meta:
        table = "congestion_events"
