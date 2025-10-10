import { createClient } from '@libsql/client';
import * as fs from 'fs';
import * as path from 'path';

// Load environment variables
import 'dotenv/config';

const client = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});

async function initDatabase() {
  console.log('🔧 Initializing Turso database...');
  
  try {
    // Read and execute first migration
    const migration1 = fs.readFileSync(
      path.join(__dirname, '../drizzle/0000_windy_lucky_pierre.sql'),
      'utf-8'
    );
    
    const statements1 = migration1
      .split('--> statement-breakpoint')
      .map(s => s.trim())
      .filter(s => s.length > 0);
    
    for (const statement of statements1) {
      try {
        await client.execute(statement);
      } catch (error: any) {
        // Ignore "already exists" errors
        if (!error.message.includes('already exists')) {
          throw error;
        }
      }
    }
    
    console.log('✅ First migration applied');
    
    // Read and execute second migration
    const migration2 = fs.readFileSync(
      path.join(__dirname, '../drizzle/0001_futuristic_maddog.sql'),
      'utf-8'
    );
    
    const statements2 = migration2
      .split('--> statement-breakpoint')
      .map(s => s.trim())
      .filter(s => s.length > 0);
    
    for (const statement of statements2) {
      try {
        await client.execute(statement);
      } catch (error: any) {
        // Ignore "duplicate column" errors
        if (!error.message.includes('duplicate column')) {
          console.log('Warning:', error.message);
        }
      }
    }
    
    console.log('✅ Second migration applied');
    console.log('✅ Database initialized successfully!');
    
  } catch (error) {
    console.error('❌ Error initializing database:', error);
    process.exit(1);
  }
}

initDatabase();
