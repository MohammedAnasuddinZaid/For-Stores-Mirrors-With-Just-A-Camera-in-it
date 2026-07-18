@echo off
chcp 65001 >nul
title Virtual Try-On Platform — Development

echo ========================================
echo   Virtual Try-On Platform — Dev Start
echo ========================================
echo.

:: Check Python
python --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python is not installed or not in PATH
    pause
    exit /b 1
)
echo [OK] Python found

:: Check Node.js
node --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js is not installed or not in PATH
    pause
    exit /b 1
)
echo [OK] Node.js found

:: Check D: drive
if not exist D:\ (
    echo [WARN] D: drive not found — using C:\VirtualTryOn fallback
    set DATA_ROOT=C:\VirtualTryOn
)

:: Start Backend
echo.
echo [1/2] Starting Python Backend ...
start "VirtualTryOn-API" cmd /c "cd /d "%~dp0..\..\services\api" && if not exist venv python -m venv venv && .\venv\Scripts\activate && pip install -r requirements.txt >nul 2>&1 && python -m app.main"

timeout /t 5 /nobreak >nul

:: Start Frontend
echo [2/2] Starting Next.js Frontend ...
start "VirtualTryOn-Web" cmd /c "cd /d "%~dp0..\..\apps\web" && npm install >nul 2>&1 && npm run dev"

echo.
echo ========================================
echo   Backend:  http://localhost:8000
echo   Frontend: http://localhost:3000
echo   Admin:    http://localhost:3001
echo   API Docs: http://localhost:8000/docs
echo ========================================
echo.
echo Close the terminal windows to stop.
echo.
pause
