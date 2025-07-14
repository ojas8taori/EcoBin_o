import mysql from 'mysql2/promise';
import { drizzle } from 'drizzle-orm/mysql2';
import { drizzle as drizzleSqlite } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import * as schema from "@shared/schema";
import { existsSync, mkdirSync } from 'fs';

// Create data directory if it doesn't exist
const dbDir = './data';
if (!existsSync(dbDir)) {
  mkdirSync(dbDir, { recursive: true });
}

// Database connection will be initialized asynchronously
let connection: mysql.Connection | null = null;
let db: ReturnType<typeof drizzle>;

// Initialize database connection
async function initializeDatabase() {
  try {
    // Try to connect to local MySQL first with dedicated user
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'ecobin',
      password: 'ecobin123',
      database: 'ecobin',
      charset: 'utf8mb4',
    });
    
    db = drizzle(connection, { schema, mode: 'default' });
    console.log('Connected to MySQL database (local)');
    
    // Create MySQL tables
    await createMySQLTables();
    return true;
  } catch (mysqlError) {
    console.log('Dedicated MySQL user not available, trying root user...');
    
    try {
      // Try with root user (no password)
      connection = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: '',
        database: 'ecobin',
        charset: 'utf8mb4',
      });
      
      db = drizzle(connection, { schema, mode: 'default' });
      console.log('Connected to MySQL database (root)');
      
      // Create MySQL tables
      await createMySQLTables();
      return true;
    } catch (rootError) {
      console.log('MySQL not available, falling back to SQLite for local storage');
      
      // Fallback to better-sqlite3 if MySQL is not available
      const dbPath = './data/local.db';
      const sqlite = new Database(dbPath);
      sqlite.exec('PRAGMA foreign_keys = ON;');
      
      db = drizzleSqlite(sqlite, { schema });
      
      // Create tables for SQLite
      createSQLiteTables(sqlite);
      return false;
    }
  }
}

// Initialize database immediately (no top-level await)
initializeDatabase().then(() => {
  console.log('Database initialization completed');
}).catch(error => {
  console.error('Database initialization failed:', error);
});

export { db };

