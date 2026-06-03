import enum

from tortoise import fields

from src.db.models.base import BaseModel


class UserRole(str, enum.Enum):
    shopper = "shopper"
    operator = "operator"
    admin = "admin"


class User(BaseModel):
    clerk_id = fields.CharField(max_length=128, unique=True)
    email = fields.CharField(max_length=255, unique=True)
    role = fields.CharEnumField(UserRole, default=UserRole.shopper)

    class Meta:
        table = "users"
