"""
E-Commerce Application Entry Point
Standalone entry point for the e-commerce catalogue backend
"""
import os
import sys
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from starlette.responses import JSONResponse

sys.path.append(os.path.abspath(os.path.dirname(__file__)))

from database.connection import init_db

# New router structure - Admin and Store (Customer) routers
from routers.v1.catalogue_router.catalogue_router_admin import router as catalogue_admin_router
from routers.v1.catalogue_router.catalogue_router import router as catalogue_store_router
from routers.v1.media_router.media_router_admin import router as media_admin_router
from routers.v1.media_router.media_router import router as media_store_router

# Auth router
from routers.v1.auth_router import router as auth_router

from utils.exceptions import EcommerceException

# Define allowed origins
origins = [
    "http://localhost:3000",
    "http://localhost:8000",
    "http://localhost:8080",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:8000",
    "http://127.0.0.1:8080",
    "*"  # Allow all origins for development
]


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan management"""
    # Startup
    print("🚀 Starting E-Commerce Catalogue Service")

    # Initialize SQLite database
    print("📦 Initializing SQLite database...")
    init_db()
    print("✅ Database initialized successfully!")

    print("🎉 E-Commerce service is ready!")
    yield

    # Shutdown
    print("👋 Shutting down E-Commerce Catalogue Service")


# Create FastAPI app
app = FastAPI(
    title="E-Commerce Catalogue API",
    description="""
    ## E-Commerce Catalogue Backend API
    
    This API provides endpoints for managing an e-commerce catalogue system with:
    
    - **Categories**: Hierarchical product categories
    - **Catalogues**: Marketing collections/groupings
    - **Products**: Core sellable items with variants
    - **Variants**: Color/style variations of products
    - **Options**: Size/dimension options with stock tracking
    - **Media Assets**: Images and videos for products
    
    ### Database Model
    ```
    Catalogue (Collection)
       ↓ (many-to-many)
    Product (Article / Design)
       ↓ (one-to-many)
    Variant (Color / Style)
       ↓ (one-to-many)
    Option (Size / Fit / Dimension)
    ```
    
    Currently supporting **Footwear** with plans to extend to Clothing and Accessories.
    """,
    version="1.0.0",
    lifespan=lifespan
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Health check endpoint
@app.get("/health", tags=["Health"])
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "E-Commerce Catalogue API",
        "version": "1.0.0"
    }


# Root endpoint
@app.get("/", tags=["Root"])
async def root():
    """Root endpoint with API information"""
    return {
        "message": "Welcome to E-Commerce Catalogue API",
        "docs": "/docs",
        "redoc": "/redoc",
        "version": "1.0.0"
    }


# Exception handlers
@app.exception_handler(EcommerceException)
async def ecommerce_exception_handler(request: Request, exc: EcommerceException):
    """Handle e-commerce specific exceptions"""
    return JSONResponse(
        status_code=exc.status_code,
        content=exc.to_dict()
    )


@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    """Handle HTTP exceptions"""
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail, "status_code": exc.status_code}
    )


@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    """Handle unexpected exceptions"""
    print(f"Unexpected error: {str(exc)}")
    return JSONResponse(
        status_code=500,
        content={"error": "Internal server error", "detail": str(exc)}
    )


# ========================
# Auth Router (public + authenticated endpoints)
# ========================
app.include_router(auth_router, prefix="/api/v1", tags=["Authentication"])

# ========================
# Admin Routers (state-changing operations)
# ========================
app.include_router(catalogue_admin_router, prefix="/api/v1/admin", tags=["Catalogue Admin"])
app.include_router(media_admin_router, prefix="/api/v1/admin", tags=["Media Admin"])

# ========================
# Store Routers (customer-facing read-only)
# ========================
app.include_router(catalogue_store_router, prefix="/api/v1", tags=["Catalogue Store"])
app.include_router(media_store_router, prefix="/api/v1", tags=["Media Store"])


if __name__ == "__main__":
    import uvicorn

    print("""
    ╔══════════════════════════════════════════════════════════════╗
    ║              E-Commerce Catalogue API Server                 ║
    ╠══════════════════════════════════════════════════════════════╣
    ║  Docs:     http://localhost:8000/docs                        ║
    ║  ReDoc:    http://localhost:8000/redoc                       ║
    ║  Health:   http://localhost:8000/health                      ║
    ╚══════════════════════════════════════════════════════════════╝
    """)

    uvicorn.run(
        "main_ecom:app",
        host="0.0.0.0",
        port=8000,
    )