function createSQLiteTables(sqlite: any) {

  try {
    // Create all tables for SQLite
    sqlite.exec(`
    CREATE TABLE IF NOT EXISTS sessions (
      sid TEXT PRIMARY KEY,
      sess TEXT NOT NULL,
      expire INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY NOT NULL,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      email TEXT,
      first_name TEXT,
      last_name TEXT,
      profile_image_url TEXT,
      eco_points INTEGER DEFAULT 0,
      carbon_footprint REAL DEFAULT 0,
      green_tier TEXT DEFAULT 'Bronze',
      language TEXT DEFAULT 'en',
      created_at INTEGER DEFAULT (strftime('%s', 'now') * 1000),
      updated_at INTEGER DEFAULT (strftime('%s', 'now') * 1000)
    );

    CREATE TABLE IF NOT EXISTS waste_entries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL REFERENCES users(id),
      waste_type TEXT NOT NULL,
      quantity REAL NOT NULL,
      unit TEXT NOT NULL,
      disposal_method TEXT,
      eco_points_earned INTEGER DEFAULT 0,
      image_url TEXT,
      notes TEXT,
      created_at INTEGER DEFAULT (strftime('%s', 'now') * 1000)
    );

    CREATE TABLE IF NOT EXISTS pickup_schedules (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL REFERENCES users(id),
      waste_type TEXT NOT NULL,
      scheduled_date INTEGER NOT NULL,
      status TEXT DEFAULT 'scheduled',
      address TEXT NOT NULL,
      special_instructions TEXT,
      estimated_quantity TEXT,
      actual_quantity REAL,
      pickup_personnel TEXT,
      completed_at INTEGER,
      created_at INTEGER DEFAULT (strftime('%s', 'now') * 1000)
    );

    CREATE TABLE IF NOT EXISTS community_reports (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL REFERENCES users(id),
      report_type TEXT NOT NULL,
      description TEXT NOT NULL,
      location TEXT NOT NULL,
      latitude REAL,
      longitude REAL,
      image_url TEXT,
      status TEXT DEFAULT 'reported',
      priority TEXT DEFAULT 'medium',
      assigned_to TEXT,
      resolved_at INTEGER,
      created_at INTEGER DEFAULT (strftime('%s', 'now') * 1000)
    );

    CREATE TABLE IF NOT EXISTS cleanup_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      location TEXT NOT NULL,
      latitude REAL,
      longitude REAL,
      event_date INTEGER NOT NULL,
      duration INTEGER,
      max_participants INTEGER,
      current_participants INTEGER DEFAULT 0,
      organizer_id TEXT REFERENCES users(id),
      eco_points_reward INTEGER DEFAULT 0,
      status TEXT DEFAULT 'upcoming',
      created_at INTEGER DEFAULT (strftime('%s', 'now') * 1000)
    );

    CREATE TABLE IF NOT EXISTS event_participants (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      event_id INTEGER REFERENCES cleanup_events(id),
      user_id TEXT REFERENCES users(id),
      joined_at INTEGER DEFAULT (strftime('%s', 'now') * 1000),
      attended INTEGER DEFAULT 0,
      eco_points_earned INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS eco_challenges (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      challenge_type TEXT NOT NULL,
      target_value INTEGER NOT NULL,
      unit TEXT NOT NULL,
      eco_points_reward INTEGER NOT NULL,
      start_date INTEGER NOT NULL,
      end_date INTEGER NOT NULL,
      is_active INTEGER DEFAULT 1,
      created_at INTEGER DEFAULT (strftime('%s', 'now') * 1000)
    );

    CREATE TABLE IF NOT EXISTS user_challenge_progress (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT REFERENCES users(id),
      challenge_id INTEGER REFERENCES eco_challenges(id),
      current_progress INTEGER DEFAULT 0,
      is_completed INTEGER DEFAULT 0,
      completed_at INTEGER,
      eco_points_earned INTEGER DEFAULT 0,
      created_at INTEGER DEFAULT (strftime('%s', 'now') * 1000)
    );

    CREATE TABLE IF NOT EXISTS rewards (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      type TEXT NOT NULL,
      value REAL NOT NULL,
      eco_points_cost INTEGER NOT NULL,
      category TEXT,
      valid_until INTEGER,
      is_active INTEGER DEFAULT 1,
      stock_quantity INTEGER,
      created_at INTEGER DEFAULT (strftime('%s', 'now') * 1000)
    );

    CREATE TABLE IF NOT EXISTS user_rewards (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT REFERENCES users(id),
      reward_id INTEGER REFERENCES rewards(id),
      redemption_code TEXT,
      redeemed_at INTEGER DEFAULT (strftime('%s', 'now') * 1000),
      used_at INTEGER,
      is_used INTEGER DEFAULT 0,
      expires_at INTEGER
    );

    CREATE TABLE IF NOT EXISTS marketplace_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL REFERENCES users(id),
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      category TEXT NOT NULL,
      condition TEXT NOT NULL,
      images TEXT DEFAULT '[]',
      location TEXT,
      price INTEGER DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'available',
      contact_method TEXT NOT NULL,
      contact_info TEXT NOT NULL,
      eco_points_reward INTEGER DEFAULT 10,
      created_at INTEGER DEFAULT (strftime('%s', 'now') * 1000),
      updated_at INTEGER DEFAULT (strftime('%s', 'now') * 1000)
    );

    CREATE TABLE IF NOT EXISTS eco_points_transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL REFERENCES users(id),
      amount INTEGER NOT NULL,
      source TEXT NOT NULL,
      description TEXT NOT NULL,
      reference_id TEXT,
      created_at INTEGER DEFAULT (strftime('%s', 'now') * 1000)
    );

    CREATE INDEX IF NOT EXISTS IDX_session_expire ON sessions(expire);
  `);
    console.log('SQLite database tables created successfully');
  } catch (error) {
    console.error('Error creating SQLite database tables:', error);
  }
}

