"""
Custom Exceptions for E-Commerce API
Production-ready exception classes with proper error codes and messages
"""
from typing import Any, Dict, Optional


class EcommerceException(Exception):
    """Base exception for e-commerce operations"""

    def __init__(
        self,
        message: str,
        error_code: str,
        status_code: int = 400,
        details: Optional[Dict[str, Any]] = None
    ):
        self.message = message
        self.error_code = error_code
        self.status_code = status_code
        self.details = details or {}
        super().__init__(self.message)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "error": self.message,
            "error_code": self.error_code,
            "details": self.details
        }


class ResourceNotFoundException(EcommerceException):
    """Raised when a requested resource is not found"""

    def __init__(self, resource_type: str, resource_id: Any, details: Optional[Dict] = None):
        super().__init__(
            message=f"{resource_type} with ID '{resource_id}' not found",
            error_code="RESOURCE_NOT_FOUND",
            status_code=404,
            details=details or {"resource_type": resource_type, "resource_id": resource_id}
        )


class DuplicateResourceException(EcommerceException):
    """Raised when trying to create a resource that already exists"""

    def __init__(self, resource_type: str, field: str, value: Any, details: Optional[Dict] = None):
        super().__init__(
            message=f"{resource_type} with {field} '{value}' already exists",
            error_code="DUPLICATE_RESOURCE",
            status_code=400,
            details=details or {"resource_type": resource_type, "field": field, "value": value}
        )


class ValidationException(EcommerceException):
    """Raised when validation fails"""

    def __init__(self, message: str, field: Optional[str] = None, details: Optional[Dict] = None):
        super().__init__(
            message=message,
            error_code="VALIDATION_ERROR",
            status_code=422,
            details=details or {"field": field} if field else details or {}
        )


class BusinessRuleException(EcommerceException):
    """Raised when a business rule is violated"""

    def __init__(self, message: str, rule: str, details: Optional[Dict] = None):
        super().__init__(
            message=message,
            error_code="BUSINESS_RULE_VIOLATION",
            status_code=400,
            details=details or {"rule": rule}
        )


class InsufficientStockException(EcommerceException):
    """Raised when there is insufficient stock"""

    def __init__(self, product_name: str, requested: int, available: int):
        super().__init__(
            message=f"Insufficient stock for '{product_name}'. Requested: {requested}, Available: {available}",
            error_code="INSUFFICIENT_STOCK",
            status_code=400,
            details={
                "product_name": product_name,
                "requested_quantity": requested,
                "available_quantity": available
            }
        )


class DatabaseException(EcommerceException):
    """Raised when a database operation fails"""

    def __init__(self, operation: str, details: Optional[Dict] = None):
        super().__init__(
            message=f"Database operation failed: {operation}",
            error_code="DATABASE_ERROR",
            status_code=500,
            details=details or {"operation": operation}
        )

