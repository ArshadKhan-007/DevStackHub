from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from models.database import get_db, User, ActivityLog
from schemas.schemas import PasswordChange
from utils.auth import get_current_user, hash_password, verify_password

router = APIRouter(prefix="/settings", tags=["Settings"])


@router.post("/change-password")
def change_password(
    payload: PasswordChange,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not verify_password(payload.current_password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="Current password is incorrect")

    current_user.hashed_password = hash_password(payload.new_password)
    db.commit()

    log = ActivityLog(user_id=current_user.id, action="Password Changed", detail="Password updated successfully")
    db.add(log)
    db.commit()

    return {"message": "Password changed successfully"}
