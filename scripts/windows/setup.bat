@echo off
echo Setting up EcoBin for Windows...
echo.

echo Installing npm dependencies...
call npm install

echo.
echo Cross-env installed for Windows compatibility
echo.

echo Creating data directory...
if not exist "data" mkdir data

echo.
echo Setup complete! 
echo.
echo To start development server, run:
echo   scripts\windows\dev.bat
echo.
echo To build for production, run:
echo   scripts\windows\build.bat
echo.
pause