from typing import List

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    clerk_jwks_url: str
    clerk_secret_key: str = ""
    allowed_origins: List[str] = ["http://localhost:3000"]

    database_url: str


settings = Settings()
