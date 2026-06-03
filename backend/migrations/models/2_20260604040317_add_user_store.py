from tortoise import BaseDBAsyncClient

RUN_IN_TRANSACTION = True


async def upgrade(db: BaseDBAsyncClient) -> str:
    return """
        ALTER TABLE "users" ADD "store_id" UUID;
        ALTER TABLE "users" ADD CONSTRAINT "fk_users_stores_b057a982" FOREIGN KEY ("store_id") REFERENCES "stores" ("id") ON DELETE SET NULL;"""


async def downgrade(db: BaseDBAsyncClient) -> str:
    return """
        ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "fk_users_stores_b057a982";
        ALTER TABLE "users" DROP COLUMN "store_id";"""


MODELS_STATE = (
    "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"
    "XNkuTgt4Y6sfXp7+B/e8pK8="
)
