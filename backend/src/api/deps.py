from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from src.core.clerk import verify_clerk_token
from src.db.models.user import User
from src.db.models.user import UserRole as DBUserRole
from src.models.user import ClerkUser, UserRole

_bearer = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(_bearer),
) -> ClerkUser:
    try:
        payload = await verify_clerk_token(credentials.credentials)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(exc),
            headers={"WWW-Authenticate": "Bearer"},
        ) from exc

    clerk_id = payload["sub"]
    email = payload.get("email", "")

    db_user, _ = await User.get_or_create(
        clerk_id=clerk_id,
        defaults={"email": email, "role": DBUserRole.user},
    )

    return ClerkUser(
        id=clerk_id,
        email=email,
        first_name=payload.get("first_name"),
        last_name=payload.get("last_name"),
        image_url=payload.get("image_url"),
        role=UserRole(db_user.role),
    )


def require_role(*roles: UserRole):
    async def _dep(user: ClerkUser = Depends(get_current_user)) -> ClerkUser:
        if user.role not in roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions",
            )
        return user

    return _dep


require_store_admin = require_role(UserRole.store_admin, UserRole.super_admin)
require_super_admin = require_role(UserRole.super_admin)
