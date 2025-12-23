@echo off
echo ========================================
echo   Starting Backend Server
echo ========================================
echo.

cd /d "%~dp0"

echo Checking Python installation...
python --version
if errorlevel 1 (
    echo ERROR: Python not found!
    echo Please install Python 3.11 or higher
    pause
    exit /b 1
)
echo.

echo Current directory: %CD%
echo.

echo Starting FastAPI server...
echo Backend will run on: http://localhost:8001
echo Press Ctrl+C to stop the server
echo.
echo ========================================
echo.

python main.py

pause
