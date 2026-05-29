import pg from 'pg';

const client = new pg.Client({
  host: 'localhost',
  port: 5432,
  user: 'hrms',
  database: 'postgres', // connect to default db first
});

await client.connect();

// Create hrms database if it doesn't exist
const res = await client.query(`SELECT 1 FROM pg_database WHERE datname = 'hrms'`);
if (res.rowCount === 0) {
  await client.query('CREATE DATABASE hrms');
  console.log('Created database "hrms"');
} else {
  console.log('Database "hrms" already exists');
}

// Set password for hrms user
await client.query(`ALTER USER hrms PASSWORD 'hrms_secret'`);
console.log('Password set for user "hrms"');

await client.end();
console.log('Done.');
