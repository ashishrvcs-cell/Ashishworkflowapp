from fastapi import FastAPI, APIRouter, HTTPException, Query
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import uuid
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Literal
from datetime import datetime, timezone, date, timedelta
from calendar import monthrange

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

mongo_url = os.environ["MONGO_URL"]
mongo_client = AsyncIOMotorClient(mongo_url)
db = mongo_client[os.environ["DB_NAME"]]

app = FastAPI(title="LedgerFlow Practice Management")
api = APIRouter(prefix="/api")

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)


# ---------- helpers ----------
def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def today_str() -> str:
    return date.today().isoformat()


def new_id() -> str:
    return str(uuid.uuid4())


# ---------- Models ----------
Status = Literal["pending", "in_progress", "completed", "hold"]
Priority = Literal["low", "medium", "high", "critical"]
Frequency = Literal["daily", "weekly", "monthly", "quarterly"]


class Staff(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=new_id)
    name: str
    role: str = "Associate"
    initials: Optional[str] = None
    email: Optional[str] = None
    active: bool = True
    created_at: str = Field(default_factory=now_iso)


class StaffCreate(BaseModel):
    name: str
    role: str = "Associate"
    initials: Optional[str] = None
    email: Optional[str] = None
    active: bool = True


class Client(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=new_id)
    code: str
    name: str
    category: str = "General"
    main_staff_id: Optional[str] = None
    backup_staff_id: Optional[str] = None
    notes: Optional[str] = None
    active: bool = True
    created_at: str = Field(default_factory=now_iso)


class ClientCreate(BaseModel):
    code: str
    name: str
    category: str = "General"
    main_staff_id: Optional[str] = None
    backup_staff_id: Optional[str] = None
    notes: Optional[str] = None
    active: bool = True


class RecurringRule(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=new_id)
    client_id: str
    task_name: str
    category: str = "General"
    frequency: Frequency = "monthly"
    # day_of_period: for weekly -> 0-6 (Mon-Sun); monthly/quarterly -> 1-31
    day_of_period: int = 1
    assigned_staff_id: Optional[str] = None
    priority: Priority = "medium"
    sla_notes: Optional[str] = None
    active: bool = True
    created_at: str = Field(default_factory=now_iso)


class RecurringRuleCreate(BaseModel):
    client_id: str
    task_name: str
    category: str = "General"
    frequency: Frequency = "monthly"
    day_of_period: int = 1
    assigned_staff_id: Optional[str] = None
    priority: Priority = "medium"
    sla_notes: Optional[str] = None
    active: bool = True


class Task(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=new_id)
    client_id: str
    assigned_staff_id: Optional[str] = None
    task_name: str
    category: str = "General"
    priority: Priority = "medium"
    status: Status = "pending"
    due_date: str  # ISO date (YYYY-MM-DD)
    remarks: Optional[str] = None
    hold_reason: Optional[str] = None
    completed_at: Optional[str] = None
    rule_id: Optional[str] = None  # if generated from recurring
    created_at: str = Field(default_factory=now_iso)


class TaskCreate(BaseModel):
    client_id: str
    assigned_staff_id: Optional[str] = None
    task_name: str
    category: str = "General"
    priority: Priority = "medium"
    status: Status = "pending"
    due_date: str
    remarks: Optional[str] = None


class TaskUpdate(BaseModel):
    assigned_staff_id: Optional[str] = None
    task_name: Optional[str] = None
    category: Optional[str] = None
    priority: Optional[Priority] = None
    status: Optional[Status] = None
    due_date: Optional[str] = None
    remarks: Optional[str] = None
    hold_reason: Optional[str] = None


# ---------- CRUD helpers ----------
async def _list(coll, filt=None):
    filt = filt or {}
    docs = await coll.find(filt, {"_id": 0}).to_list(2000)
    return docs


# ---------- STAFF ----------
@api.get("/staff", response_model=List[Staff])
async def list_staff():
    return await _list(db.staff)


