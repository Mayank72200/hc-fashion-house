"""
Order Router - API endpoints for order management
Customer and Admin endpoints for orders, tracking, and returns
"""
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from database.connection import get_db
from models.order_models import (
    OrderCreate, OrderResponse, OrderListResponse,
    OrderTrackingResponse, OrderTrackingRequest,
    AddressCreate, AddressUpdate, AddressResponse,
    ReturnRequestCreate, ReturnRequestResponse,
    ContactFormCreate, ContactFormResponse
)
from services.order_service import (
    OrderService, AddressService, ReturnService, ContactService
)
from utils.auth_dependencies import get_current_user, get_optional_user


router = APIRouter()


# ========================
# Order Endpoints
# ========================

@router.post("/orders", response_model=OrderResponse, tags=["Orders"])
async def create_order(
    order_data: OrderCreate,
    db: Session = Depends(get_db),
    current_user: Optional[dict] = Depends(get_optional_user)
):
    """
    Create a new order.
    Supports both authenticated users and guest checkout.
    All orders are prepaid only.
    """
    user_id = current_user.get("id") if current_user else None
    
    # Guest checkout requires guest info
    if not user_id and not order_data.guest_info:
        raise HTTPException(
            status_code=400,
            detail="Guest information required for guest checkout"
        )
    
    order = OrderService.create_order(db, user_id, order_data)
    return OrderResponse.model_validate(order)


@router.get("/orders", response_model=OrderListResponse, tags=["Orders"])
async def list_orders(
    status: Optional[str] = Query(None, description="Filter by order status"),
    page: int = Query(1, ge=1),
    per_page: int = Query(10, ge=1, le=50),
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    List orders for the authenticated user.
    """
    orders, total = OrderService.list_orders(
        db, current_user["id"], status, page, per_page
    )
    
    return OrderListResponse(
        orders=[OrderResponse.model_validate(o) for o in orders],
        total=total,
        page=page,
        per_page=per_page,
        total_pages=(total + per_page - 1) // per_page
    )


@router.get("/orders/{order_id}", response_model=OrderResponse, tags=["Orders"])
async def get_order(
    order_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Get order details by ID.
    """
    order = OrderService.get_order(db, order_id, current_user["id"])
    return OrderResponse.model_validate(order)


# ========================
# Order Tracking Endpoints
# ========================

@router.post("/orders/track", response_model=OrderTrackingResponse, tags=["Order Tracking"])
async def track_order(
    tracking_request: OrderTrackingRequest,
    db: Session = Depends(get_db)
):
    """
    Track an order by order number and email.
    Works for both guest and authenticated user orders.
    """
    return OrderService.get_order_tracking(
        db,
        tracking_request.order_number,
        tracking_request.email
    )


@router.get("/orders/{order_id}/track", response_model=OrderTrackingResponse, tags=["Order Tracking"])
async def track_order_by_id(
    order_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Get tracking details for an order by ID.
    Requires authentication - user must own the order.
    """
    order = OrderService.get_order(db, order_id, current_user["id"])
    
    return OrderService.get_order_tracking(
        db,
        order.order_number,
        None  # No email verification needed for authenticated users
    )


# ========================
# Address Endpoints
# ========================

@router.post("/addresses", response_model=AddressResponse, tags=["Addresses"])
async def create_address(
    address_data: AddressCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Create a new address for the authenticated user.
    """
    address = AddressService.create_address(db, current_user["id"], address_data)
    return AddressResponse.model_validate(address)


@router.get("/addresses", response_model=List[AddressResponse], tags=["Addresses"])
async def list_addresses(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    List all addresses for the authenticated user.
    """
    addresses = AddressService.list_addresses(db, current_user["id"])
    return [AddressResponse.model_validate(a) for a in addresses]


@router.get("/addresses/{address_id}", response_model=AddressResponse, tags=["Addresses"])
async def get_address(
    address_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Get an address by ID.
    """
    address = AddressService.get_address(db, address_id, current_user["id"])
    return AddressResponse.model_validate(address)


@router.put("/addresses/{address_id}", response_model=AddressResponse, tags=["Addresses"])
async def update_address(
    address_id: int,
    address_data: AddressUpdate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Update an address.
    """
    address = AddressService.update_address(
        db, address_id, current_user["id"], address_data
    )
    return AddressResponse.model_validate(address)


@router.delete("/addresses/{address_id}", tags=["Addresses"])
async def delete_address(
    address_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Delete an address.
    """
    AddressService.delete_address(db, address_id, current_user["id"])
    return {"message": "Address deleted successfully"}


# ========================
# Return Request Endpoints
# ========================

@router.post("/returns", response_model=ReturnRequestResponse, tags=["Returns"])
async def create_return_request(
    return_data: ReturnRequestCreate,
    db: Session = Depends(get_db),
    current_user: Optional[dict] = Depends(get_optional_user)
):
    """
    Create a return request for an order.
    Returns must be requested within 72 hours of delivery.
    Products approved during video call packing are not eligible.
    """
    user_id = current_user.get("id") if current_user else None
    
    return_request = ReturnService.create_return_request(db, user_id, return_data)
    
    # Build response with additional fields
    return ReturnRequestResponse(
        id=return_request.id,
        order_id=return_request.order_id,
        order_number=return_request.order.order_number,
        status=return_request.status,
        reason=return_request.reason,
        description=return_request.description,
        return_address="HC Fashion House, Main Market, Near Holi Dhara, Pipar City, Jodhpur, Rajasthan 342601",
        created_at=return_request.created_at,
        updated_at=return_request.updated_at,
    )


# ========================
# Contact Form Endpoints
# ========================

@router.post("/contact", response_model=ContactFormResponse, tags=["Contact"])
async def submit_contact_form(
    form_data: ContactFormCreate,
    db: Session = Depends(get_db)
):
    """
    Submit a contact form inquiry.
    """
    submission = ContactService.create_submission(db, form_data)
    return ContactFormResponse.model_validate(submission)
