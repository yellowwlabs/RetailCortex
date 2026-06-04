import enum

from pydantic import BaseModel


class UserRole(enum.StrEnum):
    user = "user"
    store_admin = "store_admin"
    super_admin = "super_admin"


class ClerkUser(BaseModel):
    id: str
    email: str
    first_name: str | None = None
    last_name: str | None = None
    image_url: str | None = None
    role: UserRole = UserRole.user
    store_id: str | None = None
    store_name: str | None = None
