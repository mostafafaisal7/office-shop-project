# Office Shop Project - Comprehensive Architecture Analysis

## 1. PROJECT STRUCTURE OVERVIEW

### Directory Layout
```
/home/user/office-shop-project/
├── fastapi_ecommerce-main/          # Backend (FastAPI)
│   ├── app/                         # Main application code
│   │   ├── main.py                  # FastAPI entry point
│   │   ├── auth/                    # Authentication module
│   │   ├── users/                   # User management
│   │   ├── products/                # Product management
│   │   ├── cart/                    # Shopping cart
│   │   ├── orders/                  # Order processing
│   │   ├── checkout/                # Checkout functionality
│   │   ├── shipping/                # Shipping management
│   │   ├── payment/                 # Payment processing
│   │   ├── categories/              # Product categories
│   │   ├── reviews/                 # Product reviews
│   │   ├── discounts/               # Discount management
│   │   ├── uploads/                 # File uploads
│   │   ├── core/                    # Core configuration
│   │   │   ├── config.py            # Configuration management
│   │   │   ├── database.py          # Database setup
│   │   │   ├── hashing.py           # Password hashing
│   │   │   └── sync_database.py     # Database sync utilities
│   │   ├── common/                  # Shared utilities
│   │   │   ├── dependencies.py      # FastAPI dependencies
│   │   │   ├── enums.py             # Enumerations
│   │   │   ├── models.py            # Mixin models
│   │   │   ├── otp_utils.py         # OTP generation
│   │   │   ├── sms_utils.py         # SMS sending
│   │   │   ├── email_utils.py       # Email sending
│   │   │   ├── email_templates.py   # Email HTML templates
│   │   │   └── user_repo.py         # User repository
│   │   ├── utils/                   # Utilities
│   │   │   └── media.py             # Media conversion utilities
│   │   ├── static/                  # Static files
│   │   │   ├── products/            # Product images
│   │   │   ├── users/               # User images
│   │   │   ├── categories/          # Category images
│   │   │   └── previews/            # Design previews
│   │   └── uploads/                 # Upload directory
│   ├── alembic/                     # Database migrations
│   │   └── versions/                # Migration scripts
│   ├── venv/                        # Python virtual environment
│   ├── .env                         # Environment variables
│   ├── requirements.txt             # Python dependencies
│   ├── alembic.ini                  # Alembic configuration
│   └── app/main.py                  # Application entry point
│
├── frontend/
│   ├── customized_product_ecommerce-main/   # Customer-facing frontend
│   │   ├── src/
│   │   │   ├── app/                 # Next.js app directory (pages)
│   │   │   ├── components/          # React components
│   │   │   ├── services/            # API client services
│   │   │   ├── store/               # Zustand state management
│   │   │   ├── hooks/               # Custom React hooks
│   │   │   ├── types/               # TypeScript type definitions
│   │   │   ├── utils/               # Utility functions
│   │   │   ├── contexts/            # React contexts
│   │   │   └── data/                # Static data
│   │   ├── public/                  # Static public assets
│   │   ├── package.json             # Dependencies
│   │   ├── tsconfig.json            # TypeScript configuration
│   │   ├── tailwind.config.ts       # Tailwind CSS configuration
│   │   ├── next.config.ts           # Next.js configuration
│   │   └── postcss.config.mjs       # PostCSS configuration
│   │
│   └── admin-ecommerce-cp-main/     # Admin dashboard frontend
│       ├── src/
│       │   ├── app/                 # Next.js app directory
│       │   ├── components/          # Admin components
│       │   ├── services/            # API services
│       │   ├── types/               # Type definitions
│       │   ├── hooks/               # Custom hooks
│       │   └── utils/               # Utilities
│       ├── package.json
│       ├── tsconfig.json
│       ├── next.config.ts
│       └── postcss.config.mjs
│
├── package.json                     # Root package.json
├── .env files and docs             # Documentation and configurations
└── git repository                  # Version control
```

---

## 2. ALL CONFIGURATION FILES AND THEIR PURPOSES

### Backend Configuration

#### **`.env` (Backend)**
**Location**: `/home/user/office-shop-project/fastapi_ecommerce-main/.env`

