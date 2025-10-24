# Restaurant Booking API

A TypeScript Express backend for the restaurant booking platform.

## Getting Started

```bash
npm install
cp .env.example .env
npm run dev
```

The server will start on [http://localhost:5000](http://localhost:5000).

## Available Scripts

- `npm run dev` - start development server with nodemon and ts-node
- `npm run build` - compile TypeScript to JavaScript
- `npm start` - run the compiled application
- `npm test` - execute Jest tests
- `npm run lint` - lint the codebase with ESLint
- `npm run prisma:generate` - generate Prisma client
- `npm run prisma:migrate` - run Prisma migrations in development

## Folder Structure

```
src/
├── config/
├── controllers/
├── middleware/
├── models/
├── routes/
├── services/
├── types/
└── utils/
```

## Environment Variables

Refer to `.env.example` for all available variables.

## API Documentation

Swagger UI is available at `/api/docs` once the server is running.

## Testing

Jest and Supertest are configured. A sample test is located at `tests/setup.test.ts`.

Set the following environment variables (or use `.env`) before running the tests to mirror the configuration used in the application:

- `PORT` – defaults to `5000`
- `DATABASE_URL` – connection string for the PostgreSQL instance used in tests
- `JWT_SECRET` – secret key for JWT utilities
- `FRONTEND_URL` – URL allowed by CORS checks (defaults to `http://localhost:5173`)

Run unit tests with:

```bash
npm test
```

To validate the SQL schema against the contract, execute:

```bash
npm run db:validate
```