@api.post("/staff", response_model=Staff)
async def create_staff(payload: StaffCreate):
    obj = Staff(**payload.model_dump())
    if not obj.initials:
        parts = obj.name.strip().split()
        obj.initials = (parts[0][0] + (parts[-1][0] if len(parts) > 1 else "")).upper()
    await db.staff.insert_one(obj.model_dump())
    return obj


@api.patch("/staff/{staff_id}", response_model=Staff)
async def update_staff(staff_id: str, payload: StaffCreate):
    doc = await db.staff.find_one({"id": staff_id}, {"_id": 0})
    if not doc:
        raise HTTPException(404, "Staff not found")
    updated = {**doc, **payload.model_dump()}
    await db.staff.update_one({"id": staff_id}, {"$set": updated})
    return Staff(**updated)


@api.delete("/staff/{staff_id}")
async def delete_staff(staff_id: str):
    await db.staff.delete_one({"id": staff_id})
    return {"ok": True}


# ---------- CLIENTS ----------
@api.get("/clients", response_model=List[Client])
async def list_clients():
    return await _list(db.clients)


@api.post("/clients", response_model=Client)
async def create_client(payload: ClientCreate):
    existing = await db.clients.find_one({"code": payload.code})
    if existing:
        raise HTTPException(400, "Client code already exists")
    obj = Client(**payload.model_dump())
    await db.clients.insert_one(obj.model_dump())
    return obj


@api.patch("/clients/{client_id}", response_model=Client)
async def update_client(client_id: str, payload: ClientCreate):
    doc = await db.clients.find_one({"id": client_id}, {"_id": 0})
    if not doc:
        raise HTTPException(404, "Client not found")
    updated = {**doc, **payload.model_dump()}
    await db.clients.update_one({"id": client_id}, {"$set": updated})
    return Client(**updated)


@api.delete("/clients/{client_id}")
async def delete_client(client_id: str):
    await db.clients.delete_one({"id": client_id})
    return {"ok": True}


# ---------- RECURRING RULES ----------
@api.get("/rules", response_model=List[RecurringRule])
async def list_rules():
    return await _list(db.recurring_rules)


@api.post("/rules", response_model=RecurringRule)
async def create_rule(payload: RecurringRuleCreate):
    obj = RecurringRule(**payload.model_dump())
    await db.recurring_rules.insert_one(obj.model_dump())
    return obj


@api.patch("/rules/{rule_id}", response_model=RecurringRule)
async def update_rule(rule_id: str, payload: RecurringRuleCreate):
    doc = await db.recurring_rules.find_one({"id": rule_id}, {"_id": 0})
    if not doc:
        raise HTTPException(404, "Rule not found")
    updated = {**doc, **payload.model_dump()}
    await db.recurring_rules.update_one({"id": rule_id}, {"$set": updated})
    return RecurringRule(**updated)


@api.delete("/rules/{rule_id}")
async def delete_rule(rule_id: str):
    await db.recurring_rules.delete_one({"id": rule_id})
    return {"ok": True}


# ---------- TASKS ----------
@api.get("/tasks", response_model=List[Task])
async def list_tasks(
    due_date: Optional[str] = None,
    status: Optional[Status] = None,
    staff_id: Optional[str] = None,
    client_id: Optional[str] = None,
    overdue: Optional[bool] = None,
):
    filt = {}
    if due_date:
        filt["due_date"] = due_date
    if status:
        filt["status"] = status
    if staff_id:
        filt["assigned_staff_id"] = staff_id
    if client_id:
        filt["client_id"] = client_id
    if overdue:
        filt["due_date"] = {"$lt": today_str()}
        filt["status"] = {"$in": ["pending", "in_progress"]}
    return await _list(db.tasks, filt)


@api.post("/tasks", response_model=Task)
async def create_task(payload: TaskCreate):
    obj = Task(**payload.model_dump())
    await db.tasks.insert_one(obj.model_dump())
    return obj


