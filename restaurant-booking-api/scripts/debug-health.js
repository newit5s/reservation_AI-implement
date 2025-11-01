require('ts-node/register/transpile-only');

process.env.NODE_ENV = process.env.NODE_ENV || 'test';
process.env.FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

async function main() {
  const { createApp } = require('../src/config/app');
  const request = require('supertest');
  const app = createApp();
  const res = await request(app).get('/api/health');
  console.log('STATUS', res.status);
  console.log('ORIGIN', res.headers['access-control-allow-origin']);
  console.log('RATELIMIT-LIMIT', res.headers['ratelimit-limit']);
  console.log('RATELIMIT-POLICY', res.headers['ratelimit-policy']);
  console.log('BODY', res.body);
}

main().catch((e) => {
  console.error('ERR', e);
  process.exit(1);
});

