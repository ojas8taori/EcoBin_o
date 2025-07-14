@echo off
echo ============================================
echo EcoBin Environment Setup
echo ============================================
echo.

REM Check if .env exists
if exist ".env" (
    echo .env file already exists
    echo.
    echo Current contents:
    type .env
    echo.
    echo To recreate .env file, delete it first and run this script again
    pause
    exit /b 0
)

REM Create .env from .env.example
if not exist ".env.example" (
    echo ERROR: .env.example file not found
    echo Please ensure you are in the correct project directory
    pause
    exit /b 1
)

echo Creating .env file from .env.example...
copy ".env.example" ".env"

echo.
echo ✅ .env file created successfully!
echo.
echo ⚠️  IMPORTANT: You need to edit the .env file and add your API keys:
echo.
echo 1. Open .env file in a text editor
echo 2. Replace 'your_gemini_api_key_here' with your actual Gemini API key
echo 3. Replace 'your_random_secret_key_here' with a random secret key
echo.
echo Example:
echo   GEMINI_API_KEY=AIzaSyD4Ow_Et9huPa2MlSpp9kBHrWjlKfxhKo
echo   SESSION_SECRET=myRandomSecretKey123!@#
echo.
echo Current .env file contents:
echo ----------------------------------------
type .env
echo ----------------------------------------
echo.
echo Would you like to open the .env file in notepad now? (y/n)
set /p choice=
if /i "%choice%"=="y" (
    notepad .env
)

echo.
echo Setup complete! You can now run:
echo   dev-windows.bat
echo.
pause