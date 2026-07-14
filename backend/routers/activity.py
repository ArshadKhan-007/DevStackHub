from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from models.database import get_db, ActivityLog, User
from schemas.schemas import ActivityOut
from utils.auth import get_current_user

router = APIRouter(prefix="/activity", tags=["Activity"])


@router.get("", response_model=List[ActivityOut])
def get_activity(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    limit: int = 50,
):
    return (
        db.query(ActivityLog)
        .filter(ActivityLog.user_id == current_user.id)
        .order_by(ActivityLog.created_at.desc())
        .limit(limit)
        .all()
    )
