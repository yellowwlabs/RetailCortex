from __future__ import annotations

from typing import Optional

from fastapi import APIRouter
from pydantic import BaseModel

from src.db.models.store import Store
from src.api.v1.routes.store.products import _IMPORTED_PRODUCTS

router = APIRouter(prefix="/stores", tags=["stores"])


class StoreZoneSummary(BaseModel):
    id: str
    name: str
    floor: int


class StoreCategorySummary(BaseModel):
    id: str
    name: str


class StoreListItem(BaseModel):
    id: str
    name: str
    description: str
    floor: int
    unit_number: str
    zone: Optional[StoreZoneSummary] = None
    category: Optional[StoreCategorySummary] = None


@router.get("", response_model=list[StoreListItem])
async def list_stores() -> list[StoreListItem]:
    stores = await Store.all().select_related("zone", "category")
    items: list[StoreListItem] = []

    for store in stores:
        zone = getattr(store, "zone", None)
        category = getattr(store, "category", None)

        items.append(
            StoreListItem(
                id=str(store.id),
                name=store.name,
                description=store.description,
                floor=store.floor,
                unit_number=store.unit_number,
                zone=(
                    StoreZoneSummary(
                        id=str(zone.id),
                        name=zone.name,
                        floor=zone.floor,
                    )
                    if zone
                    else None
                ),
                category=(
                    StoreCategorySummary(
                        id=str(category.id),
                        name=category.name,
                    )
                    if category
                    else None
                ),
            )
        )

    # Include any in-memory imported stores (from CSV imports)
    # Group imported products by import_store_id
    imported_by_store: dict[str, list[dict]] = {}
    for p in _IMPORTED_PRODUCTS:
        sid = p.get("import_store_id")
        if not sid:
            continue
        imported_by_store.setdefault(sid, []).append(p)

    for sid, products in imported_by_store.items():
        name = products[0].get("import_store_name") or sid
        items.append(
            StoreListItem(
                id=sid,
                name=name,
                description=f"Imported {len(products)} products",
                floor=0,
                unit_number="",
                zone=None,
                category=None,
            )
        )

    return items