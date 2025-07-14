#!/usr/bin/env node
/**
 * Data Export Script
 * This script exports data from the current database to JSON files for backup/migration
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

async function exportData() {
  console.log('Starting data export...');
  
  try {
    // Create export directory
    const exportDir = path.join(process.cwd(), 'data-export');
    if (!fs.existsSync(exportDir)) {
      fs.mkdirSync(exportDir, { recursive: true });
    }
    
    // List of tables to export
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

    const exportData = {};
    
    for (const table of tables) {
      console.log(`Exporting table: ${table}`);
      
      try {
        const result = await pool.query(`SELECT * FROM ${table} ORDER BY id`);
        exportData[table] = result.rows;
        
        // Also save individual table files
        const tableFile = path.join(exportDir, `${table}.json`);
        fs.writeFileSync(tableFile, JSON.stringify(result.rows, null, 2));
        
        console.log(`  Exported ${result.rows.length} records from ${table}`);
      } catch (error) {
        console.error(`  Error exporting ${table}:`, error.message);
        exportData[table] = [];
      }
    }
    
    // Save combined export file
    const combinedFile = path.join(exportDir, 'full-export.json');
    fs.writeFileSync(combinedFile, JSON.stringify(exportData, null, 2));
    
    // Save metadata
    const metadata = {
      exportDate: new Date().toISOString(),
      version: '1.0.0',
      tables: Object.keys(exportData).map(table => ({
        name: table,
        recordCount: exportData[table].length
      }))
    };
    
    const metadataFile = path.join(exportDir, 'metadata.json');
    fs.writeFileSync(metadataFile, JSON.stringify(metadata, null, 2));
    
    console.log(`Data export completed! Files saved to: ${exportDir}`);
    console.log('Export summary:');
    metadata.tables.forEach(table => {
      console.log(`  ${table.name}: ${table.recordCount} records`);
    });
    
  } catch (error) {
    console.error('Export failed:', error);
  } finally {
    await pool.end();
  }
}

// Run export if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  exportData();
}

export { exportData };