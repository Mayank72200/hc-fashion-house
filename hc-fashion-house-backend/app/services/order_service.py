"""
Order Service - Business logic for order management
Handles order creation, tracking, returns, and address management
"""
import json
from datetime import datetime, timedelta
from typing import List, Optional, Tuple
import uuid

from sqlalchemy.orm import Session
from sqlalchemy import desc
from fastapi import HTTPException, status

from database.db_models import (
    Order, OrderItem, Address, ReturnRequest, ReturnRequestItem,
    ContactSubmission, Product, ProductVariant, VariantOption
)
from models.order_models import (
    OrderCreate, OrderUpdate, OrderResponse, OrderListResponse,
    OrderTrackingResponse, OrderTrackingEvent, OrderItemResponse,
    AddressCreate, AddressUpdate, AddressResponse,
    ReturnRequestCreate, ReturnRequestResponse,
    ContactFormCreate, ContactFormResponse,
    OrderStatus, PaymentStatus
)


# ========================
# Helper Functions
# ========================

def generate_order_number() -> str:
    """Generate unique order number"""
    timestamp = datetime.utcnow().strftime("%Y%m%d%H%M")
    unique_id = uuid.uuid4().hex[:6].upper()
    return f"HC-{timestamp}-{unique_id}"


def calculate_shipping_charge(subtotal: int, pincode: str) -> int:
    """
    Calculate shipping charge based on subtotal and pincode.
    Returns charge in rupees.
    """
    # Free shipping for orders above ₹999
    if subtotal >= 999:
        return 0
    
    # Standard shipping charge
    return 99  # ₹99


def get_estimated_delivery(pincode: str) -> datetime:
    """
    Calculate estimated delivery date based on pincode.
    """
    # Metro cities - 3-4 days
    metro_pincodes = ['400', '110', '560', '500', '600', '700', '411', '380']
    
    # Check if pincode starts with metro prefix
    for prefix in metro_pincodes:
        if pincode.startswith(prefix):
            return datetime.utcnow() + timedelta(days=4)
    
    # Tier 1 cities - 4-5 days
    tier1_pincodes = ['302', '226', '160', '682', '452', '462', '440', '395']
    for prefix in tier1_pincodes:
        if pincode.startswith(prefix):
            return datetime.utcnow() + timedelta(days=5)
    
    # Default - 6-7 days
    return datetime.utcnow() + timedelta(days=7)


# ========================
# Address Service
# ========================

class AddressService:
    """Service for managing user addresses"""
    
    @staticmethod
    def create_address(db: Session, user_id: Optional[str], address_data: AddressCreate) -> Address:
        """Create a new address"""
        # If setting as default, unset other defaults
        if address_data.is_default and user_id:
            db.query(Address).filter(
                Address.user_id == user_id,
                Address.is_default == True
            ).update({"is_default": False})
        
        address = Address(
            user_id=user_id,
            **address_data.model_dump()
        )
        db.add(address)
        db.commit()
        db.refresh(address)
        return address
    
    @staticmethod
    def get_address(db: Session, address_id: int, user_id: Optional[str] = None) -> Address:
        """Get address by ID"""
        query = db.query(Address).filter(Address.id == address_id)
        if user_id:
            query = query.filter(Address.user_id == user_id)
        
        address = query.first()
        if not address:
            raise HTTPException(status_code=404, detail="Address not found")
        return address
    
    @staticmethod
    def list_addresses(db: Session, user_id: str) -> List[Address]:
        """List all addresses for a user"""
        return db.query(Address).filter(
            Address.user_id == user_id
        ).order_by(desc(Address.is_default), desc(Address.created_at)).all()
    
    @staticmethod
    def update_address(db: Session, address_id: int, user_id: str, update_data: AddressUpdate) -> Address:
        """Update an address"""
        address = AddressService.get_address(db, address_id, user_id)
        
        update_dict = update_data.model_dump(exclude_unset=True)
        
        # If setting as default, unset other defaults
        if update_dict.get("is_default"):
            db.query(Address).filter(
                Address.user_id == user_id,
                Address.id != address_id,
                Address.is_default == True
            ).update({"is_default": False})
        
        for key, value in update_dict.items():
            setattr(address, key, value)
        
        db.commit()
        db.refresh(address)
        return address
    
    @staticmethod
    def delete_address(db: Session, address_id: int, user_id: str) -> None:
        """Delete an address"""
        address = AddressService.get_address(db, address_id, user_id)
        
        # Check if address is used in any order
        order_count = db.query(Order).filter(Order.shipping_address_id == address_id).count()
        if order_count > 0:
            raise HTTPException(
                status_code=400,
                detail="Cannot delete address used in orders. You can update it instead."
            )
        
        db.delete(address)
        db.commit()


