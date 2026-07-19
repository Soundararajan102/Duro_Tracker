import os

path = r"d:\Duro Tracker\backend\app\routers\admin.py"

with open(path, "r", encoding="utf-8") as f:
    content = f.read()

# Add imports
if "from fastapi.responses import StreamingResponse" not in content:
    content = content.replace(
        "from fastapi import APIRouter, Depends, HTTPException, status\n",
        "from fastapi import APIRouter, Depends, HTTPException, status\nfrom fastapi.responses import StreamingResponse\nfrom typing import Optional\n"
    )

if "from sqlalchemy.orm import selectinload" not in content:
    content = content.replace(
        "from sqlalchemy import select, func\n",
        "from sqlalchemy import select, func, and_\nfrom sqlalchemy.orm import selectinload\n"
    )

# Add endpoint
endpoint_code = """
# --- REPORTS ---
@router.get("/reports/purchases/pdf")
async def generate_purchase_pdf_endpoint(
    date_mode: str,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    provider_ids: Optional[str] = None,
    db: AsyncSession = Depends(get_tenant_db),
    current_user: User = Depends(require_tenant_admin()),
    platform_db: AsyncSession = Depends(get_platform_db),
):
    from app.services.reports.purchase_pdf import generate_purchase_pdf, PurchasePdfData, PurchasePdfBillData, PurchasePdfItemData
    from app.models import PurchaseBill, PurchaseEntry, Provider
    import datetime

    # Base query
    stmt = select(PurchaseBill).options(
        selectinload(PurchaseBill.entries).selectinload(PurchaseEntry.item),
        selectinload(PurchaseBill.provider)
    )

    filters = []

    # Date Filtering
    date_display_text = ""
    if date_mode == 'single' and start_date:
        dt = datetime.datetime.fromisoformat(start_date)
        dt_start = dt.replace(hour=0, minute=0, second=0, microsecond=0)
        dt_end = dt.replace(hour=23, minute=59, second=59, microsecond=999999)
        filters.append(PurchaseBill.created_at >= dt_start)
        filters.append(PurchaseBill.created_at <= dt_end)
        date_display_text = dt.strftime("%d-%m-%Y")
    elif date_mode == 'range' and start_date and end_date:
        dt1 = datetime.datetime.fromisoformat(start_date)
        dt2 = datetime.datetime.fromisoformat(end_date)
        dt_start = dt1.replace(hour=0, minute=0, second=0, microsecond=0)
        dt_end = dt2.replace(hour=23, minute=59, second=59, microsecond=999999)
        filters.append(PurchaseBill.created_at >= dt_start)
        filters.append(PurchaseBill.created_at <= dt_end)
        date_display_text = f"{dt1.strftime('%d-%m-%Y')} to {dt2.strftime('%d-%m-%Y')}"
    elif date_mode == 'month' and start_date:
        dt = datetime.datetime.fromisoformat(start_date)
        dt_start = dt.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        # simplistic end of month
        if dt_start.month == 12:
            dt_end = dt_start.replace(year=dt_start.year+1, month=1, day=1) - datetime.timedelta(seconds=1)
        else:
            dt_end = dt_start.replace(month=dt_start.month+1, day=1) - datetime.timedelta(seconds=1)
        filters.append(PurchaseBill.created_at >= dt_start)
        filters.append(PurchaseBill.created_at <= dt_end)
        date_display_text = dt.strftime("%B %Y")
    elif date_mode == 'year' and start_date:
        dt = datetime.datetime.fromisoformat(start_date)
        dt_start = dt.replace(month=1, day=1, hour=0, minute=0, second=0, microsecond=0)
        dt_end = dt.replace(month=12, day=31, hour=23, minute=59, second=59, microsecond=999999)
        filters.append(PurchaseBill.created_at >= dt_start)
        filters.append(PurchaseBill.created_at <= dt_end)
        date_display_text = dt.strftime("%Y")

    if provider_ids:
        # provider_ids is comma separated string of UUIDs
        import uuid
        p_ids = [uuid.UUID(x.strip()) for x in provider_ids.split(",") if x.strip()]
        if p_ids:
            filters.append(PurchaseBill.provider_id.in_(p_ids))
            
    if filters:
        stmt = stmt.where(and_(*filters))
        
    stmt = stmt.order_by(PurchaseBill.created_at.asc())
    
    result = await db.scalars(stmt)
    bills_db = result.all()

    # Get org details
    org = await platform_db.get(Organization, current_user.organization_id)
    org_name = org.name if org else "Organization"
    
    # Provider details
    provider_name = "Various Providers"
    provider_gstin = ""
    provider_phone = ""
    
    if provider_ids and len(provider_ids.split(",")) == 1:
        # Single provider
        try:
            p_id = provider_ids.split(",")[0].strip()
            if p_id:
                provider = await db.get(Provider, p_id)
                if provider:
                    provider_name = provider.name
                    provider_phone = getattr(provider, "phone", "") or ""
                    # gstin is not in Provider model based on previous snippets, maybe no GSTIN? Let's assume empty
                    provider_gstin = ""
        except:
            pass

    pdf_bills = []
    for b in bills_db:
        pdf_items = []
        # get provider rate
        price_per_kg = float(b.provider.price_per_kg) if getattr(b.provider, 'price_per_kg', None) else 0.0
        for entry in b.entries:
            qty = entry.full_received
            if qty <= 0:
                continue
            capacity = float(entry.item.capacity_kg) if entry.item.capacity_kg else 0.0
            rate = price_per_kg * capacity
            amount = qty * rate
            gst_percent = float(entry.item.gst_percent) if entry.item.gst_percent else 0.0
            hsn = entry.item.hsn_code or ""
            
            pdf_items.append(PurchasePdfItemData(
                item_name=entry.item.name,
                hsn=hsn,
                qty=qty,
                rate=rate,
                gst_percent=gst_percent,
                amount=amount
            ))
            
        if pdf_items:
            b_date_str = b.created_at.strftime("%d-%m-%Y")
            bill_no_str = b.bill_number or "N/A"
            pdf_bills.append(PurchasePdfBillData(
                date=b_date_str,
                bill_no=bill_no_str,
                items=pdf_items
            ))

    data = PurchasePdfData(
        org_name=org_name,
        org_gstin="", # Assume org gstin not in model
        org_address="",
        org_phone="",
        provider_name=provider_name,
        provider_gstin=provider_gstin,
        provider_phone=provider_phone,
        date_display_text=date_display_text,
        bills=pdf_bills
    )

    pdf_buffer = generate_purchase_pdf(data)
    
    return StreamingResponse(
        pdf_buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=Purchase_Report_{date_display_text.replace(' ', '_')}.pdf"}
    )
"""

if "generate_purchase_pdf_endpoint" not in content:
    content += "\n" + endpoint_code

with open(path, "w", encoding="utf-8") as f:
    f.write(content)
print("Updated admin.py")
