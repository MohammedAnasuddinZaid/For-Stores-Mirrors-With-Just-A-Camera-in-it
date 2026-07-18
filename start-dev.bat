@echo off
chcp 65001 >nul
title Virtual Try-On Platform

echo.
echo ============================================
echo   Virtual Try-On Platform — Quick Start
echo ============================================
echo.
echo Starting all services...
echo.
echo   Backend API: http://localhost:8000
echo   Web App:     http://localhost:3000
echo   Admin Panel: http://localhost:3001
echo   API Docs:    http://localhost:8000/docs
echo.
echo ============================================
echo.

npm run dev
pause
