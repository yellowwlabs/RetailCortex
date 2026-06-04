from tortoise import BaseDBAsyncClient

RUN_IN_TRANSACTION = True


async def upgrade(db: BaseDBAsyncClient) -> str:
    return """
        CREATE TABLE IF NOT EXISTS "user_notifications" (
    "id" UUID NOT NULL PRIMARY KEY,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "title" VARCHAR(255) NOT NULL,
    "body" VARCHAR(1024) NOT NULL,
    "is_read" BOOL NOT NULL DEFAULT False,
    "user_id" UUID REFERENCES "users" ("id") ON DELETE CASCADE
);"""


async def downgrade(db: BaseDBAsyncClient) -> str:
    return """
        DROP TABLE IF EXISTS "user_notifications";"""


MODELS_STATE = (
    "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"
)
