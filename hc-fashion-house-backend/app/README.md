# E-Commerce Catalogue API

A production-ready FastAPI backend for managing e-commerce product catalogues with Cloudinary media storage, built with SQLite database support.

## 🏗️ Architecture

```
Catalogue (Collection)
   ↓ (many-to-many)
Product (Article / Design)
   ↓ (one-to-many)
Variant (Color / Style)
   ↓ (one-to-many)
Option (Size / Fit / Dimension)
```

## 📁 Project Structure

```
app/
├── database/
│   ├── connection.py           # Database connection & session management
│   ├── db_models.py            # SQLAlchemy ORM models (with soft delete)
│   ├── user_models.py          # User & Auth related models
│   └── seed_data.py            # Sample data seeding script
├── models/
│   ���── auth_models.py          # Auth & User Pydantic schemas
│   ├── catalogue_models.py     # Pydantic schemas for catalogue
│   └── media_models.py         # Pydantic schemas for media upload
├── services/
│   ├── auth_service.py         # Auth & User management logic
│   ├── catalogue_service.py    # Catalogue business logic
│   └── media_upload_service.py # Media upload & Cloudinary logic
├── routers/v1/
│   ├── auth_router.py          # Auth endpoints (OTP, profile, roles)
│   ├── catalogue_router/       # Catalogue routers
│   │   ├── catalogue_router_admin.py   # Admin: Create/Update/Delete
│   │   └── catalogue_router.py         # Store: Read-only + Buy Intent
│   └── media_router/           # Media routers
│       ├── media_router_admin.py       # Admin: Upload/Update/Delete
│       └── media_router.py             # Store: Read-only
├── utils/
│   ├── auth_dependencies.py    # JWT validation & role checking
│   ├── cloudinary_config.py    # Cloudinary configuration
│   ├── supabase_config.py      # Supabase Auth configuration
│   └── exceptions.py           # Custom exception classes
├── main_ecom.py                # Application entry point
├── requirements.txt            # Python dependencies
└── .env.example                # Environment variables template
```

## 🔑 Router Classification (Golden Rule)

### ADMIN ROUTERS (`/api/v1/admin/...`)
- Create / Update / Delete
- Bulk operations
- Uploads
- Stock updates
- Draft / soft delete / restore
- **Anything that changes state**

### STORE ROUTERS (`/api/v1/...`)
- Read-only
- Filtered (status=live, active only)
- Optimized for frontend
- **Buy intent**

## 🚀 Quick Start

### 1. Install Dependencies

```bash
pip install -r requirements.txt
```

### 2. Configure Environment Variables

```bash
cp .env.example .env
# Edit .env with your Cloudinary credentials
```

### 3. Run the Application

```bash
cd app
python main_ecom.py
```

### 4. Access the API

- **API Documentation (Swagger)**: http://localhost:8000/docs
- **Health Check**: http://localhost:8000/health

## 📚 API Endpoints

### 🛒 STORE APIs (Customer-facing, Read-only)

#### Buy Intent API (Core MVP Feature)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/catalogue/buy-intent` | **Generate WhatsApp/Instagram redirect** |

#### Product Detail Aggregate (Frontend Gold)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/catalogue/products/slug/{slug}/detail` | **Aggregated product page data** |
| GET | `/api/v1/catalogue/products/{id}/detail` | Same but by ID |

Returns in ONE call: product + variants + availability + media grouped + related catalogues

#### Optimized Listing
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/catalogue/products/listing` | Product listing with pre-joined primary image |
| GET | `/api/v1/catalogue/products/{id}/availability` | Stock availability for Buy Now UX |

#### Store Read-Only
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/catalogue/categories` | List active categories |
| GET | `/api/v1/catalogue/categories/root` | Root categories |
| GET | `/api/v1/catalogue/categories/slug/{slug}` | Category by slug |
| GET | `/api/v1/catalogue/catalogues` | List active catalogues |
| GET | `/api/v1/catalogue/catalogues/{id}/products` | Products in catalogue (live only) |
| GET | `/api/v1/catalogue/products/slug/{slug}` | Product by slug (live only) |
| GET | `/api/v1/media/product/{id}` | Product media |
| GET | `/api/v1/media/variant/{id}` | Variant media |
| GET | `/api/v1/media/product/{id}/grouped` | Media grouped by type |

---

### 🔧 ADMIN APIs (State-changing operations)

