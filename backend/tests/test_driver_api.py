import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models import DeliveryEntry, Item

@pytest.mark.asyncio
async def test_idempotent_delivery_entry(
    client: AsyncClient, 
    driver_token: str,
    db: AsyncSession,
):
    headers = {"Authorization": f"Bearer {driver_token}"}

    # 1. Create an item via admin API or DB directly to test against
    item = Item(
        name="19kg Commercial",
        category="commercial",
        price=2000.0,
        initial_full=100,
        initial_empty=10,
        current_full=100,
        current_empty=10,
        is_active=True,
    )
    db.add(item)
    await db.commit()
    await db.refresh(item)

    # 2. Make delivery entry with idempotency key
    payload = {
        "item_id": str(item.id),
        "full_delivered": 5,
        "empty_received": 5,
        "cash_collected": 10000.0,
        "upi_collected": 0.0,
        "adhoc_buyer_name": "Walk-in John",
    }
    idem_key = "test-idempotency-key-123"

    response1 = await client.post(
        "/api/v1/driver/entries", 
        json=payload, 
        headers={**headers, "X-Idempotency-Key": idem_key}
    )
    assert response1.status_code == 200
    data1 = response1.json()
    assert data1["idempotency_key"] == idem_key
    assert data1["total_bill_amount"] == 10000.0
    
    # 3. Repeat the exact same request
    response2 = await client.post(
        "/api/v1/driver/entries", 
        json=payload, 
        headers={**headers, "X-Idempotency-Key": idem_key}
    )
    assert response2.status_code == 200
    data2 = response2.json()
    assert data1["id"] == data2["id"]  # Must be the exact same entry

    # 4. Verify inventory only decreased by 5, not 10 (idempotency worked)
    await db.refresh(item)
    assert item.current_full == 95
    assert item.current_empty == 15
