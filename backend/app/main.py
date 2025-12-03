from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .routers.prediction import router as prediction_router
from .routers.prediction_history import router as prediction_history_router
from .routers.auth import router as auth_router
from .routers.clinician import router as clinician_router
from .routers.admin import router as admin_router
from .routers.admin_users import router as admin_users_router
from .routers.analytics import router as analytics_router
from .routers.admin_settings import router as admin_settings_router
from .routers.profile import router as profile_router

from .core.database import Base, engine, SessionLocal
from .models.user_model import User
from .models.settings_model import SystemSettings
from .services.auth_service import hash_password

# Ensure DB tables exist
from .models import user_model, prediction_model  # noqa

app = FastAPI(title="GBS Predictor API", version="1.0")

Base.metadata.create_all(bind=engine)


# =====================================================
# 🚨 AUTO-CREATE FIRST ADMIN USER IF NONE EXISTS
# =====================================================
# ================================================================
# CREATE INITIAL ADMIN USER (RUN ONCE)
# ================================================================
from sqlalchemy.orm import Session
from .services.auth_service import hash_password
from .models.user_model import User
from .core.database import SessionLocal

def create_initial_admin():
    db: Session = SessionLocal()

    existing = db.query(User).filter(User.email == "admin@example.com").first()
    if existing:
        print("✔ Admin already exists, skipping creation.")
        db.close()
        return

    admin = User(
        email="admin@example.com",
        full_name="System Administrator",
        role="admin",
        hashed_password=hash_password("Admin123!"),
    )

    db.add(admin)
    db.commit()
    db.close()

    print("🎉 Created initial admin: admin@example.com / Admin123!")

def create_default_settings():
    db = SessionLocal()
    existing = db.query(SystemSettings).first()
    if not existing:
        settings = SystemSettings()
        db.add(settings)
        db.commit()
    db.close()

create_default_settings()


# Run admin creation at startup
create_initial_admin()


# =====================================================
# CORS
# =====================================================
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],    # Later restrict to your frontend domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# =====================================================
# ROUTERS
# =====================================================

# AUTH
app.include_router(auth_router, prefix="/api/auth", tags=["Auth"])

#PREDICTIONS
app.include_router(prediction_history_router, prefix="/api", tags=["Prediction History"])
app.include_router(prediction_router, prefix="/api/predictions", tags=["Predictions"])

#CLINICIAN
app.include_router(clinician_router, prefix="/api", tags=["Clinician"])

#ADMIN
app.include_router(admin_router, prefix="/api", tags=["Admin"])
app.include_router(admin_users_router, prefix="/api/admin/users", tags=["Admin Users"])

#ANALYTICS
app.include_router(analytics_router, prefix="/api/analytics", tags=["Analytics"])

#SETTINGS
app.include_router(admin_settings_router, prefix="/api")

#PROFILE
app.include_router(profile_router, prefix="/api")


@app.get("/health")
def health():
    return {"status": "ok"}