# ========================
# Order Service
# ========================

class OrderService:
    """Service for managing orders"""
    
    @staticmethod
    def create_order(db: Session, user_id: Optional[str], order_data: OrderCreate) -> Order:
        """Create a new order"""
        # Create or get shipping address
        address = Address(
            user_id=user_id,
            **order_data.shipping_address.model_dump()
        )
        db.add(address)
        db.flush()  # Get address ID
        
        # Calculate totals
        subtotal = sum(item.unit_price * item.quantity for item in order_data.items)
        shipping_charge = calculate_shipping_charge(subtotal, order_data.shipping_address.pincode)
        total_amount = subtotal + shipping_charge
        
        # Create order
        order = Order(
            order_number=generate_order_number(),
            user_id=user_id,
            guest_email=order_data.guest_info.email if order_data.guest_info else None,
            guest_phone=order_data.guest_info.phone if order_data.guest_info else None,
            guest_name=order_data.guest_info.full_name if order_data.guest_info else None,
            status=OrderStatus.CONFIRMED.value,
            payment_status=PaymentStatus.PAID.value,  # Prepaid only
            payment_method=order_data.payment_method.value,
            payment_transaction_id=order_data.payment_transaction_id,
            subtotal=subtotal,
            shipping_charge=shipping_charge,
            discount_amount=0,
            total_amount=total_amount,
            shipping_address_id=address.id,
            shipping_partner="india_post",  # Default
            estimated_delivery=get_estimated_delivery(order_data.shipping_address.pincode),
            order_notes=order_data.order_notes
        )
        db.add(order)
        db.flush()  # Get order ID
        
        # Create order items
        for item_data in order_data.items:
            order_item = OrderItem(
                order_id=order.id,
                product_id=item_data.product_id,
                variant_id=item_data.variant_id,
                option_id=item_data.option_id,
                product_name=item_data.product_name,
                variant_name=item_data.variant_name,
                size=item_data.size,
                color=item_data.color,
                image_url=item_data.image_url,
                quantity=item_data.quantity,
                unit_price=item_data.unit_price,
                total_price=item_data.unit_price * item_data.quantity
            )
            db.add(order_item)
        
        db.commit()
        db.refresh(order)
        return order
    
    @staticmethod
    def get_order(db: Session, order_id: int, user_id: Optional[str] = None) -> Order:
        """Get order by ID"""
        query = db.query(Order).filter(Order.id == order_id)
        if user_id:
            query = query.filter(Order.user_id == user_id)
        
        order = query.first()
        if not order:
            raise HTTPException(status_code=404, detail="Order not found")
        return order
    
    @staticmethod
    def get_order_by_number(db: Session, order_number: str, email: Optional[str] = None) -> Order:
        """Get order by order number (for tracking)"""
        query = db.query(Order).filter(Order.order_number == order_number)
        
        # If email provided, verify it matches (for guest orders)
        order = query.first()
        if not order:
            raise HTTPException(status_code=404, detail="Order not found")
        
        if email:
            order_email = order.guest_email or None
            if order_email and order_email.lower() != email.lower():
                raise HTTPException(status_code=404, detail="Order not found")
        
        return order
    
    @staticmethod
    def list_orders(
        db: Session,
        user_id: str,
        status: Optional[str] = None,
        page: int = 1,
        per_page: int = 10
    ) -> Tuple[List[Order], int]:
        """List orders for a user"""
        query = db.query(Order).filter(Order.user_id == user_id)
        
        if status:
            query = query.filter(Order.status == status)
        
        total = query.count()
        orders = query.order_by(desc(Order.created_at)).offset((page - 1) * per_page).limit(per_page).all()
        
        return orders, total
    
    @staticmethod
    def update_order(db: Session, order_id: int, update_data: OrderUpdate) -> Order:
        """Update order (admin)"""
        order = db.query(Order).filter(Order.id == order_id).first()
        if not order:
            raise HTTPException(status_code=404, detail="Order not found")
        
        update_dict = update_data.model_dump(exclude_unset=True)
        
        # Handle status changes
        if "status" in update_dict:
            new_status = update_dict["status"]
            if new_status == OrderStatus.SHIPPED.value:
                order.shipped_at = datetime.utcnow()
            elif new_status == OrderStatus.DELIVERED.value:
                order.delivered_at = datetime.utcnow()
        
        for key, value in update_dict.items():
            if hasattr(order, key):
                setattr(order, key, value.value if hasattr(value, 'value') else value)
        
        db.commit()
        db.refresh(order)
        return order
    
    @staticmethod
    def get_order_tracking(db: Session, order_number: str, email: str) -> OrderTrackingResponse:
        """Get order tracking details"""
        order = OrderService.get_order_by_number(db, order_number, email)
        
        # Build timeline based on status
        timeline = []
        status_progression = [
            (OrderStatus.CONFIRMED, "Order Confirmed", "Your order has been received and confirmed"),
            (OrderStatus.PROCESSING, "Processing", "Your order is being prepared"),
            (OrderStatus.SHIPPED, "Shipped", "Your order has been dispatched"),
            (OrderStatus.IN_TRANSIT, "In Transit", "Your package is on the way"),
            (OrderStatus.OUT_FOR_DELIVERY, "Out for Delivery", "Your package is out for delivery"),
            (OrderStatus.DELIVERED, "Delivered", "Package delivered successfully"),
        ]
        
        current_status_index = next(
            (i for i, (s, _, _) in enumerate(status_progression) if s.value == order.status),
            len(status_progression)
        )
        
        for i, (status, title, description) in enumerate(status_progression):
            completed = i <= current_status_index
            timestamp = order.created_at
            
            if status == OrderStatus.SHIPPED and order.shipped_at:
                timestamp = order.shipped_at
            elif status == OrderStatus.DELIVERED and order.delivered_at:
                timestamp = order.delivered_at
            
            timeline.append(OrderTrackingEvent(
                status=status.value,
                title=title,
                description=description,
                timestamp=timestamp if completed else order.estimated_delivery or datetime.utcnow()
            ))
        
        return OrderTrackingResponse(
            order_number=order.order_number,
            status=OrderStatus(order.status),
            shipping_partner=order.shipping_partner,
            tracking_number=order.tracking_number,
            estimated_delivery=order.estimated_delivery,
            timeline=timeline,
            shipping_address=AddressResponse.model_validate(order.shipping_address),
            items=[OrderItemResponse.model_validate(item) for item in order.items]
        )


