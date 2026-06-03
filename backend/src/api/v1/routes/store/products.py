from __future__ import annotations

import csv
from io import StringIO
from typing import Any, Optional

from fastapi import APIRouter, HTTPException
from fastapi.responses import PlainTextResponse
from pydantic import BaseModel, Field

router = APIRouter(prefix="/products", tags=["products"])

REQUIRED_FIELDS = ["product_id", "name", "category", "brand", "price", "stock", "image_url"]
TEMPLATE = "product_id,name,category,brand,price,stock,image_url,description\n"

_IMPORTED_PRODUCTS: list[dict[str, Any]] = []
_IMPORT_COUNTER = 0


class CsvPayload(BaseModel):
    csv_content: str = Field(min_length=1)
    store_name: Optional[str] = None


class CsvError(BaseModel):
    row: int
    field: str
    code: str
    message: str


class CsvPreviewRow(BaseModel):
    row: int
    product_id: Optional[str] = None
    name: Optional[str] = None
    category: Optional[str] = None
    brand: Optional[str] = None
    price: Optional[float] = None
    stock: Optional[int] = None
    image_url: Optional[str] = None
    description: Optional[str] = None
    status: str


class CsvValidationResponse(BaseModel):
    total_rows: int
    valid_rows: int
    invalid_rows: int
    errors: list[CsvError]
    preview: list[CsvPreviewRow]


class ImportResponse(BaseModel):
    imported_count: int
    failed_count: int
    inventory_created: int
    categories_created: int
    search_index_updated: bool
    errors: list[CsvError]


class StoreSummaryResponse(BaseModel):
    total_products: int
    in_stock: int
    out_of_stock: int
    categories: int
    low_stock: int


def _normalize_row(row: dict[str, Optional[str]]) -> dict[str, str]:
    return {key.strip(): (value or "").strip() for key, value in row.items() if key is not None}


def _parse_csv(csv_content: str) -> tuple[list[dict[str, Any]], list[CsvError]]:
    if not csv_content.strip():
        raise HTTPException(status_code=400, detail="CSV content is empty")

    reader = csv.DictReader(StringIO(csv_content))
    headers = [header.strip() for header in (reader.fieldnames or [])]
    missing_headers = [field for field in REQUIRED_FIELDS if field not in headers]
    if missing_headers:
        return [], [
            CsvError(row=1, field=field, code="missing_header", message=f"Missing required column: {field}")
            for field in missing_headers
        ]

    rows: list[dict[str, Any]] = []
    errors: list[CsvError] = []
    seen_ids: set[str] = set()
    existing_ids = {product["product_id"] for product in _IMPORTED_PRODUCTS}

    for row_number, raw_row in enumerate(reader, start=2):
        row = _normalize_row(raw_row)
        row_errors: list[CsvError] = []
        product_id = row.get("product_id", "")
        name = row.get("name", "")
        category = row.get("category", "")
        brand = row.get("brand", "")
        image_url = row.get("image_url", "")
        description = row.get("description", "")

        if not product_id:
            row_errors.append(CsvError(row=row_number, field="product_id", code="required", message="Product ID missing"))
        elif product_id in seen_ids or product_id in existing_ids:
            row_errors.append(CsvError(row=row_number, field="product_id", code="duplicate", message="Duplicate Product ID"))
        else:
            seen_ids.add(product_id)

        if not name:
            row_errors.append(CsvError(row=row_number, field="name", code="required", message="Product Name missing"))
        if not category:
            row_errors.append(CsvError(row=row_number, field="category", code="required", message="Category missing"))
        if not brand:
            row_errors.append(CsvError(row=row_number, field="brand", code="required", message="Brand missing"))
        if not image_url:
            row_errors.append(CsvError(row=row_number, field="image_url", code="required", message="Image URL missing"))

        try:
            price = float(row.get("price", ""))
            if price < 0:
                raise ValueError
        except ValueError:
            row_errors.append(CsvError(row=row_number, field="price", code="invalid", message="Invalid price"))
            price = None

        try:
            stock = int(row.get("stock", ""))
            if stock < 0:
                raise ValueError
        except ValueError:
            row_errors.append(CsvError(row=row_number, field="stock", code="invalid", message="Invalid stock quantity"))
            stock = None

        rows.append(
            {
                "row": row_number,
                "product_id": product_id or None,
                "name": name or None,
                "category": category or None,
                "brand": brand or None,
                "price": price,
                "stock": stock,
                "image_url": image_url or None,
                "description": description or None,
                "status": "valid" if not row_errors else "invalid",
            }
        )
        errors.extend(row_errors)

    return rows, errors


@router.get("/template", response_class=PlainTextResponse)
async def download_template() -> str:
    return TEMPLATE


@router.post("/validate-csv", response_model=CsvValidationResponse)
async def validate_csv(payload: CsvPayload) -> CsvValidationResponse:
    rows, errors = _parse_csv(payload.csv_content)
    valid_rows = [row for row in rows if row["status"] == "valid"]
    return CsvValidationResponse(
        total_rows=len(rows),
        valid_rows=len(valid_rows),
        invalid_rows=len(rows) - len(valid_rows),
        errors=errors,
        preview=[CsvPreviewRow(**row) for row in rows[:10]],
    )


@router.post("/upload-csv", response_model=CsvValidationResponse)
async def upload_csv(payload: CsvPayload) -> CsvValidationResponse:
    return await validate_csv(payload)


@router.post("/import", response_model=ImportResponse)
async def import_products(payload: CsvPayload) -> ImportResponse:
    rows, errors = _parse_csv(payload.csv_content)
    valid_rows = [row for row in rows if row["status"] == "valid"]
    categories = {row["category"] for row in valid_rows if row.get("category")}

    # Create a logical "import store" id so frontend can list imported stores
    global _IMPORT_COUNTER
    _IMPORT_COUNTER += 1
    import_id = f"import-{_IMPORT_COUNTER}"
    # Prefer provided store name from payload when available
    import_name = (payload.store_name or f"CSV Import {_IMPORT_COUNTER}")

    for row in valid_rows:
        _IMPORTED_PRODUCTS.append(
            {
                "product_id": row["product_id"],
                "name": row["name"],
                "category": row["category"],
                "brand": row["brand"],
                "price": row["price"],
                "stock": row["stock"],
                "image_url": row["image_url"],
                "description": row["description"],
                "import_store_id": import_id,
                "import_store_name": import_name,
            }
        )

    return ImportResponse(
        imported_count=len(valid_rows),
        failed_count=len(rows) - len(valid_rows),
        inventory_created=len(valid_rows),
        categories_created=len(categories),
        search_index_updated=bool(valid_rows),
        errors=errors,
    )


@router.get("/summary", response_model=StoreSummaryResponse)
async def summary() -> StoreSummaryResponse:
    categories = {product["category"] for product in _IMPORTED_PRODUCTS if product.get("category")}
    in_stock = sum(1 for product in _IMPORTED_PRODUCTS if int(product["stock"] or 0) > 0)
    out_of_stock = sum(1 for product in _IMPORTED_PRODUCTS if int(product["stock"] or 0) == 0)
    low_stock = sum(1 for product in _IMPORTED_PRODUCTS if 0 < int(product["stock"] or 0) <= 5)

    return StoreSummaryResponse(
        total_products=len(_IMPORTED_PRODUCTS),
        in_stock=in_stock,
        out_of_stock=out_of_stock,
        categories=len(categories),
        low_stock=low_stock,
    )