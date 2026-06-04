from tortoise import fields

from src.db.models.base import BaseModel


class Notification(BaseModel):
    user = fields.ForeignKeyField(
        "models.User", related_name="notifications", on_delete=fields.CASCADE, null=True
    )
    title = fields.CharField(max_length=255)
    body = fields.CharField(max_length=1024)
    is_read = fields.BooleanField(default=False)

    class Meta:
        table = "user_notifications"
