"""Pytest fixtures for the FastAPI backend."""

import os
import sys
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

# Ensure the app module is importable
sys.path.insert(0, str(Path(__file__).parent.parent))


@pytest.fixture(autouse=True)
def test_data_root(tmp_path: Path):
    """Use a temporary directory as DATA_ROOT for all tests."""
    old_data_root = os.environ.get("DATA_ROOT")
    old_db_url = os.environ.get("DATABASE_URL")
    old_engine = os.environ.get("AI_ENGINE")
    db_path = tmp_path / "test.db"
    os.environ["DATA_ROOT"] = str(tmp_path)
    os.environ["DATABASE_URL"] = f"sqlite+aiosqlite:///{db_path.as_posix()}"
    os.environ["AI_ENGINE"] = "mock"
    yield
    if old_data_root:
        os.environ["DATA_ROOT"] = old_data_root
    else:
        del os.environ["DATA_ROOT"]
    if old_db_url:
        os.environ["DATABASE_URL"] = old_db_url
    else:
        del os.environ["DATABASE_URL"]
    if old_engine:
        os.environ["AI_ENGINE"] = old_engine
    else:
        del os.environ["AI_ENGINE"]


@pytest.fixture
def client():
    """FastAPI TestClient with mocked dependencies."""
    from app.main import app
    with TestClient(app) as c:
        yield c
