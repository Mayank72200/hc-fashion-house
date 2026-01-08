"""
Order Models - Pydantic models for order management
Supports prepaid orders, guest checkout, and order tracking
"""
from datetime import datetime
from typing import Optional, List
from enum import Enum
from pydantic import BaseModel, Field, EmailStr


# ========================
# Enums
# ========================

class OrderStatus(str, Enum):
    """Order status enum"""
    PENDING = "pending"
    CONFIRMED = "confirmed"
    PROCESSING = "processing"
    SHIPPED = "shipped"
    IN_TRANSIT = "in_transit"
    OUT_FOR_DELIVERY = "out_for_delivery"
    DELIVERED = "delivered"
    CANCELLED = "cancelled"
    RETURN_REQUESTED = "return_requested"
    RETURN_APPROVED = "return_approved"
    RETURN_REJECTED = "return_rejected"
    RETURNED = "returned"
    REFUNDED = "refunded"


class PaymentStatus(str, Enum):
    """Payment status enum"""
    PENDING = "pending"
    PAID = "paid"
    FAILED = "failed"
    REFUNDED = "refunded"
    PARTIALLY_REFUNDED = "partially_refunded"


class PaymentMethod(str, Enum):
    """Payment method enum - prepaid only"""
    CREDIT_CARD = "credit_card"
    DEBIT_CARD = "debit_card"
    UPI = "upi"
    NET_BANKING = "net_banking"
    WALLET = "wallet"


class ShippingPartner(str, Enum):
    """Shipping partners"""
    INDIA_POST = "india_post"
    SHIPROCKET = "shiprocket"


# ========================
# Address Models
# ========================

class AddressBase(BaseModel):
    """Base address model"""
    full_name: str = Field(..., min_length=2, max_length=100)
    phone: str = Field(..., pattern=r"^\+?[0-9]{10,13}$")
    email: Optional[EmailStr] = None
    address_line1: str = Field(..., min_length=5, max_length=255)
    address_line2: Optional[str] = Field(None, max_length=255)
    landmark: Optional[str] = Field(None, max_length=100)
    city: str = Field(..., min_length=2, max_length=100)
    state: str = Field(..., min_length=2, max_length=100)
    pincode: str = Field(..., pattern=r"^[0-9]{6}$")
    is_default: bool = False


class AddressCreate(AddressBase):
    """Create address request"""
    pass


class AddressUpdate(BaseModel):
    """Update address request - all fields optional"""
    full_name: Optional[str] = Field(None, min_length=2, max_length=100)
    phone: Optional[str] = Field(None, pattern=r"^\+?[0-9]{10,13}$")
    email: Optional[EmailStr] = None
    address_line1: Optional[str] = Field(None, min_length=5, max_length=255)
    address_line2: Optional[str] = Field(None, max_length=255)
    landmark: Optional[str] = Field(None, max_length=100)
    city: Optional[str] = Field(None, min_length=2, max_length=100)
    state: Optional[str] = Field(None, min_length=2, max_length=100)
    pincode: Optional[str] = Field(None, pattern=r"^[0-9]{6}$")
    is_default: Optional[bool] = None


class AddressResponse(AddressBase):
    """Address response"""
    id: int
    user_id: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# ========================
# Order Item Models
# ========================

class OrderItemBase(BaseModel):
    """Order item base"""
    product_id: int
    variant_id: Optional[int] = None
    option_id: Optional[int] = None
    product_name: str
    variant_name: Optional[str] = None
    size: str
    color: Optional[str] = None
    quantity: int = Field(..., ge=1, le=10)
    unit_price: int  # Price in rupees
    total_price: int  # unit_price * quantity


class OrderItemCreate(BaseModel):
    """Create order item - simplified for cart items"""
    product_id: int
    variant_id: Optional[int] = None
    option_id: Optional[int] = None
    product_name: str
    variant_name: Optional[str] = None
    size: str
    color: Optional[str] = None
    quantity: int = Field(..., ge=1, le=10)
    unit_price: int
    image_url: Optional[str] = None


class OrderItemResponse(OrderItemBase):
    """Order item response"""
    id: int
    image_url: Optional[str] = None

    class Config:
        from_attributes = True


# ========================
# Order Models
# ========================

