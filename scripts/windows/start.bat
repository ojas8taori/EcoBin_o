@echo off
echo Starting EcoBin production server...
echo.
npx cross-env NODE_ENV=production node dist/index.js