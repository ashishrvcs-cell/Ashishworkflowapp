"""Tests for the Ashish Team Work Flow follow-ups:
   - timezone-aware `today` param on dashboard/stats, generate_today, tasks?overdue
   - root rename to 'Ashish Team Work Flow'
"""
import os
import pytest
import requests
from datetime import date, timedelta

BASE_URL = os.environ["REACT_APP_BACKEND_URL"].rstrip("/")
API = f"{BASE_URL}/api"


@pytest.fixture(scope="module")
def client():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="module")
def tracker(client):
    created = {"clients": [], "staff": [], "templates": [], "assignments": [], "tasks": []}
    yield created
    for tid in created["tasks"]:
        client.delete(f"{API}/tasks/{tid}")
    for aid in created["assignments"]:
        client.delete(f"{API}/assignments/{aid}")
    for tid in created["templates"]:
        client.delete(f"{API}/templates/{tid}")
    for cid in created["clients"]:
        client.delete(f"{API}/clients/{cid}")
    for sid in created["staff"]:
        client.delete(f"{API}/staff/{sid}")


# ---- Rename ----
def test_root_rename(client):
    r = client.get(f"{API}/")
    assert r.status_code == 200
    data = r.json()
    assert data["service"] == "Ashish Team Work Flow"
    assert data["status"] == "ok"


# ---- Dashboard today param ----
def test_dashboard_stats_accepts_today_param(client):
    custom = "2030-07-15"  # future date, no data expected
    r = client.get(f"{API}/dashboard/stats", params={"today": custom})
    assert r.status_code == 200
    data = r.json()
    assert data["today"] == custom
    assert data["todays_tasks"] == 0
    assert data["completed_today"] == 0
    assert data["pending_today"] == 0


def test_dashboard_stats_default_today_is_server_date(client):
    r = client.get(f"{API}/dashboard/stats")
    assert r.status_code == 200
    assert r.json()["today"] == date.today().isoformat()


# ---- generate_today with today param ----
def test_generate_today_uses_supplied_date(client, tracker):
    # Setup client+template+assignment keyed to a FUTURE day-of-period
    future = date.today() + timedelta(days=5)
    r = client.post(f"{API}/clients", json={"code": f"TESTTZ{os.urandom(2).hex()}", "name": "TEST TZ"})
    cid = r.json()["id"]
    tracker["clients"].append(cid)

    r = client.post(f"{API}/templates", json={
        "task_name": "TEST_TZ_TASK",
        "frequency": "monthly",
        "day_of_period": future.day,
        "default_priority": "medium",
    })
    tid = r.json()["id"]
    tracker["templates"].append(tid)

    r = client.post(f"{API}/assignments", json={"client_id": cid, "template_id": tid})
    aid = r.json()["id"]
    tracker["assignments"].append(aid)

    # Simulate a user whose local date is `future` even though server date differs
    r = client.post(f"{API}/tasks/generate_today", params={"today": future.isoformat()})
    assert r.status_code == 200
    data = r.json()
    assert data["date"] == future.isoformat()
    assert data["created"] >= 1

    # GET verify the task has due_date == future
    r = client.get(f"{API}/tasks", params={"due_date": future.isoformat(), "client_id": cid})
    tasks = [t for t in r.json() if t.get("assignment_id") == aid]
    assert len(tasks) == 1
    assert tasks[0]["due_date"] == future.isoformat()
    tracker["tasks"].append(tasks[0]["id"])

    # Idempotency: call again w/ same today -> skipped
    r2 = client.post(f"{API}/tasks/generate_today", params={"today": future.isoformat()})
    d2 = r2.json()
    assert d2["skipped_existing"] >= 1
    r = client.get(f"{API}/tasks", params={"due_date": future.isoformat(), "client_id": cid})
    assert len([t for t in r.json() if t.get("assignment_id") == aid]) == 1


# ---- tasks?overdue=true&today=... ----
def test_tasks_overdue_relative_to_supplied_today(client, tracker):
    r = client.post(f"{API}/clients", json={"code": f"TESTOV{os.urandom(2).hex()}", "name": "TEST OV"})
    cid = r.json()["id"]
    tracker["clients"].append(cid)

    old = (date.today() - timedelta(days=10)).isoformat()
    future_ref = (date.today() + timedelta(days=30)).isoformat()
    past_ref = (date.today() - timedelta(days=30)).isoformat()

    # pending task 10 days ago
    r = client.post(f"{API}/tasks", json={
        "client_id": cid,
        "task_name": "TEST_OV",
        "due_date": old,
        "priority": "medium",
    })
    tid = r.json()["id"]
    tracker["tasks"].append(tid)

    # Overdue relative to future ref => should include our task
    r = client.get(f"{API}/tasks", params={"overdue": "true", "today": future_ref})
    ids = [t["id"] for t in r.json()]
    assert tid in ids

    # Overdue relative to past ref (older than task) => should NOT include
    r = client.get(f"{API}/tasks", params={"overdue": "true", "today": past_ref})
    ids = [t["id"] for t in r.json()]
    assert tid not in ids