# ========================
# Return Service
# ========================

class ReturnService:
    """Service for managing return requests"""
    
    @staticmethod
    def create_return_request(
        db: Session,
        user_id: Optional[str],
        return_data: ReturnRequestCreate
    ) -> ReturnRequest:
        """Create a return request"""
        # Get order
        order = db.query(Order).filter(Order.id == return_data.order_id).first()
        if not order:
            raise HTTPException(status_code=404, detail="Order not found")
        
        # Verify ownership
        if user_id and order.user_id != user_id:
            raise HTTPException(status_code=403, detail="Not authorized")
        
        # Check if order is eligible for return (72 hours)
        if order.delivered_at:
            hours_since_delivery = (datetime.utcnow() - order.delivered_at).total_seconds() / 3600
            if hours_since_delivery > 72:
                raise HTTPException(
                    status_code=400,
                    detail="Return window has expired. Returns must be requested within 72 hours of delivery."
                )
        
        # Check if video call was approved (not eligible for return)
        if order.video_call_completed and order.video_call_approved:
            raise HTTPException(
                status_code=400,
                detail="Products approved during video call packing are not eligible for return."
            )
        
        # Create return request
        return_request = ReturnRequest(
            order_id=order.id,
            reason=return_data.reason.value,
            description=return_data.description,
            has_unboxing_video=return_data.has_unboxing_video,
            images=json.dumps(return_data.images) if return_data.images else None
        )
        db.add(return_request)
        db.flush()
        
        # Add items to return
        for item_id in return_data.item_ids:
            order_item = db.query(OrderItem).filter(
                OrderItem.id == item_id,
                OrderItem.order_id == order.id
            ).first()
            
            if order_item:
                return_item = ReturnRequestItem(
                    return_request_id=return_request.id,
                    order_item_id=item_id
                )
                db.add(return_item)
        
        # Update order status
        order.status = OrderStatus.RETURN_REQUESTED.value
        
        db.commit()
        db.refresh(return_request)
        return return_request


# ========================
# Contact Service
# ========================

class ContactService:
    """Service for contact form submissions"""
    
    @staticmethod
    def create_submission(db: Session, form_data: ContactFormCreate) -> ContactSubmission:
        """Create a contact form submission"""
        submission = ContactSubmission(
            name=form_data.name,
            email=form_data.email,
            phone=form_data.phone,
            subject=form_data.subject,
            message=form_data.message
        )
        db.add(submission)
        db.commit()
        db.refresh(submission)
        return submission
    
    @staticmethod
    def list_submissions(
        db: Session,
        status: Optional[str] = None,
        page: int = 1,
        per_page: int = 20
    ) -> Tuple[List[ContactSubmission], int]:
        """List contact submissions (admin)"""
        query = db.query(ContactSubmission)
        
        if status:
            query = query.filter(ContactSubmission.status == status)
        
        total = query.count()
        submissions = query.order_by(desc(ContactSubmission.created_at)).offset((page - 1) * per_page).limit(per_page).all()
        
        return submissions, total