#### Category Management
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/admin/catalogue/categories` | Create category |
| PUT | `/api/v1/admin/catalogue/categories/{id}` | Update category |
| DELETE | `/api/v1/admin/catalogue/categories/{id}` | Hard delete |
| DELETE | `/api/v1/admin/catalogue/categories/{id}/soft` | Soft delete |

#### Catalogue Management
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/admin/catalogue/catalogues` | Create catalogue |
| PUT | `/api/v1/admin/catalogue/catalogues/{id}` | Update catalogue |
| DELETE | `/api/v1/admin/catalogue/catalogues/{id}` | Hard delete |
| DELETE | `/api/v1/admin/catalogue/catalogues/{id}/soft` | Soft delete |
| POST | `/api/v1/admin/catalogue/catalogues/{id}/products/{pid}` | Add product |
| DELETE | `/api/v1/admin/catalogue/catalogues/{id}/products/{pid}` | Remove product |

#### Product Management
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/admin/catalogue/products` | Create product |
| POST | `/api/v1/admin/catalogue/products/bulk` | Bulk upload |
| PUT | `/api/v1/admin/catalogue/products/{id}` | Update product |
| DELETE | `/api/v1/admin/catalogue/products/{id}` | Hard delete |
| DELETE | `/api/v1/admin/catalogue/products/{id}/soft` | Soft delete |
| POST | `/api/v1/admin/catalogue/products/{id}/restore` | Restore |

#### Variant & Option Management
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/admin/catalogue/products/{id}/variants` | Create variant |
| PUT | `/api/v1/admin/catalogue/variants/{id}` | Update variant |
| DELETE | `/api/v1/admin/catalogue/variants/{id}` | Delete variant |
| POST | `/api/v1/admin/catalogue/variants/{id}/options` | Create option |
| PUT | `/api/v1/admin/catalogue/options/{id}` | Update option |
| PATCH | `/api/v1/admin/catalogue/options/{id}/stock` | Update stock |
| DELETE | `/api/v1/admin/catalogue/options/{id}` | Delete option |

#### Media Upload & Management
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/admin/media/health` | Cloudinary health check |
| POST | `/api/v1/admin/media/product-variant` | Upload variant media |
| POST | `/api/v1/admin/media/product-variant/bulk` | Bulk upload |
| POST | `/api/v1/admin/media/catalogue-banner` | Upload catalogue banner |
| POST | `/api/v1/admin/media/category-banner` | Upload category banner |
| POST | `/api/v1/admin/media/global` | Upload global media |
| PUT | `/api/v1/admin/media/{id}` | Update metadata |
| PUT | `/api/v1/admin/media/{id}/replace` | Replace file |
| DELETE | `/api/v1/admin/media/{id}` | Delete media |
| PATCH | `/api/v1/admin/media/bulk/display-order` | Bulk reorder |
| PATCH | `/api/v1/admin/media/variant/{vid}/primary/{mid}` | Set primary |

## 📋 Example API Requests

### Get Optimized Product Listing

```bash
GET /api/v1/catalogue/products/listing?category_id=1&in_stock_only=true&page=1&per_page=20
```

Response:
```json
{
  "items": [
    {
      "id": 1,
      "name": "AirFlex Pro Runner",
      "slug": "airflex-pro-runner",
      "price": 299900,
      "mrp": 399900,
      "discount_percentage": 25.0,
      "primary_image_url": "https://res.cloudinary.com/...",
      "catalogue_ids": [1, 2],
      "in_stock": true
    }
  ],
  "total": 50,
  "page": 1,
  "per_page": 20,
  "pages": 3,
  "filters_applied": {"category_id": 1, "in_stock_only": true}
}
```

### Get Product Availability

```bash
GET /api/v1/catalogue/products/1/availability
```

Response:
```json
{
  "product_id": 1,
  "product_name": "AirFlex Pro Runner",
  "available": true,
  "total_stock": 83,
  "variant_count": 3,
  "variants": [
    {
      "variant_id": 1,
      "variant_name": "Midnight Black",
      "color": "#000000",
      "in_stock": true,
      "total_stock": 45,
      "available_sizes": ["7", "8", "9", "10"],
      "primary_image_url": "https://res.cloudinary.com/..."
    }
  ]
}
```

### Replace Media File

```bash
PUT /api/v1/media/123/replace
Content-Type: multipart/form-data

