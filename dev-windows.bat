@echo off
echo Starting EcoBin Development Server...
echo.

REM Check if we're in the correct directory
if not exist "package.json" (
    echo ERROR: package.json not found
    echo Please ensure you are in the correct EcoBin project directory
    echo Current directory: %cd%
    echo.
    echo The directory should contain:
    echo - package.json
    echo - server/
    echo - client/
    echo - shared/
    echo.
    echo Run fix-windows-directory.bat to check directory structure
    pause
    exit /b 1
)

REM Check if node_modules exists
if not exist "node_modules" (
    echo Dependencies not found. Installing...
    npm install
    if %errorlevel% neq 0 (
        echo ERROR: Failed to install dependencies
        echo Please run install-windows.bat first
        pause
        exit /b 1
    )
)

REM Check if server directory exists
if not exist "server" (
    echo ERROR: server/ directory not found
    echo Please ensure you are in the correct EcoBin project directory
    pause
    exit /b 1
)

REM Set environment variable for Windows
set NODE_ENV=development

REM Start the development server
echo Starting server...
npx tsx server/index.ts