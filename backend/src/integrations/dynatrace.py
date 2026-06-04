import logging

import httpx

from src.config import settings

logger = logging.getLogger(__name__)

_SEVERITY_MAP = {"low": "INFO", "medium": "WARN", "high": "ERROR", "critical": "AVAILABILITY"}


def _headers() -> dict[str, str]:
    return {
        "Authorization": f"Api-Token {settings.dynatrace_token}",
        "Content-Type": "application/json",
    }


class DynatraceIntegration:
    @staticmethod
    async def report_congestion(zone_id: str, occupancy: int, level: str) -> None:
        if not settings.dynatrace_url or not settings.dynatrace_token:
            logger.debug("Dynatrace not configured; skipping congestion report for zone %s", zone_id)
            return
        metric_line = (
            f"retailcortex.congestion.occupancy,zone_id={zone_id},level={level} {occupancy}"
        )
        async with httpx.AsyncClient() as client:
            resp = await client.post(
                f"{settings.dynatrace_url}/api/v2/metrics/ingest",
                headers=_headers() | {"Content-Type": "text/plain; charset=utf-8"},
                content=metric_line.encode(),
                timeout=10,
            )
            if resp.status_code not in (200, 202):
                logger.warning("Dynatrace metric ingest failed: %s %s", resp.status_code, resp.text)

    @staticmethod
    async def get_congestion_metrics(zone_id: str | None = None) -> list[dict]:
        if not settings.dynatrace_url or not settings.dynatrace_token:
            return []
        selector = "retailcortex.congestion.occupancy"
        if zone_id:
            selector += f":filter(eq(zone_id,{zone_id}))"
        params = {
            "metricSelector": selector,
            "resolution": "5m",
            "from": "now-1h",
        }
        try:
            async with httpx.AsyncClient() as client:
                resp = await client.get(
                    f"{settings.dynatrace_url}/api/v2/metrics/query",
                    headers=_headers(),
                    params=params,
                    timeout=10,
                )
                if resp.status_code != 200:
                    logger.warning("Dynatrace metric query failed: %s", resp.status_code)
                    return []
                results = []
                for series in resp.json().get("result", []):
                    for data_point in series.get("data", []):
                        values = [v for v in data_point.get("values", []) if v is not None]
                        results.append({
                            "zone_id": data_point.get("dimensionMap", {}).get("zone_id"),
                            "level": data_point.get("dimensionMap", {}).get("level"),
                            "latest_occupancy": values[-1] if values else None,
                            "timestamps": data_point.get("timestamps", []),
                        })
                return results
        except Exception as exc:
            logger.error("Dynatrace congestion query error: %s", exc)
            return []

    @staticmethod
    async def report_facility_issue(issue_id: str, facility_type: str, severity: str) -> None:
        if not settings.dynatrace_url or not settings.dynatrace_token:
            logger.debug("Dynatrace not configured; skipping facility issue %s", issue_id)
            return
        payload = {
            "eventType": "CUSTOM_ALERT",
            "title": f"RetailCortex Facility Issue: {facility_type}",
            "entitySelector": "type(SERVICE),tag(retailcortex)",
            "properties": {
                "issue_id": issue_id,
                "facility_type": facility_type,
                "severity": severity,
                "dt.event.severity": _SEVERITY_MAP.get(severity, "WARN"),
            },
        }
        async with httpx.AsyncClient() as client:
            resp = await client.post(
                f"{settings.dynatrace_url}/api/v2/events/ingest",
                headers=_headers(),
                json=payload,
                timeout=10,
            )
            if resp.status_code not in (200, 201):
                logger.warning("Dynatrace event ingest failed: %s %s", resp.status_code, resp.text)

    @staticmethod
    async def get_active_problems() -> list[dict]:
        if not settings.dynatrace_url or not settings.dynatrace_token:
            return []
        try:
            async with httpx.AsyncClient() as client:
                resp = await client.get(
                    f"{settings.dynatrace_url}/api/v2/problems",
                    headers=_headers(),
                    params={"problemSelector": "status(OPEN)", "pageSize": 10},
                    timeout=10,
                )
                if resp.status_code != 200:
                    return []
                return resp.json().get("problems", [])
        except Exception as exc:
            logger.error("Dynatrace problem feed error: %s", exc)
            return []
