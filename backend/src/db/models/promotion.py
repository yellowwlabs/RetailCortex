from tortoise import fields

from src.db.models.base import BaseModel


class Promotion(BaseModel):
    store: fields.ForeignKeyRelation = fields.ForeignKeyField(
        "models.Store", related_name="promotions", on_delete=fields.CASCADE
    )
    title = fields.CharField(max_length=255)
    description = fields.TextField(default="")
    discount_pct = fields.DecimalField(max_digits=5, decimal_places=2)
    starts_at = fields.DatetimeField()
    ends_at = fields.DatetimeField()
    is_active = fields.BooleanField(default=True)

    class Meta:
        table = "promotions"
