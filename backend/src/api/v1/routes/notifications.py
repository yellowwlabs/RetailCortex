from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status

from pydantic import BaseModel

from src.api.deps import get_db_user
from src.db.models.notification import Notification
from src.db.models.user import User
from src.models.notification import (
    MarkReadRequest,
    NotificationListResponse,
    NotificationResponse,
)

router = APIRouter(prefix="/notifications", tags=["notifications"])


class BroadcastNotificationRequest(BaseModel):
    title: str
    body: str


def _to_response(row: Notification) -> NotificationResponse:
    return NotificationResponse(
        id=row.id,
        title=row.title,
        body=row.body,
        is_read=row.is_read,
        created_at=row.created_at,
    )


@router.get("/me", response_model=NotificationListResponse)
async def get_my_notifications(
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db_user: User = Depends(get_db_user),
):
    # Fetch user specific notifications, plus public notifications (where user is null)
    qs = Notification.filter(user=db_user)

    total = await qs.count()
    unread_count = await qs.filter(is_read=False).count()

    rows = await qs.order_by("-created_at").offset(offset).limit(limit)

    return NotificationListResponse(
        items=[_to_response(r) for r in rows],
        total=total,
        unread_count=unread_count,
    )


@router.post("/me/read", response_model=dict)
async def mark_notifications_as_read(
    body: MarkReadRequest,
    db_user: User = Depends(get_db_user),
):
    qs = Notification.filter(user=db_user, is_read=False)
    if body.notification_ids:
        qs = qs.filter(id__in=body.notification_ids)

    updated_count = await qs.update(is_read=True)
    return {"success": True, "marked_count": updated_count}


@router.post("/me/read/{notification_id}", response_model=NotificationResponse)
async def mark_single_notification_as_read(
    notification_id: UUID,
    db_user: User = Depends(get_db_user),
):
    row = await Notification.get_or_none(id=notification_id, user=db_user)
    if not row:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found",
        )
    row.is_read = True
    await row.save()
    return _to_response(row)


@router.delete("/me/{notification_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_notification(
    notification_id: UUID,
    db_user: User = Depends(get_db_user),
):
    row = await Notification.get_or_none(id=notification_id, user=db_user)
    if not row:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found",
        )
    await row.delete()


@router.post("/me/test", response_model=NotificationResponse, status_code=status.HTTP_201_CREATED)
async def create_test_notification(
    title: str | None = Query(None),
    body: str | None = Query(None),
    db_user: User = Depends(get_db_user),
):
    # Dummy list of templates
    import random

    templates = [
        {
            "title": "Zara Proximity Alert",
            "body": "You are near Zara! Claim your exclusive 15% discount code now inside Offers.",
        },
        {
            "title": "Sleek Summer Sale",
            "body": "H&M has launched a limited-edition Summer Collection discount code. 20% off footwear!",
        },
        {
            "title": "Crowd Density Warning",
            "body": "Live congestion sensors indicate high queues in Food Court. Try exploring Retail stores first.",
        },
        {
            "title": "Welcome to RetailCortex",
            "body": "Explore stores in real-time, search products across floors, and get targeted campaign deals.",
        },
    ]
    template = random.choice(templates)

    row = await Notification.create(
        user=db_user, title=title or template["title"], body=body or template["body"], is_read=False
    )
    return _to_response(row)


@router.post("/broadcast", status_code=status.HTTP_201_CREATED)
async def broadcast_notification(
    body: BroadcastNotificationRequest,
):
    users = await User.all()
    for u in users:
        await Notification.create(
            user=u,
            title=body.title,
            body=body.body,
            is_read=False,
        )
    return {"success": True, "recipients_count": len(users)}
