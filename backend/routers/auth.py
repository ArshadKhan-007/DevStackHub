from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from models.database import get_db, User, ActivityLog
from schemas.schemas import RegisterRequest, LoginRequest, TokenResponse
from utils.auth import hash_password, verify_password, create_access_token, get_current_user

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def register(payload: RegisterRequest, db: Session = Depends(get_db)):
    if db.query(User).filter(User.email == payload.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")

    user = User(
        name=payload.name,
        email=payload.email,
        hashed_password=hash_password(payload.password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    log = ActivityLog(user_id=user.id, action="User Registered", detail=f"Welcome, {user.name}!")
    db.add(log)
    db.commit()

    token = create_access_token({"sub": str(user.id)})
    return {"access_token": token}


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email).first()
    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    log = ActivityLog(user_id=user.id, action="Login", detail="User logged in")
    db.add(log)
    db.commit()

    token = create_access_token({"sub": str(user.id)})
    return {"access_token": token}


@router.post("/logout")
def logout(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    log = ActivityLog(user_id=current_user.id, action="Logout", detail="User logged out")
    db.add(log)
    db.commit()
    return {"message": "Logged out successfully"}
