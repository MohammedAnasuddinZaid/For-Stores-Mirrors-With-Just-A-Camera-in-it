"""Tests for the configuration module."""

import os

import pytest


def test_settings_default_data_root(monkeypatch):
    """DATA_ROOT defaults to D:\VirtualTryOn when not set."""
    monkeypatch.delenv("DATA_ROOT", raising=False)
    from app.core.config import Settings
    settings = Settings()
    assert settings.DATA_ROOT == "D:\\VirtualTryOn"
    assert settings.MODEL_DIR == "D:\\VirtualTryOn\\models"


def test_settings_custom_data_root(monkeypatch):
    """DATA_ROOT can be overridden via environment."""
    monkeypatch.setenv("DATA_ROOT", "X:/CustomPath")
    from app.core.config import Settings
    settings = Settings()
    assert settings.DATA_ROOT == "X:/CustomPath"
    assert settings.MODEL_DIR == "X:/CustomPath\\models"


def test_settings_ai_engine_default(monkeypatch):
    """AI_ENGINE defaults to 'mock'."""
    monkeypatch.delenv("AI_ENGINE", raising=False)
    from app.core.config import Settings
    settings = Settings()
    assert settings.AI_ENGINE == "mock"


def test_settings_database_path_default(monkeypatch):
    """database_path defaults to async sqlite."""
    monkeypatch.delenv("DATABASE_URL", raising=False)
    monkeypatch.delenv("DATA_ROOT", raising=False)
    from app.core.config import Settings
    settings = Settings()
    assert "sqlite+aiosqlite:///" in settings.database_path
    assert "VirtualTryOn" in settings.database_path