**Contents**:
```
DATABASE_URL=mysql+aiomysql://niloy:niloy940@localhost:3306/fastapi_ecommerce
SECRET_KEY=your_super_secret_key
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=3600
REFRESH_TOKEN_EXPIRE_DAYS=7
ANTHROPIC_API_KEY=your_api_key_here
SMS_PROVIDER=greenweb
GREENWEB_API_KEY=your_greenweb_api_key
GREENWEB_URL=http://api.greenweb.com.bd/api.php
```

**Purpose**: Stores sensitive configuration and environment-specific settings for the backend.

#### **`alembic.ini` (Database Migrations)**
**Location**: `/home/user/office-shop-project/fastapi_ecommerce-main/alembic.ini`

**Key Settings**:
- `script_location = alembic` - Migration scripts directory
- `sqlalchemy.url = mysql+pymysql://niloy:niloy940@localhost:3306/fastapi_ecommerce` - Database connection
- Logging configuration for alembic

**Purpose**: Configures SQLAlchemy database migrations tool.

#### **`requirements.txt` (Python Dependencies)**
**Location**: `/home/user/office-shop-project/fastapi_ecommerce-main/requirements.txt`

**Key Dependencies**:
- `fastapi==0.116.1` - Web framework
- `sqlalchemy==2.0.43` - ORM
- `aiomysql==0.2.0` - Async MySQL driver
- `databases==0.9.0` - Async database abstraction
- `pydantic==2.11.7` - Data validation
- `python-jose==3.5.0` - JWT tokens
- `bcrypt==4.3.0` - Password hashing
- `passlib==1.7.4` - Password utilities
- `uvicorn==0.35.0` - ASGI server
- `aiofiles` - Async file operations
- `requests==2.32.4` - HTTP client
- `pillow==11.3.0` - Image processing
- `python-dotenv==1.1.1` - Environment variables
- `reportlab==4.4.3` - PDF generation
- And many more...

