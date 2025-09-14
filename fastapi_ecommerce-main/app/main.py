from fastapi import FastAPI, HTTPException
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
from fastapi.responses import FileResponse  # <-- Add this
from starlette.types import ASGIApp, Receive, Scope, Send




# Ensure static folders exist
os.makedirs("app/static/products", exist_ok=True)
os.makedirs("app/static/users", exist_ok=True)
os.makedirs("app/static/categories", exist_ok=True)
os.makedirs("app/static/previews", exist_ok=True)

@asynccontextmanager
async def lifespan(app: FastAPI):
    await database.connect()
    yield
    await database.disconnect()

app = FastAPI(title="eCommerce API", lifespan=lifespan)

# -----------------------------
# Global CORS middleware
# -----------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],  # frontend dev URLs
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -----------------------------
# Static files with CORS
# -----------------------------

class CORSMiddlewareStatic(StaticFiles):
    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        async def send_wrapper(message):
            if message.get("type") == "http.response.start":
                headers = dict(message.get("headers", []))
                headers[b'access-control-allow-origin'] = b'*'
                message["headers"] = list(headers.items())
            await send(message)
        await super().__call__(scope, receive, send_wrapper)

app.mount("/images", CORSMiddlewareStatic(directory="app/static"), name="images")
# app.mount("/images", StaticFiles(directory="app/static"), name="images")



# -----------------------------
# Routers
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


@app.get("/images/{upload_type}/{image_name}")
async def serve_image(upload_type: str, image_name: str):
    file_path = f"app/static/{upload_type}/{image_name}"
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Image not found")

    return FileResponse(
        file_path,
        headers={
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, OPTIONS",
            "Access-Control-Allow-Headers": "*",
        },
    )
