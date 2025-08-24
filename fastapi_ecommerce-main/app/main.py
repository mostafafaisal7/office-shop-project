from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.core.database import database
from app.users.router import router as users_router
from app.auth.router import router as auth_router
from app.products.router import router as products_router
from app.categories.router import router as categories_router
from app.cart.router import router as cart_router
from app.orders.router import router as orders_router
from app.shipping.router import router as shipping_router
from app.checkout.router import router as checkout_router
from app.payment.router import router as payment_router
from app.reviews.router import router as reviews_router
from app.discounts.router import router as discounts_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    await database.connect()
    yield
    # Shutdown
    await database.disconnect()

app = FastAPI(title="eCommerce API", lifespan=lifespan)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3001",
        "http://localhost:3002",
        "http://127.0.0.1:3002",
        "http://localhost:8080",
        "http://127.0.0.1:8080",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(users_router, prefix="/users", tags=["Users"])
app.include_router(auth_router, prefix="/auth", tags=["Auth"])
app.include_router(categories_router, prefix="/categories", tags=["Categories"])
app.include_router(products_router, prefix="/products", tags=["Products"])
app.include_router(reviews_router, prefix="/reviews", tags=["Reviews"])
app.include_router(cart_router, prefix="/cart", tags=["Cart"])
app.include_router(orders_router, prefix="/orders", tags=["Orders"])
app.include_router(shipping_router, prefix="/shipping", tags=["Shipping"])
app.include_router(payment_router, prefix="/payment", tags=["Payment"])
app.include_router(checkout_router, prefix="/checkout", tags=["Checkout"])
app.include_router(discounts_router, prefix="/discounts", tags=["Discounts"])
