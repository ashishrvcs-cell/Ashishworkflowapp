"""Backend tests for LedgerFlow templates + assignments refactor."""
import os
import pytest
import requests
from datetime import date
from calendar import monthrange

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://finance-todo.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"


@pytest.fixture(scope="module")
def client():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="module")
def cleanup(client):
    created = {"clients": [], "staff": [], "templates": [], "assignments": [], "tasks": []}
    yield created
    for a in created["assignments"]:
        client.delete(f"{API}/assignments/{a}")
    for t in created["templates"]:
        client.delete(f"{API}/templates/{t}")
    for c in created["clients"]:
        client.delete(f"{API}/clients/{c}")
    for s in created["staff"]:
        client.delete(f"{API}/staff/{s}")


# ---------- Health ----------
def test_root(client):
    r = client.get(f"{API}/")
    assert r.status_code == 200
    assert r.json()["status"] == "ok"


# ---------- Dashboard stats ----------
def test_dashboard_has_new_fields(client):
    r = client.get(f"{API}/dashboard/stats")
    assert r.status_code == 200
    d = r.json()
    assert "active_templates" in d
    assert "active_assignments" in d
    assert "active_rules" not in d


# ---------- Templates CRUD ----------
def test_templates_crud(client, cleanup):
    # CREATE
    today_dom = date.today().day
    payload = {
        "task_name": "TEST_GSTR1",
        "category": "GST",
        "frequency": "monthly",
        "day_of_period": today_dom,
        "default_priority": "high",
        "sla_notes": "Same day",
        "active": True,
    }
    r = client.post(f"{API}/templates", json=payload)
    assert r.status_code == 200, r.text
    t = r.json()
    assert t["task_name"] == "TEST_GSTR1"
    assert t["default_priority"] == "high"
    assert "client_id" not in t  # client-agnostic
    tid = t["id"]
    cleanup["templates"].append(tid)

    # LIST
    r = client.get(f"{API}/templates")
    assert r.status_code == 200
    assert any(x["id"] == tid for x in r.json())

    # PATCH
    upd = {**payload, "default_priority": "critical"}
    r = client.patch(f"{API}/templates/{tid}", json=upd)
    assert r.status_code == 200
    assert r.json()["default_priority"] == "critical"

    # GET verify persistence
    r = client.get(f"{API}/templates")
    got = [x for x in r.json() if x["id"] == tid][0]
    assert got["default_priority"] == "critical"


# ---------- Assignments CRUD + duplicate + cascade ----------
def test_assignments_full_flow(client, cleanup):
    # setup: staff + client + template
    r = client.post(f"{API}/staff", json={"name": "TEST Alice"})
    assert r.status_code == 200
    staff_id = r.json()["id"]
    cleanup["staff"].append(staff_id)

    r = client.post(f"{API}/clients", json={"code": f"TESTCL{os.urandom(2).hex()}", "name": "TEST Client"})
    assert r.status_code == 200
    client_id = r.json()["id"]
    cleanup["clients"].append(client_id)

    today = date.today()
    r = client.post(f"{API}/templates", json={
        "task_name": "TEST_TDS",
        "frequency": "monthly",
        "day_of_period": today.day,
        "default_priority": "medium",
    })
    assert r.status_code == 200
    tmpl_id = r.json()["id"]
    cleanup["templates"].append(tmpl_id)

    # CREATE assignment
    payload = {
        "client_id": client_id,
        "template_id": tmpl_id,
        "assigned_staff_id": staff_id,
        "priority": "critical",
        "active": True,
    }
    r = client.post(f"{API}/assignments", json=payload)
    assert r.status_code == 200, r.text
    a = r.json()
    assert a["client_id"] == client_id
    assert a["template_id"] == tmpl_id
    assert a["priority"] == "critical"
    aid = a["id"]

    # Duplicate rejection
    r = client.post(f"{API}/assignments", json=payload)
    assert r.status_code == 400

    # LIST with filter
    r = client.get(f"{API}/assignments", params={"client_id": client_id})
    assert r.status_code == 200
    ids = [x["id"] for x in r.json()]
    assert aid in ids

    # PATCH
    upd = {**payload, "priority": "low"}
    r = client.patch(f"{API}/assignments/{aid}", json=upd)
    assert r.status_code == 200
    assert r.json()["priority"] == "low"

    # DELETE assignment
    r = client.delete(f"{API}/assignments/{aid}")
    assert r.status_code == 200
    r = client.get(f"{API}/assignments", params={"client_id": client_id})
    assert not any(x["id"] == aid for x in r.json())