@api.patch("/tasks/{task_id}", response_model=Task)
async def update_task(task_id: str, payload: TaskUpdate):
    doc = await db.tasks.find_one({"id": task_id}, {"_id": 0})
    if not doc:
        raise HTTPException(404, "Task not found")
    changes = {k: v for k, v in payload.model_dump().items() if v is not None}
    if changes.get("status") == "completed" and not doc.get("completed_at"):
        changes["completed_at"] = now_iso()
    if changes.get("status") and changes["status"] != "completed":
        changes["completed_at"] = None
    updated = {**doc, **changes}
    await db.tasks.update_one({"id": task_id}, {"$set": updated})
    return Task(**updated)


@api.delete("/tasks/{task_id}")
async def delete_task(task_id: str):
    await db.tasks.delete_one({"id": task_id})
    return {"ok": True}


# ---------- GENERATE TODAY ----------
def _rule_matches_today(rule: dict, ref: date) -> bool:
    freq = rule.get("frequency", "monthly")
    dop = int(rule.get("day_of_period", 1))
    if freq == "daily":
        return ref.weekday() < 5  # Mon-Fri
    if freq == "weekly":
        return ref.weekday() == max(0, min(6, dop))
    if freq == "monthly":
        last_day = monthrange(ref.year, ref.month)[1]
        target = min(max(1, dop), last_day)
        return ref.day == target
    if freq == "quarterly":
        # trigger on day_of_period of Jan/Apr/Jul/Oct
        if ref.month not in (1, 4, 7, 10):
            return False
        last_day = monthrange(ref.year, ref.month)[1]
        target = min(max(1, dop), last_day)
        return ref.day == target
    return False


@api.post("/tasks/generate_today")
async def generate_today():
    ref = date.today()
    ref_str = ref.isoformat()
    rules = await _list(db.recurring_rules, {"active": True})
    created = 0
    skipped = 0
    for rule in rules:
        if not _rule_matches_today(rule, ref):
            continue
        # skip if task already exists for this rule + date
        exists = await db.tasks.find_one({"rule_id": rule["id"], "due_date": ref_str})
        if exists:
            skipped += 1
            continue
        task = Task(
            client_id=rule["client_id"],
            assigned_staff_id=rule.get("assigned_staff_id"),
            task_name=rule["task_name"],
            category=rule.get("category", "General"),
            priority=rule.get("priority", "medium"),
            status="pending",
            due_date=ref_str,
            rule_id=rule["id"],
        )
        await db.tasks.insert_one(task.model_dump())
        created += 1
    return {"created": created, "skipped_existing": skipped, "date": ref_str}


# ---------- DASHBOARD ----------
@api.get("/dashboard/stats")
async def dashboard_stats():
    today = today_str()
    todays_tasks = await db.tasks.count_documents({"due_date": today})
    completed_today = await db.tasks.count_documents({"due_date": today, "status": "completed"})
    pending_today = await db.tasks.count_documents(
        {"due_date": today, "status": {"$in": ["pending", "in_progress"]}}
    )
    overdue = await db.tasks.count_documents(
        {"due_date": {"$lt": today}, "status": {"$in": ["pending", "in_progress"]}}
    )
    on_hold = await db.tasks.count_documents({"status": "hold"})
    total_clients = await db.clients.count_documents({"active": True})
    total_staff = await db.staff.count_documents({"active": True})
    active_rules = await db.recurring_rules.count_documents({"active": True})
    return {
        "today": today,
        "todays_tasks": todays_tasks,
        "completed_today": completed_today,
        "pending_today": pending_today,
        "overdue": overdue,
        "on_hold": on_hold,
        "total_clients": total_clients,
        "total_staff": total_staff,
        "active_rules": active_rules,
    }


@api.get("/")
async def root():
    return {"service": "LedgerFlow Practice Management", "status": "ok"}


app.include_router(api)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get("CORS_ORIGINS", "*").split(","),
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("shutdown")
async def shutdown_db_client():
    mongo_client.close()
