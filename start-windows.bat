@echo off
echo Starting EcoBin Production Server...
echo.

REM Check if node_modules exists
if not exist "node_modules" (
    echo Dependencies not found. Installing...
    npm install
    if %errorlevel% neq 0 (
        echo ERROR: Failed to install dependencies
        echo Please run setup-windows.bat first
        pause
        exit /b 1
    )
)

REM Set environment variable for Windows
set NODE_ENV=production

REM Build the application first
echo Building application...
npm run build
if %errorlevel% neq 0 (
    echo ERROR: Build failed
    pause
    exit /b 1
)

REM Start the production server
echo Starting production server...
node dist/index.js