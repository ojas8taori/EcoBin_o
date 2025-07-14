@echo off
echo ============================================
echo EcoBin Windows Installation Script
echo ============================================
echo.

REM Check if running as administrator
net session >nul 2>&1
if %errorlevel% neq 0 (
    echo This script should be run as Administrator for best results.
    echo Right-click and select "Run as administrator"
    echo.
    echo Continuing anyway...
    timeout /t 3 >nul
)

REM Check if Node.js is installed
echo Checking Node.js installation...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed or not in PATH
    echo Please install Node.js from: https://nodejs.org/
    echo Choose the LTS version and make sure to add Node.js to PATH
    pause
    exit /b 1
)

REM Get Node.js version
for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
echo Node.js version: %NODE_VERSION%

REM Check if npm is installed
echo Checking npm installation...
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: npm is not installed or not in PATH
    echo Please reinstall Node.js from: https://nodejs.org/
    pause
    exit /b 1
)

REM Get npm version
for /f "tokens=*" %%i in ('npm --version') do set NPM_VERSION=%%i
echo npm version: %NPM_VERSION%
echo.

REM Create data directory
echo Creating data directory...
if not exist "data" (
    mkdir data
    echo Data directory created: %cd%\data
) else (
    echo Data directory already exists: %cd%\data
)
echo.

REM Clear npm cache to prevent issues
echo Clearing npm cache...
npm cache clean --force

REM Remove existing node_modules if they exist
if exist "node_modules" (
    echo Removing existing node_modules...
    rmdir /s /q "node_modules"
)

REM Install dependencies
echo Installing dependencies...
echo This may take a few minutes...
npm install --verbose
if %errorlevel% neq 0 (
    echo.
    echo ERROR: Failed to install dependencies
    echo.
    echo Troubleshooting steps:
    echo 1. Check your internet connection
    echo 2. Try running: npm cache clean --force
    echo 3. Delete node_modules folder and try again
    echo 4. Check if you have sufficient disk space
    echo.
    pause
    exit /b 1
)

echo.
echo Dependencies installed successfully!
echo.

REM Check if MySQL is installed
echo Checking MySQL installation...
mysql --version >nul 2>&1
if %errorlevel% neq 0 (
    echo MySQL is not installed or not in PATH.
    echo The application will use SQLite as a fallback.
    echo.
    echo For full functionality, you can install MySQL from:
    echo https://dev.mysql.com/downloads/installer/
    echo.
    echo Choose "MySQL Installer for Windows" and select:
    echo - MySQL Server
    echo - MySQL Workbench (optional)
    echo.
) else (
    for /f "tokens=*" %%i in ('mysql --version') do set MYSQL_VERSION=%%i
    echo MySQL version: %MYSQL_VERSION%
    echo.
    echo Setting up MySQL database...
    echo You will be prompted for the MySQL root password.
    echo If you don't have a password, just press Enter.
    echo.
    mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS ecobin; CREATE USER IF NOT EXISTS 'ecobin'@'localhost' IDENTIFIED BY 'ecobin123'; GRANT ALL PRIVILEGES ON ecobin.* TO 'ecobin'@'localhost'; FLUSH PRIVILEGES; SELECT 'Database setup completed successfully!' AS Status;"
    if %errorlevel% equ 0 (
        echo MySQL database configured successfully!
    ) else (
        echo MySQL setup failed. The application will use SQLite fallback.
    )
)

REM Create .env file from example if it doesn't exist
if not exist ".env" (
    echo Creating .env file from .env.example...
    copy ".env.example" ".env"
    echo.
    echo ⚠️  IMPORTANT: Please edit .env file and add your API keys:
    echo    - GEMINI_API_KEY=your_actual_api_key
    echo    - SESSION_SECRET=your_random_secret_key
    echo.
) else (
    echo .env file already exists
)

echo.
echo ============================================
echo Installation completed successfully!
echo ============================================
echo.
echo Project location: %cd%
echo Data storage: %cd%\data
echo Database: MySQL (with SQLite fallback)
echo.
echo NEXT STEPS:
echo 1. Edit .env file and add your API keys
echo 2. Run: dev-windows.bat
echo.
echo The application will be available at: http://localhost:5000
echo.
echo Press any key to exit...
pause >nul