class GuestInfo(BaseModel):
    """Guest checkout info"""
    email: EmailStr
    phone: str = Field(..., pattern=r"^\+?[0-9]{10,13}$")
    full_name: str = Field(..., min_length=2, max_length=100)


class OrderCreate(BaseModel):
    """Create order request"""
    # Either user_id (logged in) or guest_info (guest checkout)
    guest_info: Optional[GuestInfo] = None
    
    # Shipping address
    shipping_address: AddressCreate
    
    # Order items
    items: List[OrderItemCreate] = Field(..., min_items=1)
    
    # Payment info (prepaid only)
    payment_method: PaymentMethod
    payment_transaction_id: Optional[str] = None
    
    # Optional notes
    order_notes: Optional[str] = Field(None, max_length=500)


class OrderUpdate(BaseModel):
    """Update order - admin only"""
    status: Optional[OrderStatus] = None
    shipping_partner: Optional[ShippingPartner] = None
    tracking_number: Optional[str] = None
    admin_notes: Optional[str] = None
    video_call_completed: Optional[bool] = None
    video_call_approved: Optional[bool] = None


class OrderTrackingEvent(BaseModel):
    """Order tracking timeline event"""
    status: str
    title: str
    description: str
    timestamp: datetime
    location: Optional[str] = None


class OrderResponse(BaseModel):
    """Order response"""
    id: int
    order_number: str
    user_id: Optional[str] = None
    guest_email: Optional[str] = None
    guest_phone: Optional[str] = None
    guest_name: Optional[str] = None
    
    # Status
    status: OrderStatus
    payment_status: PaymentStatus
    payment_method: PaymentMethod
    
    # Pricing
    subtotal: int
    shipping_charge: int
    discount_amount: int
    total_amount: int
    
    # Shipping
    shipping_address: AddressResponse
    shipping_partner: Optional[ShippingPartner] = None
    tracking_number: Optional[str] = None
    estimated_delivery: Optional[datetime] = None
    
    # Items
    items: List[OrderItemResponse]
    
    # Video call verification
    video_call_completed: bool = False
    video_call_approved: bool = False
    
    # Notes
    order_notes: Optional[str] = None
    
    # Timestamps
    created_at: datetime
    updated_at: Optional[datetime] = None
    shipped_at: Optional[datetime] = None
    delivered_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class OrderListResponse(BaseModel):
    """Paginated order list response"""
    orders: List[OrderResponse]
    total: int
    page: int
    per_page: int
    total_pages: int


class OrderTrackingRequest(BaseModel):
    """Request to track an order"""
    order_number: str
    email: EmailStr


class OrderTrackingResponse(BaseModel):
    """Order tracking response for customers"""
    order_number: str
    status: OrderStatus
    shipping_partner: Optional[str] = None
    tracking_number: Optional[str] = None
    estimated_delivery: Optional[datetime] = None
    timeline: List[OrderTrackingEvent]
    shipping_address: AddressResponse
    items: List[OrderItemResponse]


# ========================
# Return Request Models
# ========================

class ReturnReason(str, Enum):
    """Return reasons"""
    WRONG_ITEM = "wrong_item"
    WRONG_SIZE = "wrong_size"
    DAMAGED = "damaged"
    DEFECTIVE = "defective"


class ReturnRequestCreate(BaseModel):
    """Create return request"""
    order_id: int
    item_ids: List[int]  # Order item IDs to return
    reason: ReturnReason
    description: Optional[str] = Field(None, max_length=1000)
    has_unboxing_video: bool = False
    images: List[str] = []  # Image URLs


class ReturnRequestResponse(BaseModel):
    """Return request response"""
    id: int
    order_id: int
    order_number: str
    status: str
    reason: str
    description: Optional[str] = None
    return_address: str  # Our warehouse address
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# ========================
# Contact Form Models
# ========================

class ContactFormCreate(BaseModel):
    """Contact form submission"""
    name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr
    phone: Optional[str] = Field(None, pattern=r"^\+?[0-9]{10,13}$")
    subject: str = Field(..., min_length=5, max_length=200)
    message: str = Field(..., min_length=10, max_length=2000)


class ContactFormResponse(BaseModel):
    """Contact form response"""
    id: int
    name: str
    email: str
    subject: str
    message: str
    status: str
    created_at: datetime

    class Config:
        from_attributes = True
