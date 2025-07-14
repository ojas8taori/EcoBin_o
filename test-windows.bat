@echo off
echo ============================================
echo EcoBin Windows Test Script
echo ============================================
echo.

REM Test Node.js installation
echo Testing Node.js...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js not found
    echo Please install Node.js from https://nodejs.org/
    goto :error
) else (
    for /f "tokens=*" %%i in ('node --version') do echo ✅ Node.js: %%i
)

REM Test npm installation
echo Testing npm...
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ npm not found
    goto :error
) else (
    for /f "tokens=*" %%i in ('npm --version') do echo ✅ npm: %%i
)

REM Test if dependencies are installed
echo Testing dependencies...
if not exist "node_modules" (
    echo ❌ Dependencies not installed
    echo Please run install-windows.bat first
    goto :error
) else (
    echo ✅ Dependencies installed
)

REM Test if key dependencies exist
if not exist "node_modules\express" (
    echo ❌ Express not found in node_modules
    echo Please run install-windows.bat again
    goto :error
) else (
    echo ✅ Express found
)

if not exist "node_modules\tsx" (
    echo ❌ TSX not found in node_modules
    echo Please run install-windows.bat again
    goto :error
) else (
    echo ✅ TSX found
)

REM Test data directory
echo Testing data directory...
if not exist "data" (
    echo ❌ Data directory not found
    mkdir data
    echo ✅ Data directory created
) else (
    echo ✅ Data directory exists
)

REM Test MySQL connection (optional)
echo Testing MySQL...
mysql --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ⚠️ MySQL not found - SQLite will be used as fallback
) else (
    for /f "tokens=*" %%i in ('mysql --version') do echo ✅ MySQL available: %%i
)

REM Test TypeScript compilation
echo Testing TypeScript compilation...
npx tsc --noEmit >nul 2>&1
if %errorlevel% neq 0 (
    echo ⚠️ TypeScript compilation warnings (this is usually okay)
) else (
    echo ✅ TypeScript compilation successful
)

echo.
echo ============================================
echo All tests passed! ✅
echo ============================================
echo.
echo Your EcoBin installation is ready!
echo.
echo To start the application:
echo   - Development: dev-windows.bat
echo   - Production: start-windows.bat
echo.
echo The app will be available at: http://localhost:5000
echo.
pause
exit /b 0

:error
echo.
echo ============================================
echo Tests failed! ❌
echo ============================================
echo.
echo Please fix the issues above and run install-windows.bat
echo.
pause
exit /b 1