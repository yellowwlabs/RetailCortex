from src.config import settings

_db_url = settings.database_url.replace("postgresql://", "postgres://", 1)

TORTOISE_ORM = {
    "connections": {"default": _db_url},
    "apps": {
        "models": {
            "models": ["src.db.models", "aerich.models"],
            "default_connection": "default",
        }
    },
    "use_tz": True,
}
