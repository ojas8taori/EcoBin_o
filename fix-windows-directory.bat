@echo off
echo ============================================
echo EcoBin Directory Structure Fix
echo ============================================
echo.

echo Current directory: %cd%
echo.

echo Checking for package.json...
if exist "package.json" (
    echo ✅ package.json found in current directory
) else (
    echo ❌ package.json not found in current directory
    echo Looking for package.json in parent directories...
    
    if exist "..\package.json" (
        echo ✅ package.json found in parent directory
        echo Moving to parent directory...
        cd ..
        echo New directory: %cd%
    ) else (
        echo ❌ package.json not found in parent directory either
        echo.
        echo Please ensure you are in the correct EcoBin project directory
        echo The directory should contain:
        echo - package.json
        echo - server/
        echo - client/
        echo - shared/
        echo.
        dir /b
        echo.
        pause
        exit /b 1
    )
)

echo.
echo Checking project structure...
if exist "server" (
    echo ✅ server/ directory found
) else (
    echo ❌ server/ directory not found
)

if exist "client" (
    echo ✅ client/ directory found
) else (
    echo ❌ client/ directory not found
)

if exist "shared" (
    echo ✅ shared/ directory found
) else (
    echo ❌ shared/ directory not found
)

if exist "node_modules" (
    echo ✅ node_modules/ directory found
) else (
    echo ❌ node_modules/ directory not found
    echo You may need to run: npm install
)

echo.
echo Directory contents:
dir /b
echo.

echo ============================================
echo Directory check complete
echo ============================================
echo.
echo If all files are present, you can now run:
echo   dev-windows.bat
echo.
echo If package.json is missing, please extract the project again
echo to ensure all files are in the correct location.
echo.
pause