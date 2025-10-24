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
