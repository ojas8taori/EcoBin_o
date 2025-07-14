@echo off
echo Testing EcoBin Windows Setup...
echo.

echo Checking Node.js...
node --version
if %errorlevel% neq 0 (
    echo ERROR: Node.js not found. Please install Node.js v18+ from https://nodejs.org/
    pause
    exit /b 1
)

echo Checking npm...
npm --version
if %errorlevel% neq 0 (
    echo ERROR: npm not found. Please install Node.js v18+ from https://nodejs.org/
    pause
    exit /b 1
)

echo.
echo Checking project dependencies...
if not exist "node_modules" (
    echo Warning: node_modules not found. Run setup.bat first.
    pause
    exit /b 1
)

echo.
echo Checking database directory...
if not exist "data" mkdir data

echo.
echo Testing cross-env...
npx cross-env NODE_ENV=test node -e "console.log('Environment test:', process.env.NODE_ENV)"
if %errorlevel% neq 0 (
    echo ERROR: cross-env test failed
    pause
    exit /b 1
)

echo.
echo SUCCESS: All tests passed!
echo.
echo You can now run:
echo   scripts\windows\dev.bat    - to start development server
echo   scripts\windows\build.bat  - to build for production
echo   scripts\windows\start.bat  - to start production server
echo.
pause