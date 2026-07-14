import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from dotenv import load_dotenv

load_dotenv()

from models.database import create_tables
from routers import auth, profile, projects, files, dashboard, search, activity, settings

# ── App ───────────────────────────────────────────────────────────────────────

app = FastAPI(
    title="DevStack Hub API",
    description="Backend API for DevStack Hub — developer portfolio & resource management platform",
    version="1.0.0",
)

# ── CORS ──────────────────────────────────────────────────────────────────────

CLIENT_URL = os.getenv("CLIENT_URL", "http://localhost:5173")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[CLIENT_URL],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Static files (EFS simulation in dev / real EFS in prod) ──────────────────

EFS_MOUNT_PATH = os.getenv("EFS_MOUNT_PATH", "./local_storage")
os.makedirs(os.path.join(EFS_MOUNT_PATH, "images"), exist_ok=True)
os.makedirs(os.path.join(EFS_MOUNT_PATH, "documents"), exist_ok=True)

app.mount(
    "/static",
    StaticFiles(directory=EFS_MOUNT_PATH),
    name="static",
)

# ── Routers ───────────────────────────────────────────────────────────────────

app.include_router(auth.router)
app.include_router(profile.router)
app.include_router(projects.router)
app.include_router(files.router)
app.include_router(dashboard.router)
app.include_router(search.router)
app.include_router(activity.router)
app.include_router(settings.router)

# ── Startup ───────────────────────────────────────────────────────────────────

@app.on_event("startup")
def on_startup():
    create_tables()
    print("Database tables created/verified")
    print(f"EFS mount path: {EFS_MOUNT_PATH}")
    print(f"Accepting requests from: {CLIENT_URL}")


@app.get("/", tags=["Health"])
def health_check():
    return {"status": "ok", "app": "DevStack Hub API", "version": "1.0.0"}


# ── Serve Frontend Static Files ───────────────────────────────────────────────

# FRONTEND_DIR = os.path.abspath(
#     os.path.join(os.path.dirname(__file__), "..", "frontend", "dist")
# )

# app.mount(
#     "/assets",
#     StaticFiles(directory=os.path.join(FRONTEND_DIR, "assets")),
#     name="assets",
# )


# @app.get("/{full_path:path}")
# async def serve_frontend(full_path: str):
#     file_path = os.path.abspath(os.path.join(FRONTEND_DIR, full_path))

#     # path traversal guard — resolved path FRONTEND_DIR ke andar hi rahe
#     if not file_path.startswith(FRONTEND_DIR + os.sep):
#         return FileResponse(os.path.join(FRONTEND_DIR, "index.html"))

#     if os.path.isfile(file_path):
#         return FileResponse(file_path)

#     return FileResponse(os.path.join(FRONTEND_DIR, "index.html"))
