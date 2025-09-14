from fastapi import FastAPI,HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
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
from app.uploads.router import router as uploads_router
import os

from fastapi.responses import FileResponse


# Ensure static folders exist
os.makedirs("app/static/products", exist_ok=True)
os.makedirs("app/static/users", exist_ok=True)
os.makedirs("app/static/categories", exist_ok=True)
os.makedirs("app/static/previews", exist_ok=True)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    await database.connect()
    yield
    # Shutdown
    await database.disconnect()

app = FastAPI(title="eCommerce API", lifespan=lifespan)

# -----------------------------
# Global CORS middleware (optional, for API routes)
# -----------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # ⚠️ Replace with your frontend domains in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -----------------------------
# Sub-app for static files with CORS
# -----------------------------
static_app = FastAPI()
static_app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # ⚠️ Replace with your frontend domains in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
static_app.mount("/", StaticFiles(directory="app/static"), name="static_files")

# Mount static_app for both /static and /images
app.mount("/static", static_app)
app.mount("/images", static_app)

@app.get("/images/{upload_type}/{image_name}")
async def serve_image(upload_type: str, image_name: str):
    file_path = f"app/static/{upload_type}/{image_name}"
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Image not found")
    
    # ⚠️ Add CORS header to allow browser access from localhost:3000
    return FileResponse(
        file_path,
        headers={"Access-Control-Allow-Origin": "*"}
    )

# -----------------------------
# Register routers
# -----------------------------
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
app.include_router(uploads_router, prefix="/uploads", tags=["Uploads"])

# Already mounted as /images
@app.get("/images/{upload_type}/{image_name}")
async def serve_image(upload_type: str, image_name: str):
    file_path = f"app/static/{upload_type}/{image_name}"
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Image not found")
    return FileResponse(file_path, headers={"Access-Control-Allow-Origin": "*"})  # ⚠️ 
