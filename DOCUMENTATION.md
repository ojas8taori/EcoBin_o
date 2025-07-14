# EcoBin - Smart Waste Management & Sustainability Portal

## Overview
EcoBin is a comprehensive full-stack web application designed to transform waste management through intelligent tools, community engagement, and sustainability education. Built with real environmental data and facts, EcoBin educates users about the global waste crisis while providing practical tools for sustainable living.

## Real Environmental Impact Data
- **2+ Billion tons** of waste generated globally each year (70% increase expected by 2050)
- **One-third** of all food production is wasted globally
- **Millions** of marine animals die annually from plastic pollution
- **Small percentage** of plastic waste is actually recycled
- **Landfills** contribute significant methane emissions
- **Textile waste** largely ends up in landfills
- **Soil health** is critical for carbon storage and biodiversity

## Quick Start

### Windows Users (Recommended Method)
1. **Extract** the project to any folder (e.g., `C:\EcoBin`)
2. **Open Command Prompt as Administrator** 
3. **Navigate** to the project folder
4. **Run setup**: `scripts\windows\setup.bat` (first time only)
5. **Start server**: `scripts\windows\dev.bat`
6. **Open browser** to: `http://localhost:5000`

### Alternative Method (All Platforms)
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Access at http://localhost:5000
```

## Windows Setup Guide

### Prerequisites
1. **Node.js** (v18 or higher)
   - Download from [nodejs.org](https://nodejs.org/)
   - Verify installation: `node --version` and `npm --version`

2. **MySQL** (optional but recommended)
   - Download from [postgresql.org](https://www.postgresql.org/download/windows/)
   - During installation, remember the password you set for the `postgres` user
   - Default port: 3306

3. **Git** (optional but recommended)
   - Download from [git-scm.com](https://git-scm.com/)

### Windows Batch Files

The `scripts/windows/` folder contains Windows-specific batch files:

#### `dev.bat`
```batch
@echo off
set NODE_ENV=development
tsx server/index.ts
```

#### `start.bat` 
```batch
@echo off
set NODE_ENV=production
node dist/index.js
```

#### `build.bat`
```batch
@echo off
echo Building frontend...
call vite build
echo Building backend...
call esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist
echo Build completed!
```

## Database Configuration

### MySQL (Recommended)
- **Host**: localhost
- **Database**: ecobin  
- **User**: ecobin
- **Password**: ecobin123
- **URL**: `mysql://ecobin:ecobin123@localhost:3306/ecobin`

Setup commands:
```sql
CREATE DATABASE ecobin;
CREATE USER 'ecobin'@'localhost' IDENTIFIED BY 'ecobin123';
GRANT ALL PRIVILEGES ON ecobin.* TO 'ecobin'@'localhost';
FLUSH PRIVILEGES;
```

### SQLite (Automatic Fallback)
- **File**: `./data/local.db`
- **No setup required**
- **Used when MySQL is not available**

## Environment Variables

Create a `.env` file in the root directory with:
```
DATABASE_URL=mysql://ecobin:ecobin123@localhost:3306/ecobin
GEMINI_API_KEY=your_gemini_api_key
SESSION_SECRET=your_random_secret_key
PORT=5000
```

### Getting API Keys

#### Gemini API Key
1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Create a new API key
3. Copy the key to your `.env` file

#### Session Secret
Generate a random string for session security:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Available Scripts

### Standard npm Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production  
- `npm run start` - Start production server
- `npm run db:push` - Push database schema changes
- `npm run check` - TypeScript type checking

### Windows Batch Scripts
- `scripts\windows\dev.bat` - Start development server (Windows)
- `scripts\windows\build.bat` - Build application (Windows)
- `scripts\windows\start.bat` - Start production server (Windows)

## Features

