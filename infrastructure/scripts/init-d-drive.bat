@echo off
chcp 65001 >nul
title Virtual Try-On — Initialize D: Drive

echo ========================================
echo   Initializing D:\VirtualTryOn\
echo ========================================
echo.

if not exist D:\ (
    echo [ERROR] D: drive not found.
    echo Please ensure the D: drive is available.
    pause
    exit /b 1
)

set BASE=D:\VirtualTryOn

mkdir "%BASE%" 2>nul
mkdir "%BASE%\models" 2>nul
mkdir "%BASE%\caches" 2>nul
mkdir "%BASE%\assets\originals" 2>nul
mkdir "%BASE%\assets\thumbnails" 2>nul
mkdir "%BASE%\uploads" 2>nul
mkdir "%BASE%\results" 2>nul
mkdir "%BASE%\temp" 2>nul
mkdir "%BASE%\logs" 2>nul
mkdir "%BASE%\database\backups" 2>nul
mkdir "%BASE%\docker_data" 2>nul

echo [OK] Directories created at %BASE%
echo.

echo Directory structure:
dir "%BASE%" /B /AD

echo.
echo ========================================
echo   Initialization complete.
echo ========================================
pause
