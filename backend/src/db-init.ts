import dotenv from 'dotenv';
dotenv.config();

import { initializeDatabase } from './db';

async function main() {
  try {
    console.log('Initializing database schema...');
    await initializeDatabase();
    console.log('Database initialization complete!');
    process.exit(0);
  } catch (error) {
    console.error('Failed to initialize database:', error);
    process.exit(1);
  }
}

main();
