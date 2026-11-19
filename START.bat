@echo off
title FUTURE ENGLISH CENTER - Running
cd /d "%~dp0"
echo ===================================================
echo     FUTURE ENGLISH CENTER - Starting Platform
echo ===================================================
echo.
echo Menjalankan Database, Backend API, dan Frontend...
echo Browser akan otomatis terbuka ke: http://localhost:5173
echo.
node start.mjs
pause
