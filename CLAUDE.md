# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a full-stack ecommerce platform with customizable product design capabilities, consisting of:
- **FastAPI Backend** (`fastapi_ecommerce-main/`): Python-based REST API server
- **Admin Dashboard** (`frontend/admin-ecommerce-cp-main/`): Next.js 15 admin control panel
- **Customer Frontend** (`frontend/customized_product_ecommerce-main/`): Next.js customer-facing app with product customization

## Development Commands

### Backend (FastAPI)
```bash
cd fastapi_ecommerce-main
# Install dependencies
pip install -r requirements.txt

# Run development server
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000

# Database migrations
alembic upgrade head
alembic revision --autogenerate -m "description"

# Create database tables
python create_tables.py
```

### Admin Dashboard
```bash
cd frontend/admin-ecommerce-cp-main
npm install
npm run dev          # Development server (port 3000)
npm run build        # Production build
npm run lint         # ESLint check
```

### Customer Frontend
```bash
cd frontend/customized_product_ecommerce-main
npm install
npm run dev          # Development server (port 3000)
npm run build        # Production build
npm run lint         # ESLint check
```

## Architecture

### Backend Structure (FastAPI)
- **Router-based architecture**: Each domain (users, products, orders, etc.) has its own router
- **Service layer pattern**: Business logic separated from API routes
- **SQLAlchemy ORM**: Database models and relationships
- **JWT Authentication**: Token-based auth with refresh tokens
- **File upload system**: Static file serving for product images
- **Database**: MySQL with async support via databases library

Key domains:
- `app/auth/`: Authentication and authorization
- `app/products/`: Product management with variations and customization
- `app/cart/`: Shopping cart functionality
- `app/orders/`: Order processing and management
- `app/users/`: User management and profiles
- `app/reviews/`: Product review system
- `app/shipping/`: Shipping methods and addresses
- `app/payment/`: Payment processing
- `app/uploads/`: File upload handling

### Frontend Architecture

**Admin Dashboard (Next.js 15 + Ant Design)**:
- App Router with TypeScript
- Zustand for state management
- Ant Design UI components with dark/light theme
- JWT authentication with auto-refresh
- File upload capabilities
- Comprehensive CRUD interfaces for all backend entities

**Customer Frontend (Next.js 15)**:
- App Router with TypeScript  
- Zustand for state management
- Fabric.js for product design canvas
- Responsive Tailwind CSS styling
- Real-time design preview generation
- Shopping cart with customization support

## Key Integration Points

### API Communication
- Backend serves on `http://127.0.0.1:8000`
- Admin dashboard expects backend at this URL
- Customer frontend also connects to same backend
- CORS configured for local development (currently allows all origins for testing)

### File Handling
- Product images stored in `fastapi_ecommerce-main/app/static/products/`
- Served via `/images` static file mount
- Upload endpoints handle file validation and storage
- Both frontends have upload functionality

### Authentication Flow
- JWT tokens with access/refresh pattern
- Tokens stored in localStorage on frontend
- Automatic token refresh via HTTP interceptors
- Role-based access (admin vs customer)

## Database Schema
- Users with roles (admin, customer)
- Products with variations and customization options
- Orders with items and shipping details
- Reviews linked to products and users
- Cart persistence for logged-in users
- Shipping methods and addresses
- Payment methods and processing

## Current Branch Context
Working on `cart-page-product-image` branch with recent cart page image functionality improvements.