#### **`app/core/config.py` (Application Configuration)**
Reads from environment variables:
- `DATABASE_URL` - Database connection string
- `BASE_URL` - Backend base URL (default: http://127.0.0.1:8000)
- `FRONTEND_URL` - Frontend URL for email links (default: http://localhost:3000)

#### **`app/core/database.py` (Database Setup)**
Configures:
- Async database connection with `Database` class
- SQLAlchemy async engine
- Async session maker
- Database dependency injection for routes

### Frontend Configuration

#### **`frontend/customized_product_ecommerce-main/package.json`** (Customer Frontend)
```json
{
  "name": "ecommerce-cp",
  "version": "0.1.0",
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  },
  "dependencies": {
    "next": "15.3.3",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "zustand": "^5.0.5",
    "fabric": "^6.7.0",
    "lucide-react": "^0.516.0",
    "clsx": "^2.1.1"
  },
  "devDependencies": {
    "typescript": "^5",
    "@types/node": "^20",
    "@types/react": "^19",
    "@types/react-dom": "^19",
    "tailwindcss": "^4",
    "@tailwindcss/postcss": "^4"
  }
}
```

**Purpose**: Defines customer-facing storefront with product customization (Fabric.js design tool).

#### **`frontend/admin-ecommerce-cp-main/package.json`** (Admin Dashboard)
```json
{
  "name": "admin-cp",
  "version": "0.1.0",
  "scripts": {
    "dev": "next dev --turbopack",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  },
  "dependencies": {
    "next": "15.3.5",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "antd": "^5.26.4",
    "@ant-design/icons": "^6.0.0",
    "@tanstack/react-query": "^5.82.0",
    "axios": "^1.10.0",
    "zustand": "^5.0.6",
    "@tinymce/tinymce-react": "^6.2.1",
    "recharts": "^3.1.0",
    "dayjs": "^1.11.13"
  },
  "devDependencies": {
    "typescript": "^5",
    "tailwindcss": "^4"
  }
}
```

**Purpose**: Admin panel for managing products, orders, users, and content.

#### **`frontend/customized_product_ecommerce-main/next.config.ts`** (Customer Frontend Config)
```typescript
const nextConfig: NextConfig = {
  images: {
    domains: ['images.unsplash.com', '127.0.0.1', 'localhost'],
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://127.0.0.1:8000/:path*',
      },
    ];
  },
};
```

**Key Features**:
- Image domain whitelist for Next.js Image optimization
- API proxy rewrites `/api/*` requests to backend on `http://127.0.0.1:8000`

#### **`frontend/admin-ecommerce-cp-main/next.config.ts`** (Admin Dashboard Config)
```typescript
const nextConfig = {
  experimental: {
    turbo: false  // Disabled Turbopack
  },
  images: {
    domains: ['cdn.tiny.cloud', 'localhost', '127.0.0.1', 'your-backend.com'],
  },
  async headers() {
    return [{
      source: '/(.*)',
      headers: [{
        key: 'Content-Security-Policy',
        value: [
          "default-src 'self';",
          "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://cdn.tiny.cloud;",
          "connect-src 'self' https://cdn.tiny.cloud https://sp.tinymce.com;",
          "img-src 'self' data: blob: https://cdn.tiny.cloud https://sp.tinymce.com http://localhost:8000 http://127.0.0.1:8000;",
          "style-src 'self' 'unsafe-inline' https://cdn.tiny.cloud;",
          "font-src 'self' https://cdn.tiny.cloud;"
        ].join(' ')
      }]
    }]
  }
};
```

**Key Features**:
- TinyMCE WYSIWYG editor support
- Content Security Policy headers for image sources
- Backend domain whitelist

#### **`tailwind.config.ts`** (Both Frontends)
Configured with:
- CSS custom properties for theming
- Extended color scheme
- Responsive design utilities
- Dark mode class strategy

#### **`tsconfig.json`** (Both Frontends)
Typescript configuration with:
- Path aliases: `@/*` maps to `./src/*`
- ES2017+ target
- Strict type checking

---

## 3. TECHNOLOGY STACK

### Backend Stack

**Core Framework**:
- **FastAPI 0.116.1** - Modern Python async web framework with automatic API documentation
- **Uvicorn 0.35.0** - ASGI application server

**Database & ORM**:
- **MySQL** - Primary relational database
- **SQLAlchemy 2.0.43** - Async ORM for data modeling
- **Alembic** - Database schema migration tool
- **aiomysql 0.2.0** - Async MySQL driver
- **PyMySQL 1.1.1** - Python MySQL driver
- **databases 0.9.0** - Async database abstraction layer

**Data Validation & Serialization**:
- **Pydantic 2.11.7** - Data validation using Python type hints
- **pydantic-core 2.33.2** - Core validation engine

**Authentication & Security**:
- **python-jose 3.5.0** - JWT token generation and verification
- **bcrypt 4.3.0** - Password hashing
- **passlib 1.7.4** - Password utilities
- **cryptography 45.0.6** - Cryptographic operations
- **ECDSA 0.19.1** - Digital signature scheme
- **PyASN1 0.6.1** - ASN.1 encoding/decoding

**Image & File Processing**:
- **Pillow 11.3.0** - Image manipulation
- **reportlab 4.4.3** - PDF generation (for print-ready designs)

**Utilities**:
- **python-dotenv 1.1.1** - Environment variable management
- **python-slugify 8.0.4** - URL slug generation
- **requests 2.32.4** - HTTP client for external APIs
- **email-validator 2.2.0** - Email validation
- **greenlet 3.2.4** - Lightweight concurrency

**API & Networking**:
- **httpcore 1.0.9** - Low-level HTTP client
- **httpx 0.28.1** - Modern HTTP client
- **urllib3 2.5.0** - HTTP client library

### Frontend Stack

**Core Framework**:
- **Next.js 15** (Customer: 15.3.3, Admin: 15.3.5) - React framework with SSR
- **React 19.0.0** (Customer) / **React 18.3.1** (Admin) - UI library
- **TypeScript 5** - Type-safe JavaScript

**UI Libraries & Components**:
- **Customer**:
  - **Tailwind CSS 4** - Utility-first CSS framework
  - **Lucide React 0.516.0** - Icon library
  - **clsx 2.1.1** - Classname utility
  
- **Admin**:
  - **Ant Design 5.26.4** - Enterprise UI component library
  - **@ant-design/icons 6.0.0** - Icon set
  - **@ant-design/nextjs-registry 1.0.2** - Next.js integration
  - **Tailwind CSS 4** - Utility-first CSS

**State Management**:
- **Zustand 5.0.5/5.0.6** - Lightweight state management
  - Admin dashboard state: `authStore.ts`, `designStore.ts`, `cartStore.ts`, `shippingStore.ts`

**HTTP Client**:
- **Axios** - HTTP client with interceptors (Admin)
- **Fetch API** - Native HTTP client (Customer)

**Rich Text Editors** (Admin):
- **TinyMCE 7.9.1** - WYSIWYG editor
- **@tinymce/tinymce-react 6.2.1** - React wrapper
- **react-draft-wysiwyg 1.15.0** - Draft.js editor
- **react-quill 2.0.0** - Quill editor

**Data Visualization** (Admin):
- **Recharts 3.1.0** - React charting library

**Design Tool** (Customer):
- **Fabric.js 6.7.0** - Canvas manipulation library for t-shirt design

**Date & Time**:
- **dayjs 1.11.13** - Date/time library

**Utilities**:
- **lodash 4.17.21** - Utility library
- **uuid 11.1.0** - UUID generation

**Data Fetching** (Admin):
- **@tanstack/react-query 5.82.0** - Server state management (planned)

---

## 4. ENTRY POINTS FOR FRONTEND & BACKEND

### Backend Entry Point

**File**: `/home/user/office-shop-project/fastapi_ecommerce-main/app/main.py`

**Key Details**:
- **Framework**: FastAPI
- **Port**: 8000 (default)
- **Startup**: Creates async database connections
- **Shutdown**: Closes database connections
- **CORS Configuration**: Allows `http://localhost:3000` and `http://127.0.0.1:3000`

**Lifespan Context Manager**:
```python
@asynccontextmanager
async def lifespan(app: FastAPI):
    await database.connect()  # On startup
    yield
    await database.disconnect()  # On shutdown
```

**Registered Routers** (11 total):
1. `/users` - User management
2. `/auth` - Authentication
3. `/categories` - Product categories
4. `/products` - Products with media
5. `/reviews` - Product reviews
6. `/cart` - Shopping cart
7. `/orders` - Order management
8. `/shipping` - Shipping methods
9. `/payment` - Payment processing
10. `/checkout` - Checkout flow
11. `/discounts` - Discount rules
12. `/uploads` - File uploads

**Router Line Counts** (by importance/size):
- `/orders` - 1,027 lines (largest)
- `/auth` - 1,020 lines
- `/products` - 636 lines
- `/discounts` - 349 lines
- `/uploads` - 269 lines
- `/reviews` - 243 lines
- `/shipping` - 238 lines
- `/cart` - 156 lines
- `/users` - 125 lines
- `/categories` - 81 lines
- `/payment` - 28 lines
- `/checkout` - 11 lines (minimal)

**Static File Serving**:
```python
app.mount("/images", CORSMiddlewareStatic(directory="app/static"), name="images")
```
- Serves images from `/app/static/products/`, `/app/static/users/`, `/app/static/categories/`, `/app/static/previews/`

### Frontend Entry Points

#### **Customer Frontend Entry Point**
**Framework**: Next.js 15 with App Router
**Directory**: `/home/user/office-shop-project/frontend/customized_product_ecommerce-main/src/app`
**Port**: 3000 (development)
**Build Output**: `.next/` directory (production)

**Key Files**:
- `layout.tsx` - Root layout wrapper
- `page.tsx` - Homepage
- Dynamic pages for products, categories, checkout, etc.

**Run Commands**:
```bash
npm run dev      # Development server
npm run build    # Production build
npm run start    # Production server
npm run lint     # ESLint
```

#### **Admin Dashboard Entry Point**
**Framework**: Next.js 15 with App Router
**Directory**: `/home/user/office-shop-project/frontend/admin-ecommerce-cp-main/src/app`
**Port**: 3000 (development) - runs on separate instance
**Build Output**: `.next/` directory (production)

**Run Commands**:
```bash
npm run dev      # Development with Turbopack disabled
npm run build    # Production build
npm run start    # Production server
npm run lint     # ESLint
```

---

## 5. CURRENT DEPLOYMENT/BUILD SETUP

### Backend Deployment

**Current Setup**: Local development only

**Build Process**:
1. Create Python virtual environment: `venv/`
2. Install dependencies: `pip install -r requirements.txt`
3. Run database migrations: `alembic upgrade head`
4. Start server: `uvicorn app.main:app --host 0.0.0.0 --port 8000`

**Production Considerations**:
- No Docker configuration currently
- Manual venv management required
- Need to configure Uvicorn for production (workers, reload disabled, etc.)
- No systemd service or supervisord configuration

### Frontend Deployment

**Current Setup**: Local development only

**Build Process** (both frontends identical):
```bash
cd frontend/[frontend-name]
npm install
npm run build
npm run start
```

**Production Considerations**:
- Static export could be enabled for static hosting
- No Docker configuration
- Environment variables hardcoded in some places
- Next.js standalone output mode would be ideal for cPanel

**Build Output**:
- `.next/` directory contains optimized production build
- Static files in `public/`
- Requires Node.js runtime for server-side rendering

---

## 6. ENVIRONMENT CONFIGURATION

### Backend Environment Variables

**File**: `.env` in backend root

```env
# Database Configuration
DATABASE_URL=mysql+aiomysql://user:password@host:port/database

# JWT Authentication
SECRET_KEY=your_super_secret_key
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=3600
REFRESH_TOKEN_EXPIRE_DAYS=7

# Third-party Services
ANTHROPIC_API_KEY=your_api_key_here

# SMS Configuration
SMS_PROVIDER=greenweb
GREENWEB_API_KEY=your_greenweb_api_key
GREENWEB_URL=http://api.greenweb.com.bd/api.php
```

**Configuration Code** (`app/core/config.py`):
```python
DATABASE_URL = os.getenv("DATABASE_URL")
BASE_URL = os.getenv("BASE_URL", "http://127.0.0.1:8000")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")
```

**Loaded via** `python-dotenv`:
```python
from dotenv import load_dotenv
load_dotenv()
```

### Frontend Environment Variables

**Customer Frontend** (`src/services/api.ts`):
```typescript
const API_BASE_URL = typeof window === 'undefined' 
  ? 'http://127.0.0.1:8000'        // Server-side
  : '/api';                         // Client-side (uses Next.js proxy)
```

**Admin Dashboard** (`src/services/api.ts`):
```typescript
import { API_BASE_URL } from '@/utils/constants';
export const API_BASE_URL = 'http://127.0.0.1:8000';
```

**Backend URL Configuration** (Admin Dashboard - `src/services/api.ts`):
```typescript
const API_BASE_URL = typeof window === 'undefined' 
  ? 'http://127.0.0.1:8000'  // Server-side
  : 'http://127.0.0.1:8000'; // Client-side
```

### Environment Configuration for cPanel Deployment

**Recommended Structure**:
```
production.env
staging.env
development.env
```

**cPanel-specific Settings**:
```env
# Database (cPanel MySQL)
DATABASE_URL=mysql+aiomysql://cpanel_user:password@localhost:3306/dbname

# URLs (for cPanel domain)
BASE_URL=https://yourdomain.com
FRONTEND_URL=https://yourdomain.com

# API Proxy (customer frontend)
# Update Next.js rewrites for production domain
NEXT_PUBLIC_API_BASE_URL=https://yourdomain.com/api
```

---

## 7. DATABASE CONNECTION PATTERNS

### Backend Database Architecture

**Connection Type**: Async MySQL with connection pooling

**Connection String Format**:
```
mysql+aiomysql://username:password@host:port/database
```

**Database Setup** (`app/core/database.py`):
```python
from databases import Database
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker

# Async database for query interface
database = Database(DATABASE_URL)

# Async engine for ORM operations
engine = create_async_engine(DATABASE_URL, echo=True)
async_session_maker = async_sessionmaker(bind=engine, expire_on_commit=False)

# Dependency for route handlers
async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with async_session_maker() as session:
        yield session
```

**Connection Lifecycle**:
1. **Startup**: `await database.connect()` in FastAPI lifespan
2. **Per-Request**: Dependency injection via `Depends(get_db)`
3. **Shutdown**: `await database.disconnect()` in FastAPI lifespan

### Database Models (SQLAlchemy 2.0)

**Base Model**:
```python
from app.core.database import Base
from sqlalchemy.orm import declarative_base

class ModelName(Base):
    __tablename__ = "table_name"
    # Column definitions...
```

**Key Mixins**:
- `TimestampMixin` - Adds `created_at`, `updated_at` fields
- `SoftDeleteMixin` - Adds `is_deleted` field
- `UserTrackingMixin` - Adds `created_by`, `updated_by` fields

### Database Schema Overview

**Core Tables**:
1. **users** - Customer accounts
2. **otp_codes** - OTP verification
3. **products** - Product catalog
4. **product_variations** - SKU variants
5. **product_media** - Product images
6. **product_categories** - Category assignments
7. **customization_options** - Design data (Fabric.js)
8. **customization_option_media** - Design assets
9. **cart_items** - Shopping cart with design data
10. **orders** - Customer orders
11. **reviews** - Product reviews
12. **shipping** - Shipping methods
13. **payment** - Payment records
14. **discounts** - Discount rules
15. **refresh_tokens** - JWT refresh tokens
16. **password_reset_tokens** - Password reset tokens

### Database Migrations

**Location**: `/fastapi_ecommerce-main/alembic/versions/`

**Existing Migrations**:
1. `e8802b9fbad6_initial_tables.py` - Creates all base tables
2. `e17df6a38a94_shipping_table.py` - Shipping configuration
3. `6b6cc1cb2a00_add_customized_images_to_cart_items.py` - Design preview images
4. `d8e9f0a1b2c3_add_design_data_to_cart_items.py` - Canvas/SVG data
5. `a1b2c3d4e5f6_add_svg_data_fields_for_designs.py` - SVG design fields
6. `f1a2b3c4d5e6_add_cart_indexes_for_deduplication.py` - Performance indexes

**Migration Commands**:
```bash
alembic upgrade head              # Apply all migrations
alembic downgrade -1              # Rollback last migration
alembic revision --autogenerate   # Generate new migration
```

### Connection Pooling & Performance

**Indexes** (from migrations):
- `idx_cart_user_product_size_custom` - Cart deduplication
- `idx_cart_guest_product_size_custom` - Guest cart queries
- Standard indexes on foreign keys and frequently queried fields

**Async Advantages**:
- Non-blocking database I/O
- Better resource utilization under load
- Supports concurrent requests

---

## 8. API ENDPOINT PATTERNS AND BASE URLS

### API Architecture

**Base URL**: `http://127.0.0.1:8000` (development)

**Authentication**: JWT Bearer tokens
- Header: `Authorization: Bearer {token}`
- Token stored in localStorage (frontend)
- Automatic refresh on 401 responses

**Response Format**: JSON

**Error Handling**: HTTP status codes with JSON error messages

### Complete API Endpoint Map

#### **Authentication** (`/auth`)
```
POST   /auth/register                 # Register new user
POST   /auth/login                    # Login with email/password
POST   /auth/refresh                  # Refresh JWT token
POST   /auth/verify-email             # Verify email address
POST   /auth/resend-verification      # Resend verification email
POST   /auth/forgot-password          # Initiate password reset
POST   /auth/reset-password           # Confirm password reset
POST   /auth/verify-otp              # Verify OTP code
POST   /auth/send-otp                # Send OTP to phone
```

**Auth Routes** (1,020 lines):
- Email/password registration and login
- OTP verification for phone numbers
- JWT token management (access + refresh tokens)
- Password reset flow with email verification
- Email verification with token expiry

#### **Users** (`/users`)
```
GET    /users/me                      # Get current user profile
GET    /users/{user_id}               # Get user by ID
GET    /users/admin-only              # Admin-only endpoint
PUT    /users/{user_id}               # Update user profile
GET    /users/email/{email}           # Get user by email
GET    /users/phone/{phone}           # Get user by phone
```

**Users Routes** (125 lines):
- Profile management
- User lookups
- Admin-only user listing

#### **Products** (`/products`)
```
GET    /products/                     # List products with filters & pagination
GET    /products/{product_id}         # Get product details
POST   /products/                     # Create product (admin)
PUT    /products/{product_id}         # Update product (admin)
DELETE /products/{product_id}         # Delete product (admin)

POST   /products/{product_id}/upload-image    # Upload product image (admin)

GET    /products/{id}/variations      # Get product variations
POST   /products/{id}/variations      # Create variation (admin)

GET    /products/search               # Search products
```

**Products Routes** (636 lines):
- Complex filtering by category, price, customizable status, tags
- Pagination support
- Media management
- Variation handling
- Admin CRUD operations

**Query Parameters**:
```
?q=search_term
&category_id=123
&status=active|draft|archived
&is_customizable=true|false
&min_price=0&max_price=1000
&tags=tag1,tag2
&sort_by=name|price|base_price|created_at
&sort_order=asc|desc
&page=1&per_page=20
```

#### **Categories** (`/categories`)
```
GET    /categories/                   # List all categories (hierarchical)
GET    /categories/{id}               # Get category details
GET    /categories/slug/{slug}        # Get category by URL slug
POST   /categories/                   # Create category (admin)
PUT    /categories/{id}               # Update category (admin)
DELETE /categories/{id}               # Delete category (admin)
```

**Categories Routes** (81 lines):
- Hierarchical category structure (parent_id support)
- Slug-based lookups for SEO-friendly URLs

#### **Cart** (`/cart`)
```
GET    /cart/                         # Get user's cart
GET    /cart/guest/{guest_id}         # Get guest cart
POST   /cart/                         # Add item to cart
PUT    /cart/{item_id}                # Update cart item quantity
DELETE /cart/{item_id}                # Remove item from cart
DELETE /cart/                         # Clear entire cart

POST   /cart/sync                     # Sync cart (guest to user)
```

**Cart Routes** (156 lines):
- Supports both authenticated users and guest carts
- Tracks customization data (design preview images, canvas JSON, SVG)
- Prevents duplicate items (same product + size + customization)
- Design data storage for print-ready files

**Cart Item Structure**:
```json
{
  "id": 1,
  "user_id": 123,
  "guest_id": "uuid",
  "product_id": 1,
  "product_name": "T-Shirt",
  "product_price": 29.99,
  "quantity": 2,
  "size": "M",
  "color": "Blue",
  "customization_id": 5,
  "customized_images": ["url1", "url2"],
  "design_canvas_data": {...},
  "design_svg_data": "<svg>...</svg>",
  "design_elements": [...]
}
```

#### **Orders** (`/orders`)
```
GET    /orders/                       # List user's orders
GET    /orders/{order_id}             # Get order details
POST   /orders/                       # Create order from cart
PUT    /orders/{order_id}             # Update order status (admin)
DELETE /orders/{order_id}             # Cancel order

GET    /orders/{order_id}/history     # Get order status history
POST   /orders/{order_id}/cancel      # Cancel order
```

**Orders Routes** (1,027 lines - largest):
- Comprehensive order lifecycle management
- Status tracking (pending, confirmed, shipped, delivered, cancelled)
- Order history and tracking
- Admin order management

#### **Checkout** (`/checkout`)
```
POST   /checkout/                     # Process checkout
GET    /checkout/summary              # Get order summary
```

**Checkout Routes** (11 lines - minimal):
- Validates cart and inventory
- Calculates totals with discounts
- Initiates payment processing

#### **Payment** (`/payment`)
```
POST   /payment/process               # Process payment
GET    /payment/methods               # Get available payment methods
POST   /payment/webhook               # Payment gateway webhook
```

**Payment Routes** (28 lines):
- Payment method management
- Webhook handling for payment gateways

#### **Shipping** (`/shipping`)
```
GET    /shipping/methods              # Get available shipping methods
POST   /shipping/methods              # Create method (admin)
GET    /shipping/rates                # Calculate shipping rates
POST   /shipping/track                # Track shipment
```

**Shipping Routes** (238 lines):
- Multiple shipping method support
- Rate calculation based on weight, location, dimensions
- Tracking integration

#### **Reviews** (`/reviews`)
```
GET    /reviews/products/{product_id}/reviews    # Get product reviews
POST   /reviews/                                  # Create review
GET    /reviews/{review_id}                       # Get review details
PUT    /reviews/{review_id}                       # Update review (admin)
DELETE /reviews/{review_id}                       # Delete review (admin)

GET    /reviews/products/{product_id}/summary    # Get review summary
```

**Reviews Routes** (243 lines):
- 5-star rating system
- Helpful review flagging
- Review summary with statistics
- Review approval workflow

#### **Discounts** (`/discounts`)
```
GET    /discounts/                    # List all discounts (admin)
POST   /discounts/                    # Create discount rule (admin)
PUT    /discounts/{id}                # Update discount (admin)
DELETE /discounts/{id}                # Delete discount (admin)

POST   /discounts/calculate           # Calculate applicable discounts
GET    /discounts/applicable          # Get applicable discounts for cart
```

**Discounts Routes** (349 lines):
- Multiple discount types (percentage, fixed amount, BOGO)
- Minimum quantity thresholds
- Category/product-specific rules
- Auto-calculation on cart operations

#### **Uploads** (`/uploads`)
```
POST   /uploads/image                 # Upload image file
POST   /uploads/product-media         # Upload product media
POST   /uploads/design-preview        # Upload design preview
DELETE /uploads/{file_id}             # Delete uploaded file

GET    /uploads/formats               # Get allowed file formats
```

**Uploads Routes** (269 lines):
- Multi-type file upload
- Image validation and processing
- Storage in `/app/static/` directories
- Return accessible URLs

### Image Serving

**Endpoint**: `GET /images/{upload_type}/{image_name}`

**Upload Types**:
- `products/` - Product catalog images
- `users/` - User avatars
- `categories/` - Category thumbnails
- `previews/` - Design preview images

**CORS Headers**: Automatically added for cross-origin requests

### Frontend API Integration

#### **Customer Frontend Base URL** (`src/services/api.ts`):
```typescript
const API_BASE_URL = typeof window === 'undefined' 
  ? 'http://127.0.0.1:8000'  // SSR: Direct backend
  : '/api';                   // Browser: Via Next.js proxy
```

**Next.js Proxy** (`next.config.ts`):
```typescript
async rewrites() {
  return [
    {
      source: '/api/:path*',
      destination: 'http://127.0.0.1:8000/:path*',
    },
  ];
}
```

#### **Admin Dashboard Base URL** (`src/services/api.ts`):
```typescript
export const API_BASE_URL = 'http://127.0.0.1:8000';
```

**HTTP Client**: Axios with interceptors for token management

### API Response Format

**Success Response** (200-201):
```json
{
  "data": {...},
  "message": "Success"
}
```

**Paginated Response**:
```json
{
  "products": [...],
  "total": 100,
  "page": 1,
  "per_page": 20,
  "pages": 5
}
```

**Error Response** (4xx-5xx):
```json
{
  "detail": "Error message",
  "status_code": 400
}
```

### Authentication Flow

1. **Registration**: POST `/auth/register` with email/password/phone
2. **Login**: POST `/auth/login` returns `access_token` and `refresh_token`
3. **Storage**: Tokens stored in localStorage
4. **Requests**: Authorization header: `Bearer {access_token}`
5. **Refresh**: POST `/auth/refresh` with `refresh_token` when 401 received
6. **Admin Check**: Routes use `require_admin()` dependency for role-based access

### Rate Limiting & Throttling

**Not Explicitly Configured** - cPanel deployment should add rate limiting

### CORS Configuration

**Allowed Origins** (current):
- `http://localhost:3000`
- `http://127.0.0.1:3000`

**For cPanel Production**, update to:
```python
allow_origins=["https://yourdomain.com", "https://admin.yourdomain.com"]
```

---

## Summary Table

| Aspect | Details |
|--------|---------|
| **Backend Framework** | FastAPI 0.116.1 |
| **Backend Language** | Python 3.9+ |
| **Backend Port** | 8000 |
| **Database** | MySQL (async with aiomysql) |
| **Frontend Framework** | Next.js 15 |
| **Frontend Language** | TypeScript + React |
| **Frontend Port** | 3000 |
| **State Management** | Zustand |
| **HTTP Client (Customer)** | Fetch API |
| **HTTP Client (Admin)** | Axios |
| **Design Tool** | Fabric.js (canvas-based) |
| **Authentication** | JWT (access + refresh tokens) |
| **API Documentation** | FastAPI Swagger UI at `/docs` |
| **Migrations** | Alembic 1.13+ |
| **Total API Endpoints** | 60+ |
| **Modules** | 12 (auth, users, products, cart, orders, etc.) |