// Create MySQL tables if using MySQL
async function createMySQLTables() {
  if (!connection) return;
  
  try {
    // Create database if it doesn't exist (for root user)
    try {
      await connection.execute('CREATE DATABASE IF NOT EXISTS ecobin');
      await connection.execute('USE ecobin');
    } catch (err) {
      // Database might already exist, continue
      await connection.execute('USE ecobin');
    }
    
    // Create all tables for MySQL
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS sessions (
        sid VARCHAR(255) PRIMARY KEY,
        sess JSON NOT NULL,
        expire DATETIME NOT NULL,
        INDEX IDX_session_expire (expire)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    await connection.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(255) PRIMARY KEY,
        username VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        email VARCHAR(255),
        first_name VARCHAR(255),
        last_name VARCHAR(255),
        profile_image_url VARCHAR(500),
        eco_points INT DEFAULT 0,
        carbon_footprint DECIMAL(10,2) DEFAULT 0,
        green_tier VARCHAR(50) DEFAULT 'Bronze',
        language VARCHAR(10) DEFAULT 'en',
        created_at BIGINT DEFAULT (UNIX_TIMESTAMP(NOW(3)) * 1000),
        updated_at BIGINT DEFAULT (UNIX_TIMESTAMP(NOW(3)) * 1000)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    await connection.execute(`
      CREATE TABLE IF NOT EXISTS waste_entries (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL,
        waste_type VARCHAR(100) NOT NULL,
        quantity DECIMAL(8,2) NOT NULL,
        unit VARCHAR(50) NOT NULL,
        disposal_method VARCHAR(100),
        eco_points_earned INT DEFAULT 0,
        image_url VARCHAR(500),
        notes TEXT,
        created_at BIGINT DEFAULT (UNIX_TIMESTAMP(NOW(3)) * 1000),
        FOREIGN KEY (user_id) REFERENCES users(id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    await connection.execute(`
      CREATE TABLE IF NOT EXISTS pickup_schedules (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL,
        waste_type VARCHAR(100) NOT NULL,
        scheduled_date BIGINT NOT NULL,
        status VARCHAR(50) DEFAULT 'scheduled',
        address TEXT NOT NULL,
        special_instructions TEXT,
        estimated_quantity VARCHAR(100),
        actual_quantity DECIMAL(8,2),
        pickup_personnel VARCHAR(255),
        completed_at BIGINT,
        created_at BIGINT DEFAULT (UNIX_TIMESTAMP(NOW(3)) * 1000),
        FOREIGN KEY (user_id) REFERENCES users(id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    await connection.execute(`
      CREATE TABLE IF NOT EXISTS community_reports (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL,
        report_type VARCHAR(100) NOT NULL,
        description TEXT NOT NULL,
        location TEXT NOT NULL,
        latitude DECIMAL(10,8),
        longitude DECIMAL(11,8),
        image_url VARCHAR(500),
        status VARCHAR(50) DEFAULT 'reported',
        priority VARCHAR(50) DEFAULT 'medium',
        assigned_to VARCHAR(255),
        resolved_at BIGINT,
        created_at BIGINT DEFAULT (UNIX_TIMESTAMP(NOW(3)) * 1000),
        FOREIGN KEY (user_id) REFERENCES users(id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    await connection.execute(`
      CREATE TABLE IF NOT EXISTS cleanup_events (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        location TEXT NOT NULL,
        latitude DECIMAL(10,8),
        longitude DECIMAL(11,8),
        event_date BIGINT NOT NULL,
        duration INT,
        max_participants INT,
        current_participants INT DEFAULT 0,
        organizer_id VARCHAR(255),
        eco_points_reward INT DEFAULT 0,
        status VARCHAR(50) DEFAULT 'upcoming',
        created_at BIGINT DEFAULT (UNIX_TIMESTAMP(NOW(3)) * 1000),
        FOREIGN KEY (organizer_id) REFERENCES users(id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    await connection.execute(`
      CREATE TABLE IF NOT EXISTS event_participants (
        id INT AUTO_INCREMENT PRIMARY KEY,
        event_id INT,
        user_id VARCHAR(255),
        joined_at BIGINT DEFAULT (UNIX_TIMESTAMP(NOW(3)) * 1000),
        attended BOOLEAN DEFAULT FALSE,
        eco_points_earned INT DEFAULT 0,
        FOREIGN KEY (event_id) REFERENCES cleanup_events(id),
        FOREIGN KEY (user_id) REFERENCES users(id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    await connection.execute(`
      CREATE TABLE IF NOT EXISTS eco_challenges (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        challenge_type VARCHAR(50) NOT NULL,
        target_value INT NOT NULL,
        unit VARCHAR(50) NOT NULL,
        eco_points_reward INT NOT NULL,
        start_date BIGINT NOT NULL,
        end_date BIGINT NOT NULL,
        is_active BOOLEAN DEFAULT TRUE,
        created_at BIGINT DEFAULT (UNIX_TIMESTAMP(NOW(3)) * 1000)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    await connection.execute(`
      CREATE TABLE IF NOT EXISTS user_challenge_progress (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id VARCHAR(255),
        challenge_id INT,
        current_progress INT DEFAULT 0,
        is_completed BOOLEAN DEFAULT FALSE,
        completed_at BIGINT,
        eco_points_earned INT DEFAULT 0,
        created_at BIGINT DEFAULT (UNIX_TIMESTAMP(NOW(3)) * 1000),
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (challenge_id) REFERENCES eco_challenges(id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    await connection.execute(`
      CREATE TABLE IF NOT EXISTS rewards (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        type VARCHAR(50) NOT NULL,
        value DECIMAL(10,2) NOT NULL,
        eco_points_cost INT NOT NULL,
        category VARCHAR(100),
        valid_until BIGINT,
        is_active BOOLEAN DEFAULT TRUE,
        stock_quantity INT,
        created_at BIGINT DEFAULT (UNIX_TIMESTAMP(NOW(3)) * 1000)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    await connection.execute(`
      CREATE TABLE IF NOT EXISTS user_rewards (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id VARCHAR(255),
        reward_id INT,
        redemption_code VARCHAR(255),
        redeemed_at BIGINT DEFAULT (UNIX_TIMESTAMP(NOW(3)) * 1000),
        used_at BIGINT,
        is_used BOOLEAN DEFAULT FALSE,
        expires_at BIGINT,
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (reward_id) REFERENCES rewards(id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    await connection.execute(`
      CREATE TABLE IF NOT EXISTS marketplace_items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        category VARCHAR(100) NOT NULL,
        condition VARCHAR(50) NOT NULL,
        images JSON DEFAULT ('[]'),
        location VARCHAR(255),
        price INT DEFAULT 0,
        status VARCHAR(50) NOT NULL DEFAULT 'available',
        contact_method VARCHAR(50) NOT NULL,
        contact_info VARCHAR(255) NOT NULL,
        eco_points_reward INT DEFAULT 10,
        created_at BIGINT DEFAULT (UNIX_TIMESTAMP(NOW(3)) * 1000),
        updated_at BIGINT DEFAULT (UNIX_TIMESTAMP(NOW(3)) * 1000),
        FOREIGN KEY (user_id) REFERENCES users(id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    await connection.execute(`
      CREATE TABLE IF NOT EXISTS eco_points_transactions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL,
        amount INT NOT NULL,
        source VARCHAR(100) NOT NULL,
        description VARCHAR(255) NOT NULL,
        reference_id VARCHAR(255),
        created_at BIGINT DEFAULT (UNIX_TIMESTAMP(NOW(3)) * 1000),
        FOREIGN KEY (user_id) REFERENCES users(id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    console.log('MySQL database tables created successfully');
  } catch (error) {
    console.error('Error creating MySQL database tables:', error);
  }
}

// MySQL tables are created in the initializeDatabase function