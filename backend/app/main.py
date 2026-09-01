"""Điểm vào của API. Chạy: uvicorn app.main:app --reload --port 8000"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import CORS_ORIGINS
from app.routers import admin, auth, categories, chat, contact, orders, posts, products
from app.schemas import HealthOut

app = FastAPI(
    title="Halona Fruist API",
    description="API cho website bán nông sản Halona Fruist (đồ án).",
    version="1.0.0",
)

# Next.js gọi API từ phía máy chủ nên không cần CORS, nhưng mở cho localhost:3000
# để có thể gọi thử trực tiếp từ trình duyệt khi debug hoặc demo.
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

for module in (products, categories, posts, auth, orders, contact, chat, admin):
    app.include_router(module.router)


@app.get("/api/health", tags=["health"], response_model=HealthOut)
def health():
    return {"status": "ok"}
