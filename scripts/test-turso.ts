import { createClient } from '@libsql/client';
import 'dotenv/config';

const url = process.env.TURSO_DATABASE_URL!;
const authToken = process.env.TURSO_AUTH_TOKEN!;

console.log('Testing Turso connection...');
console.log('URL:', url);
console.log('Token length:', authToken.length);
console.log('Token starts with:', authToken.substring(0, 20) + '...');

const client = createClient({ url, authToken });

async function test() {
  try {
    const result = await client.execute('SELECT 1');
    console.log('✅ Connection successful!');
    console.log('Result:', result);
  } catch (error: any) {
    console.error('❌ Connection failed:', error.message);
    console.error('Full error:', error);
  }
}

test();
