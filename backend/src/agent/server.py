from decimal import Decimal

from mcp.server.fastmcp import FastMCP

from src.db.models.congestion import CongestionEvent as CongestionDB
from src.db.models.facility import FacilityIssue as FacilityDB
from src.db.models.facility import FacilityType, IssueSeverity
from src.db.models.product import Product as ProductDB
from src.db.models.zone import Zone as ZoneDB
from src.integrations.dynatrace import DynatraceIntegration
from src.integrations.elastic import ElasticIntegration

mcp = FastMCP("RetailCortex Agent")


@mcp.tool()
async def search_products(query: str, max_price: float | None = None, store_id: str | None = None):
    """
    Semantic search across the retail product catalog.
    Use for: "find running shoes", "cheap sunglasses under 50", "Nike products in store X".
    Returns name, price, description, store, availability.
    """
    filters: dict = {}
    if max_price is not None:
        filters["price_max"] = Decimal(str(max_price))
    if store_id:
        filters["store_id"] = store_id

    results = await ElasticIntegration.search_products(query, filters)

    if not results:
        db_q = ProductDB.filter(name__icontains=query)
        if max_price is not None:
            db_q = db_q.filter(price__lte=Decimal(str(max_price)))
        if store_id:
            db_q = db_q.filter(store_id=store_id)
        products = await db_q.prefetch_related("store").limit(20)
        results = [
            {
                "id": str(p.id),
                "name": p.name,
                "price": float(p.price),
                "description": p.description,
                "in_stock": p.in_stock,
                "store": p.store.name if p.store else None,
            }
            for p in products
        ]

    return {"query": query, "count": len(results), "products": results}


@mcp.tool()
async def get_live_congestion(zone_name: str | None = None):
    """
    Get real-time crowd density from Dynatrace metrics + database congestion events.
    Use for: "is the food court busy?", "show me crowded zones", "live crowd map".
    Returns zone occupancy percentage and density level per zone.
    """
    zones = await ZoneDB.all()
    zone_map = {str(z.id): z for z in zones}

    # Try Dynatrace live metrics first
    dt_metrics = await DynatraceIntegration.get_congestion_metrics()

    if dt_metrics:
        result = []
        for m in dt_metrics:
            zid = m.get("zone_id") or ""
            zone = zone_map.get(zid)
            if zone_name and zone and zone_name.lower() not in zone.name.lower():
                continue
            result.append({
                "zone_id": zid,
                "zone_name": zone.name if zone else zid,
                "floor": zone.floor if zone else None,
                "capacity": zone.capacity if zone else None,
                "live_occupancy": m.get("latest_occupancy"),
                "level": m.get("level"),
                "source": "dynatrace",
            })
        if result:
            return {"zones": result, "source": "dynatrace"}

    # Fall back to latest DB congestion events
    latest_events = (
        await CongestionDB.all()
        .prefetch_related("zone")
        .order_by("-recorded_at")
        .limit(20)
    )
    seen_zones: set[str] = set()
    result = []
    for evt in latest_events:
        zid = str(evt.zone.id)  # type: ignore[union-attr]
        if zid in seen_zones:
            continue
        seen_zones.add(zid)
        zone = evt.zone
        if zone_name and zone_name.lower() not in zone.name.lower():
            continue
        pct = round((evt.occupancy / zone.capacity) * 100) if zone.capacity else 0
        result.append({
            "zone_id": zid,
            "zone_name": zone.name,
            "floor": zone.floor,
            "capacity": zone.capacity,
            "current_occupancy": evt.occupancy,
            "occupancy_pct": pct,
            "level": evt.level,
            "recorded_at": evt.recorded_at.isoformat(),
            "source": "database",
        })
    return {"zones": result, "source": "database"}


@mcp.tool()
async def get_store_health():
    """
    Operational health summary: open facility issues + active Dynatrace problems + congestion.
    Use for: "how is the mall doing?", "any problems right now?", "facility status".
    """
    issues = await FacilityDB.filter(status="open").all()
    latest_congestion = (
        await CongestionDB.all()
        .prefetch_related("zone")
        .order_by("-recorded_at")
        .limit(10)
    )
    dt_problems = await DynatraceIntegration.get_active_problems()

    seen: set[str] = set()
    congestion_summary = []
    for evt in latest_congestion:
        zid = str(evt.zone.id)  # type: ignore[union-attr]
        if zid in seen:
            continue
        seen.add(zid)
        congestion_summary.append({"zone": evt.zone.name, "level": evt.level})

    return {
        "open_facility_issues": len(issues),
        "issues": [
            {
                "title": i.title,
                "severity": i.severity,
                "type": i.facility_type,
                "status": i.status,
            }
            for i in issues
        ],
        "dynatrace_problems": len(dt_problems),
        "dt_problem_titles": [p.get("title") for p in dt_problems],
        "congestion_by_zone": congestion_summary,
    }


@mcp.tool()
async def report_issue(
    title: str,
    facility_type: str,
    description: str = "",
    severity: str = "medium",
):
    """
    Report a new facility issue to the system and Dynatrace.
    Use for: "the escalator is broken", "AC is out in Wing B", "lights flickering".
    facility_type options: elevator, escalator, hvac, lighting, plumbing, security, other
    severity options: low, medium, high, critical
    """
    try:
        ft = FacilityType(facility_type)
    except ValueError:
        ft = FacilityType.other
    try:
        sev = IssueSeverity(severity)
    except ValueError:
        sev = IssueSeverity.medium

    issue = await FacilityDB.create(
        title=title,
        facility_type=ft,
        description=description,
        severity=sev,
        status="open",
    )
    await DynatraceIntegration.report_facility_issue(
        issue_id=str(issue.id),
        facility_type=facility_type,
        severity=severity,
    )
    return {
        "status": "reported",
        "issue_id": str(issue.id),
        "title": title,
        "severity": severity,
    }


if __name__ == "__main__":
    mcp.run()
