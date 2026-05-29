process.env.PORT = process.env.PORT ?? '4000';
await import('../apps/api/dist/main.js');

