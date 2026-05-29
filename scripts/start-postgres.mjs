import EmbeddedPostgres from 'embedded-postgres';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const pg = new EmbeddedPostgres({
  databaseDir: path.join(__dirname, 'pgdata'),
  user: 'hrms',
  password: 'hrms_secret',
  port: 5432,
  persistent: true,
});

console.log('Initializing PostgreSQL...');
await pg.initialise();

console.log('Starting PostgreSQL on port 5432...');
await pg.start();

console.log('Creating database "hrms"...');
try {
  const client = pg.getPgClient();
  await client.connect();
  await client.query('CREATE DATABASE hrms');
  await client.end();
  console.log('Database "hrms" created.');
} catch (e) {
  if (e.message?.includes('already exists')) {
    console.log('Database "hrms" already exists, skipping.');
  } else {
    console.error('DB create error:', e.message);
  }
}

console.log('\nPostgreSQL is running on localhost:5432');
console.log('  User:     hrms');
console.log('  Password: hrms_secret');
console.log('  Database: hrms');
console.log('\nPress Ctrl+C to stop.');

process.on('SIGINT', async () => {
  console.log('\nStopping PostgreSQL...');
  await pg.stop();
  process.exit(0);
});

// Keep process alive
setInterval(() => {}, 60000);
