#!/usr/bin/env node
/**
 * Data Import Script
 * This script imports data from JSON export files to your local PostgreSQL database
 */

import { Pool } from 'pg';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function importData(dataDir = 'data-export') {
  console.log('Starting data import...');
  
  try {
    const exportDir = path.join(process.cwd(), dataDir);
    
    if (!fs.existsSync(exportDir)) {
      console.error(`Export directory not found: ${exportDir}`);
      console.log('Please run the export script first or specify a different directory');
      return;
    }
    
    // Check for metadata file
    const metadataFile = path.join(exportDir, 'metadata.json');
    if (fs.existsSync(metadataFile)) {
      const metadata = JSON.parse(fs.readFileSync(metadataFile, 'utf8'));
      console.log(`Import source: ${metadata.exportDate}`);
      console.log(`Total tables: ${metadata.tables.length}`);
    }
    
    // List of tables to import (order matters for foreign keys)
    const tables = [
      'users',
      'eco_challenges',
      'rewards',
      'waste_entries',
      'pickup_schedules',
      'community_reports',
      'cleanup_events',
      'event_participants',
      'user_challenge_progress',
      'user_rewards'
    ];

    for (const table of tables) {
      console.log(`Importing table: ${table}`);
      
      const tableFile = path.join(exportDir, `${table}.json`);
      
      if (!fs.existsSync(tableFile)) {
        console.log(`  File not found: ${tableFile}, skipping...`);
        continue;
      }
      
      try {
        const data = JSON.parse(fs.readFileSync(tableFile, 'utf8'));
        
        if (data.length === 0) {
          console.log(`  No data found in ${table}`);
          continue;
        }
        
        // Get column names from first record
        const columns = Object.keys(data[0]);
        const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');
        const columnNames = columns.join(', ');
        
        // Create upsert query (insert or update on conflict)
        const upsertQuery = `
          INSERT INTO ${table} (${columnNames}) 
          VALUES (${placeholders})
          ON CONFLICT (id) DO UPDATE SET 
          ${columns.filter(col => col !== 'id').map(col => `${col} = EXCLUDED.${col}`).join(', ')}
        `;
        
        // Clear existing data (optional - comment out if you want to keep existing data)
        // await pool.query(`DELETE FROM ${table}`);
        
        // Insert data
        for (const row of data) {
          const values = columns.map(col => row[col]);
          await pool.query(upsertQuery, values);
        }
        
        console.log(`  Imported ${data.length} records into ${table}`);
      } catch (error) {
        console.error(`  Error importing ${table}:`, error.message);
      }
    }
    
    console.log('Data import completed!');
  } catch (error) {
    console.error('Import failed:', error);
  } finally {
    await pool.end();
  }
}

// Run import if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const dataDir = process.argv[2] || 'data-export';
  importData(dataDir);
}

export { importData };