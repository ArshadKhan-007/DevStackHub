from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from models.database import get_db, Project, File, ActivityLog, User
from schemas.schemas import DashboardOut
from utils.auth import get_current_user

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("", response_model=DashboardOut)
def get_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    total_projects = db.query(Project).filter(Project.user_id == current_user.id).count()

    files = db.query(File).filter(File.user_id == current_user.id).all()
    total_files = len(files)
    storage_used = sum(f.size_bytes or 0 for f in files)

    recent_logs = (
        db.query(ActivityLog)
        .filter(ActivityLog.user_id == current_user.id)
        .order_by(ActivityLog.created_at.desc())
        .limit(10)
        .all()
    )

    recent_activity = [
        {
            "id": log.id,
            "action": log.action,
            "detail": log.detail,
            "created_at": log.created_at.isoformat(),
        }
        for log in recent_logs
    ]

    return DashboardOut(
        total_projects=total_projects,
        total_files=total_files,
        storage_used_bytes=storage_used,
        recent_activity=recent_activity,
    )
