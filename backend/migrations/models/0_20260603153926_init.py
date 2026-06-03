from tortoise import BaseDBAsyncClient

RUN_IN_TRANSACTION = True


async def upgrade(db: BaseDBAsyncClient) -> str:
    return """
        CREATE TABLE IF NOT EXISTS "categories" (
    "id" UUID NOT NULL PRIMARY KEY,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "name" VARCHAR(128) NOT NULL,
    "slug" VARCHAR(128) NOT NULL UNIQUE
);
CREATE TABLE IF NOT EXISTS "users" (
    "id" UUID NOT NULL PRIMARY KEY,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "clerk_id" VARCHAR(128) NOT NULL UNIQUE,
    "email" VARCHAR(255) NOT NULL UNIQUE,
    "role" VARCHAR(8) NOT NULL DEFAULT 'shopper'
);
COMMENT ON COLUMN "users"."role" IS 'shopper: shopper\noperator: operator\nadmin: admin';
CREATE TABLE IF NOT EXISTS "zones" (
    "id" UUID NOT NULL PRIMARY KEY,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "name" VARCHAR(128) NOT NULL,
    "floor" INT NOT NULL,
    "capacity" INT NOT NULL
);
COMMENT ON COLUMN "zones"."capacity" IS 'Max safe occupancy';
CREATE TABLE IF NOT EXISTS "congestion_events" (
    "id" UUID NOT NULL PRIMARY KEY,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "occupancy" INT NOT NULL,
    "level" VARCHAR(8) NOT NULL,
    "recorded_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "zone_id" UUID NOT NULL REFERENCES "zones" ("id") ON DELETE CASCADE
);
COMMENT ON COLUMN "congestion_events"."level" IS 'low: low\nmedium: medium\nhigh: high\ncritical: critical';
CREATE TABLE IF NOT EXISTS "facility_issues" (
    "id" UUID NOT NULL PRIMARY KEY,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT NOT NULL,
    "facility_type" VARCHAR(9) NOT NULL DEFAULT 'other',
    "severity" VARCHAR(8) NOT NULL DEFAULT 'medium',
    "status" VARCHAR(11) NOT NULL DEFAULT 'open',
    "reported_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolved_at" TIMESTAMPTZ,
    "zone_id" UUID REFERENCES "zones" ("id") ON DELETE SET NULL
);
COMMENT ON COLUMN "facility_issues"."facility_type" IS 'elevator: elevator\nescalator: escalator\nhvac: hvac\nlighting: lighting\nplumbing: plumbing\nother: other';
COMMENT ON COLUMN "facility_issues"."severity" IS 'low: low\nmedium: medium\nhigh: high\ncritical: critical';
COMMENT ON COLUMN "facility_issues"."status" IS 'open: open\nin_progress: in_progress\nresolved: resolved';
CREATE TABLE IF NOT EXISTS "stores" (
    "id" UUID NOT NULL PRIMARY KEY,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT NOT NULL,
    "floor" INT NOT NULL,
    "unit_number" VARCHAR(32) NOT NULL,
    "category_id" UUID REFERENCES "categories" ("id") ON DELETE SET NULL,
    "zone_id" UUID NOT NULL REFERENCES "zones" ("id") ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS "products" (
    "id" UUID NOT NULL PRIMARY KEY,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "in_stock" BOOL NOT NULL DEFAULT True,
    "tags" JSONB NOT NULL,
    "metadata" JSONB NOT NULL,
    "category_id" UUID REFERENCES "categories" ("id") ON DELETE SET NULL,
    "store_id" UUID NOT NULL REFERENCES "stores" ("id") ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS "promotions" (
    "id" UUID NOT NULL PRIMARY KEY,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT NOT NULL,
    "discount_pct" DECIMAL(5,2) NOT NULL,
    "starts_at" TIMESTAMPTZ NOT NULL,
    "ends_at" TIMESTAMPTZ NOT NULL,
    "is_active" BOOL NOT NULL DEFAULT True,
    "store_id" UUID NOT NULL REFERENCES "stores" ("id") ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS "aerich" (
    "id" SERIAL NOT NULL PRIMARY KEY,
    "version" VARCHAR(255) NOT NULL,
    "app" VARCHAR(100) NOT NULL,
    "content" JSONB NOT NULL
);"""


async def downgrade(db: BaseDBAsyncClient) -> str:
    return """
        """


MODELS_STATE = (
    "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"
)
