@echo off
echo Setting up EcoBin for Windows...
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed. Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

REM Check if npm is installed
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: npm is not installed. Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

echo Node.js and npm are installed.
echo.

REM Check if MySQL is installed
mysql --version >nul 2>&1
if %errorlevel% neq 0 (
    echo WARNING: MySQL is not installed or not in PATH.
    echo The application will work with SQLite as fallback.
    echo For full functionality, install MySQL from https://dev.mysql.com/downloads/installer/
    echo.
) else (
    echo MySQL is installed.
    echo.
)

REM Install dependencies
echo Installing dependencies...
npm install
if %errorlevel% neq 0 (
    echo ERROR: Failed to install dependencies
    echo Please check your internet connection and try again
    pause
    exit /b 1
)

echo Dependencies installed successfully!

REM Create data directory
if not exist "data" mkdir data

REM Create MySQL database and user (if MySQL is available)
mysql --version >nul 2>&1
if %errorlevel% equ 0 (
    echo Setting up MySQL database...
    mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS ecobin; CREATE USER IF NOT EXISTS 'ecobin'@'localhost' IDENTIFIED BY 'ecobin123'; GRANT ALL PRIVILEGES ON ecobin.* TO 'ecobin'@'localhost'; FLUSH PRIVILEGES;"
    echo MySQL database setup completed.
) else (
    echo Skipping MySQL setup - using SQLite fallback.
)

echo.
echo Setup completed successfully!
echo.
echo To start the application:
echo   npm run dev:windows
echo.
echo Or use the dev-windows.bat script
echo.
pause