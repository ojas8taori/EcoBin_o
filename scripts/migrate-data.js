#!/usr/bin/env node
/**
 * Data Migration Script
 * This script helps migrate data from Replit's database to your local PostgreSQL database
 */

import { Pool } from 'pg';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const sourcePool = new Pool({
  connectionString: process.env.REPLIT_DATABASE_URL || process.env.DATABASE_URL,
  ssl: false
});

const targetPool = new Pool({
  connectionString: process.env.LOCAL_DATABASE_URL || process.env.DATABASE_URL,
  ssl: false
});

async function migrateData() {
  console.log('Starting data migration...');
  
  try {
    // List of tables to migrate
    const tables = [
      'users',
      'waste_entries',
      'pickup_schedules',
      'community_reports',
      'cleanup_events',
      'event_participants',
      'eco_challenges',
      'user_challenge_progress',
      'rewards',
      'user_rewards'
    ];

    for (const table of tables) {
      console.log(`Migrating table: ${table}`);
      
      try {
        // Get data from source
        const sourceResult = await sourcePool.query(`SELECT * FROM ${table}`);
        const rows = sourceResult.rows;
        
        if (rows.length === 0) {
          console.log(`  No data found in ${table}`);
          continue;
        }
        
        // Get column names
        const columns = Object.keys(rows[0]);
        const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');
        const columnNames = columns.join(', ');
        
        // Insert data into target
        const insertQuery = `
          INSERT INTO ${table} (${columnNames}) 
          VALUES (${placeholders})
          ON CONFLICT (id) DO UPDATE SET ${columns.map(col => `${col} = EXCLUDED.${col}`).join(', ')}
        `;
        
        for (const row of rows) {
          const values = columns.map(col => row[col]);
          await targetPool.query(insertQuery, values);
        }
        
        console.log(`  Migrated ${rows.length} records from ${table}`);
      } catch (error) {
        console.error(`  Error migrating ${table}:`, error.message);
      }
    }
    
    console.log('Data migration completed!');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await sourcePool.end();
    await targetPool.end();
  }
}

// Run migration if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  migrateData();
}

export { migrateData };