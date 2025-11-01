require('ts-node/register/transpile-only');

const express = require('express');
const request = require('supertest');

async function main() {
  const { errorHandler } = require('../src/middleware/error.middleware');
  const { AppError } = require('../src/utils/app-error');
  const app = express();
  app.get('/error', () => { throw new AppError('Not Found', 404, { resource: 'test' }); });
  app.use(errorHandler);
  const res = await request(app).get('/error');
  console.log('STATUS', res.status);
  console.log('BODY', res.body);
}

main().catch((e) => { console.error(e); process.exit(1); });