### Core Features
- ✅ Smart waste pickup scheduling
- ✅ AI-powered waste scanner (requires Gemini API key)
- ✅ Community reporting system
- ✅ Eco-points and rewards
- ✅ Educational platform with quizzes
- ✅ Analytics dashboard
- ✅ Multi-language support
- ✅ Dark/light theme switching

### Technical Features
- **Frontend**: React 18 with TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Node.js with Express.js, TypeScript
- **Database**: MySQL with SQLite fallback, Drizzle ORM
- **AI Integration**: Google Gemini for waste image analysis
- **Authentication**: Replit Auth with session management
- **Build Tool**: Vite for development and production builds

## Troubleshooting

### Windows-specific Issues

#### NODE_ENV Error
If you get `'NODE_ENV' is not recognized as an internal or external command`:
- Use the Windows batch files in `scripts/windows/` folder
- Or install cross-env: `npm install -g cross-env` and use `cross-env NODE_ENV=development tsx server/index.ts`

#### Permission Errors
- Run Command Prompt as Administrator
- For PowerShell, use: `Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser`

#### MySQL Connection Issues
```cmd
# Check MySQL service
net start mysql80

# Test connection
mysql -u root -p

# Recreate database
DROP DATABASE IF EXISTS ecobin;
CREATE DATABASE ecobin;
```

### Common Issues

#### Database Connection Error
- Check your DATABASE_URL in `.env`
- Ensure MySQL service is running
- Application will fallback to SQLite if MySQL is unavailable

#### Port Already in Use
```cmd
# Find process using port 5000
netstat -ano | findstr :5000

# Kill process (replace PID with actual number)
taskkill /PID [PID] /F

# Or change PORT in .env to another number
```

#### Missing Dependencies
```cmd
# Clear cache and reinstall
rmdir /s /q node_modules
npm cache clean --force
npm install
```

## Data Storage

All data is stored **locally** on your system:
- **MySQL**: Local database server
- **SQLite**: `./data/local.db` file  
- **No external connections** required for basic functionality
- **Gemini API**: Only used for AI waste analysis feature

## Security Notes

- Default MySQL password: `ecobin123` (change for production)
- Application runs on `localhost` only by default
- All data remains on your local machine
- Session secrets should be randomly generated
- For production deployment, configure HTTPS and update security settings

## Production Deployment

1. **Build the application**:
   ```bash
   npm run build
   ```

2. **Set production environment variables**
3. **Start production server**:
   ```bash
   npm run start
   ```

4. **Configure reverse proxy** (nginx/Apache) for HTTPS
5. **Set up process manager** (PM2) for reliability

## File Structure

```
EcoBin/
├── scripts/
│   └── windows/              # Windows batch files
│       ├── dev.bat          # Development server
│       ├── build.bat        # Build application  
│       └── start.bat        # Production server
├── client/                   # Frontend React application
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── pages/           # Application pages
│   │   ├── hooks/           # Custom React hooks
│   │   └── lib/             # Utility functions
├── server/                   # Backend Express application
│   ├── routes.ts            # API route definitions
│   ├── storage.ts           # Database interface
│   ├── auth.ts              # Authentication logic
│   ├── gemini.ts            # AI integration
│   └── db.ts                # Database configuration
├── shared/                   # Shared types and schemas
│   └── schema.ts            # Database schema definitions
├── data/                     # Local database files (auto-created)
├── .env                      # Environment variables
├── package.json              # Dependencies and scripts
└── DOCUMENTATION.md          # This file
```

## Migration and Data Management

### Data Export
```bash
node scripts/export-data.js
```

### Data Import  
```bash
node scripts/import-data.js
```

### Database Migration
```bash
node scripts/migrate-data.js
```

## Support

For technical issues:
1. Check console logs in Command Prompt/Terminal
2. Verify database connection (check if `data/local.db` exists for SQLite)
3. Ensure all environment variables are set correctly
4. For MySQL issues, verify service is running
5. For Windows issues, try running as Administrator

The application is designed to work completely offline with local data storage while providing optional cloud AI features when API keys are configured.