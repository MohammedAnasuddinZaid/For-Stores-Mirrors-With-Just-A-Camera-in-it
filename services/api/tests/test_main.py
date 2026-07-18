"""Integration tests for the FastAPI backend."""

import pytest
from fastapi.testclient import TestClient


def test_health_endpoint(client: TestClient):
    """GET /api/v1/health returns system status."""
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "version" in data
    assert "timestamp" in data
    assert data["storage"]["available"]


def test_list_products(client: TestClient):
    """GET /api/v1/products returns product list."""
    response = client.get("/api/v1/products")
    assert response.status_code == 200
    data = response.json()
    assert "items" in data
    assert isinstance(data["items"], list)


def test_get_product_not_found(client: TestClient):
    """GET /api/v1/products/<invalid> returns 404."""
    response = client.get("/api/v1/products/nonexistent")
    assert response.status_code == 404
    assert "detail" in response.json()


def test_create_session(client: TestClient):
    """POST /api/v1/sessions creates a new session."""
    response = client.post(
        "/api/v1/sessions",
        json={"device_metadata": '{"userAgent": "test"}'},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ACTIVE"
    assert "id" in data
    assert "token" in data


def test_tryon_flow(client: TestClient):
    """Full try-on flow: session → upload → create job → poll result."""
    # Create session
    r = client.post("/api/v1/sessions", json={})
    assert r.status_code == 200
    session = r.json()
    session_id = session["id"]

    # Upload person image
    r = client.post(
        f"/api/v1/sessions/{session_id}/person-images",
        files={"image": ("test.jpg", b"fake-image-data", "image/jpeg")},
    )
    assert r.status_code == 200
    person_image = r.json()
    person_image_id = person_image["id"]

    # Create try-on job
    r = client.post(
        f"/api/v1/sessions/{session_id}/try-ons",
        json={
            "product_id": "prod_001",
            "person_image_id": person_image_id,
        },
    )
    assert r.status_code == 200
    job = r.json()
    job_id = job["id"]
    assert job["status"] == "QUEUED"

    # Poll until complete
    import time
    max_wait = 15
    for _ in range(max_wait):
        r = client.get(f"/api/v1/try-ons/{job_id}")
        assert r.status_code == 200
        status = r.json()["status"]
        if status == "SUCCEEDED":
            break
        if status == "FAILED":
            pytest.fail(f"Job failed: {r.json()}")
        time.sleep(1)
    else:
        pytest.fail("Job did not complete in time")

    # Get result
    r = client.get(f"/api/v1/try-ons/{job_id}/result")
    assert r.status_code == 200
    result = r.json()
    assert "result_path" in result