file=@new-image.jpg
```

## 🔒 Validation Rules

### Media Validation (Backend Enforced)
- ✅ Only one primary image per variant + usage_type
- ✅ Cannot delete last catalogue image for a variant
- ✅ Auto-promote next image when deleting primary
- ✅ Media upload blocked for archived products

### Slug Collision Strategy
- Auto-generated slugs check for duplicates
- If `airflex-running-shoe` exists → `airflex-running-shoe-2`

### Product Status Enforcement
- `draft` → Not visible publicly
- `live` → Visible and purchasable
- `archived` → Not purchasable, media upload blocked

### Soft Delete
- All entities support `deleted_at` column
- Soft-deleted items excluded from listings
- Can be restored via restore endpoints

## 🗄️ Database Schema

The application uses SQLite with soft delete support:

### Catalogue Tables
| Table | Soft Delete |
|-------|-------------|
| `categories` | ✅ |
| `catalogues` | ✅ |
| `products` | ✅ |
| `product_variants` | ✅ |
| `variant_options` | ❌ |
| `media_assets` | ✅ |
| `footwear_details` | ❌ |

### User & Auth Tables
| Table | Purpose |
|-------|---------|
| `user_profile` | Business user data (linked to Supabase auth) |
| `auth_meta` | Login metadata |
| `user_preferences` | User preferences |
| `roles` | System roles (ADMIN, CUSTOMER, DELIVERY) |
| `user_roles` | User-Role mapping (many-to-many) |
| `user_audit_log` | Audit trail for compliance |

## 🔐 Authentication & Authorization

### Supabase Auth Integration
- ✅ Supabase handles ALL authentication & identity
- ❌ No passwords in SQLite
- ❌ No users table in SQLite (only user_profile linked to Supabase)
- ✅ SQLite = business data only
- ✅ Supabase user_id (UUID) is the global user identifier

### Auth Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/auth/send-otp` | Send OTP to phone |
| POST | `/api/v1/auth/verify-otp` | Verify OTP & login/register |
| POST | `/api/v1/auth/refresh` | Refresh access token |
| POST | `/api/v1/auth/logout` | Logout |
| GET | `/api/v1/auth/me` | Get current user profile |
| PUT | `/api/v1/auth/me` | Update profile |
| GET | `/api/v1/auth/me/preferences` | Get preferences |
| PUT | `/api/v1/auth/me/preferences` | Update preferences |

### Admin Auth Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/auth/users/{id}` | Get user (Admin) |
| POST | `/api/v1/auth/users/{id}/block` | Block user (Admin) |
| POST | `/api/v1/auth/users/{id}/unblock` | Unblock user (Admin) |
| GET | `/api/v1/auth/roles` | List roles (Admin) |
| POST | `/api/v1/auth/users/{id}/roles` | Assign role (Admin) |
| DELETE | `/api/v1/auth/users/{id}/roles/{role}` | Remove role (Admin) |

### Role-Based Access Control
```python
# In your router endpoints:
from utils.auth_dependencies import require_admin, require_customer, get_current_user

@router.get("/admin-only")
async def admin_endpoint(user: CurrentUser = Depends(require_admin)):
    ...

@router.get("/customer-only")  
async def customer_endpoint(user: CurrentUser = Depends(require_customer)):
    ...

@router.get("/any-authenticated")
async def auth_endpoint(user: CurrentUser = Depends(get_current_user)):
    ...
```

### Security Rules
- OTP expiry: **5 minutes**
- OTP attempts: **max 3**
- Rate limit on `/send-otp`
- JWT required for: Checkout, Address, Orders
- Admin APIs require `ADMIN` role
- No password stored outside Supabase

## ⚠️ Important Backend Rules

- ❌ Do NOT infer meaning from Cloudinary folder names
- ❌ Do NOT rely on Cloudinary upload order
- ❌ Do NOT store images without DB entry
- ❌ Do NOT hardcode image sequence
- ❌ Do NOT store passwords in SQLite
- ✅ DB is the source of truth
- ✅ Backend enforces all rules
- ✅ Frontend only renders
- ✅ Supabase handles ALL auth

## 📈 Future Enhancements

- [ ] PostgreSQL support for production
- [ ] Redis caching layer
- [ ] Elasticsearch for product search
- [ ] Clothing and Accessories details
- [x] ~~User authentication & authorization~~ ✅ DONE
- [ ] Order management
- [ ] Inventory tracking
- [ ] Analytics dashboard
- [ ] Address management
- [ ] Wishlist / Cart

## 📄 License

MIT License

