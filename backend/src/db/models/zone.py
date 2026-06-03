from tortoise import fields

from src.db.models.base import BaseModel


class Zone(BaseModel):
    name = fields.CharField(max_length=128)
    floor = fields.IntField()
    capacity = fields.IntField(description="Max safe occupancy")

    class Meta:
        table = "zones"
