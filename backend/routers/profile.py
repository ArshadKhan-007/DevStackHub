from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session

from models.database import get_db, User, ActivityLog
from schemas.schemas import UserOut, ProfileUpdate
from utils.auth import get_current_user, hash_password, verify_password
from utils.storage import upload_image

router = APIRouter(prefix="/profile", tags=["Profile"])


@router.get("", response_model=UserOut)
def get_profile(current_user: User = Depends(get_current_user)):
    return current_user


@router.put("", response_model=UserOut)
def update_profile(
    payload: ProfileUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(current_user, field, value)
    db.commit()
    db.refresh(current_user)

    log = ActivityLog(user_id=current_user.id, action="Profile Updated", detail="Profile details updated")
    db.add(log)
    db.commit()

    return current_user


@router.post("/picture", response_model=UserOut)
async def upload_profile_picture(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    allowed = {"image/jpeg", "image/png", "image/gif", "image/webp"}
    if file.content_type not in allowed:
        raise HTTPException(status_code=400, detail="Only image files are allowed for profile pictures")

    _, url_path = await upload_image(file)
    current_user.profile_picture = url_path
    db.commit()
    db.refresh(current_user)

    log = ActivityLog(user_id=current_user.id, action="Profile Updated", detail="Profile picture updated")
    db.add(log)
    db.commit()

    return current_user