def test_delete_template_cascades_assignments(client, cleanup):
    # Setup: client + template + assignment
    r = client.post(f"{API}/clients", json={"code": f"TESTCASC{os.urandom(2).hex()}", "name": "TEST Cascade"})
    cid = r.json()["id"]
    cleanup["clients"].append(cid)

    r = client.post(f"{API}/templates", json={
        "task_name": "TEST_CASCADE",
        "frequency": "monthly",
        "day_of_period": 1,
    })
    tid = r.json()["id"]

    r = client.post(f"{API}/assignments", json={"client_id": cid, "template_id": tid})
    assert r.status_code == 200
    aid = r.json()["id"]

    # DELETE template
    r = client.delete(f"{API}/templates/{tid}")
    assert r.status_code == 200

    # Verify assignment cascaded
    r = client.get(f"{API}/assignments")
    assert not any(x["id"] == aid for x in r.json())


# ---------- Generate today ----------
def test_generate_today_uses_assignments_and_dedup(client, cleanup):
    # Setup: staff, client, template matching today, assignment
    r = client.post(f"{API}/staff", json={"name": "TEST Bob"})
    sid = r.json()["id"]
    cleanup["staff"].append(sid)

    r = client.post(f"{API}/clients", json={"code": f"TESTGEN{os.urandom(2).hex()}", "name": "TEST Gen"})
    cid = r.json()["id"]
    cleanup["clients"].append(cid)

    today = date.today()
    dom = today.day
    r = client.post(f"{API}/templates", json={
        "task_name": "TEST_GEN_TASK",
        "category": "Compliance",
        "frequency": "monthly",
        "day_of_period": dom,
        "default_priority": "medium",
    })
    tid = r.json()["id"]
    cleanup["templates"].append(tid)

    r = client.post(f"{API}/assignments", json={
        "client_id": cid, "template_id": tid,
        "assigned_staff_id": sid, "priority": "high",
    })
    aid = r.json()["id"]
    cleanup["assignments"].append(aid)

    # Generate first time
    r = client.post(f"{API}/tasks/generate_today")
    assert r.status_code == 200
    data = r.json()
    assert data["created"] >= 1

    # Verify task exists with correct fields
    today_str = today.isoformat()
    r = client.get(f"{API}/tasks", params={"due_date": today_str, "client_id": cid})
    tasks = r.json()
    matching = [t for t in tasks if t.get("assignment_id") == aid]
    assert len(matching) == 1
    task = matching[0]
    assert task["task_name"] == "TEST_GEN_TASK"
    assert task["category"] == "Compliance"
    assert task["priority"] == "high"  # override applied
    assert task["assigned_staff_id"] == sid
    assert task["template_id"] == tid

    # Generate second time — idempotent
    r = client.post(f"{API}/tasks/generate_today")
    data2 = r.json()
    r = client.get(f"{API}/tasks", params={"due_date": today_str, "client_id": cid})
    matching2 = [t for t in r.json() if t.get("assignment_id") == aid]
    assert len(matching2) == 1  # no duplicate

    # cleanup task
    client.delete(f"{API}/tasks/{task['id']}")


def test_generate_skips_when_template_inactive(client, cleanup):
    r = client.post(f"{API}/clients", json={"code": f"TESTINA{os.urandom(2).hex()}", "name": "TEST Inactive"})
    cid = r.json()["id"]
    cleanup["clients"].append(cid)

    today = date.today()
    r = client.post(f"{API}/templates", json={
        "task_name": "TEST_INACTIVE",
        "frequency": "monthly",
        "day_of_period": today.day,
        "active": False,
    })
    tid = r.json()["id"]
    cleanup["templates"].append(tid)

    r = client.post(f"{API}/assignments", json={"client_id": cid, "template_id": tid})
    aid = r.json()["id"]
    cleanup["assignments"].append(aid)

    client.post(f"{API}/tasks/generate_today")
    r = client.get(f"{API}/tasks", params={"due_date": today.isoformat(), "client_id": cid})
    assert not any(t.get("assignment_id") == aid for t in r.json())
