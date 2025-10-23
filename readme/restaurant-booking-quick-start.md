# 🚀 QUICK START - SAMPLE CODEX PROMPTS

## PHASE 0.1 - BACKEND SETUP PROMPT

```
Create a complete Node.js Express backend project with TypeScript for a restaurant booking system.

Project Structure Required:
```
restaurant-booking-api/
├── src/
│   ├── controllers/
│   ├── services/
│   ├── models/
│   ├── routes/
│   ├── middleware/
│   │   ├── auth.middleware.ts
│   │   ├── error.middleware.ts
│   │   └── validation.middleware.ts
│   ├── utils/
│   │   ├── logger.ts
│   │   ├── constants.ts
│   │   └── helpers.ts
│   ├── config/
│   │   ├── database.ts
│   │   └── app.ts
│   ├── types/
│   │   └── index.ts
│   └── server.ts
├── tests/
├── .env.example
├── .gitignore
├── package.json
├── tsconfig.json
├── .eslintrc.json
├── .prettierrc
└── README.md
```

Requirements:
1. Express server with TypeScript on port 5000
2. Middleware: cors, helmet, compression, morgan, express-rate-limit
3. Environment config with dotenv
4. Error handling with custom AppError class
5. Logging with winston
6. Database ready for PostgreSQL with Sequelize/Prisma
7. JWT utilities prepared
8. Validation with Joi or Zod
9. API documentation with Swagger

package.json should include:
- Scripts: dev, build, start, test, lint
- All necessary dependencies
- Node version >= 18

.env.example should include:
```
NODE_ENV=development
PORT=5000
DATABASE_URL=postgresql://user:password@localhost:5432/restaurant_booking
JWT_SECRET=your-secret-key-here
JWT_EXPIRE=7d
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=
EMAIL_PASS=
SMS_TWILIO_SID=
SMS_TWILIO_TOKEN=
SMS_TWILIO_PHONE=
REDIS_URL=redis://localhost:6379
FRONTEND_URL=http://localhost:5173
```

Create all files with proper TypeScript types, error handling, and make the server immediately runnable with `npm run dev`.
```

## PHASE 0.2 - FRONTEND SETUP PROMPT

```
Create a complete React TypeScript project with Vite for a restaurant booking system frontend.

Project Structure Required:
```
restaurant-booking-web/
├── src/
│   ├── components/
│   │   ├── common/
│   │   │   ├── Layout.tsx
│   │   │   ├── Header.tsx
│   │   │   ├── Footer.tsx
│   │   │   ├── Loading.tsx
│   │   │   └── ErrorBoundary.tsx
│   │   ├── booking/
│   │   ├── admin/
│   │   └── customer/
│   ├── pages/
│   │   ├── Home.tsx
│   │   ├── Booking.tsx
│   │   ├── Admin.tsx
│   │   └── Login.tsx
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── useBooking.ts
│   │   └── useApi.ts
│   ├── services/
│   │   ├── api.ts
│   │   ├── auth.service.ts
│   │   └── booking.service.ts
│   ├── utils/
│   │   ├── constants.ts
│   │   ├── helpers.ts
│   │   └── validators.ts
│   ├── locales/
│   │   ├── en.json
│   │   ├── vi.json
│   │   └── ja.json
│   ├── types/
│   │   └── index.ts
│   ├── context/
│   │   ├── AuthContext.tsx
│   │   └── AppContext.tsx
│   ├── styles/
│   │   └── globals.css
│   ├── App.tsx
│   └── main.tsx
├── public/
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.js
├── postcss.config.js
└── README.md
```

Requirements:
1. Vite + React + TypeScript setup
2. Tailwind CSS configured with custom theme
3. React Router DOM v6 with protected routes
4. Axios for API calls with interceptors
5. React Query for server state
6. i18next for internationalization (EN, VI, JA)
7. Lucide React for icons
8. React Hook Form for forms
9. Date-fns for date handling
10. Responsive mobile-first design

Key Components to Create:
1. Layout with responsive navigation
2. Language switcher
3. Loading and error states
4. Protected route wrapper
5. API service with auth headers
6. Toast notification system

Initial translations:
- en.json: English
- vi.json: Vietnamese (Tiếng Việt)  
- ja.json: Japanese (日本語)

Example translation structure:
```json
{
  "common": {
    "welcome": "Welcome",
    "login": "Login",
    "logout": "Logout"
  },
  "booking": {
    "title": "Book a Table",
    "selectDate": "Select Date",
    "selectTime": "Select Time"
  }
}
```

Create all files with TypeScript types, make the app immediately runnable with `npm run dev`, and show "Restaurant Booking System" on the home page in the selected language.
```

## PHASE 1.1 - DATABASE SCHEMA PROMPT

```
Create PostgreSQL database schema with migrations for a restaurant booking system.

Create these SQL files:

1. migrations/001_create_database.sql - Database and extensions
2. migrations/002_create_tables.sql - All tables with constraints  
3. migrations/003_create_indexes.sql - Performance indexes
4. migrations/004_create_functions.sql - Triggers and functions
5. migrations/005_seed_data.sql - Test data

Tables Required:

1. branches
   - id (UUID, primary key)
   - name (VARCHAR 255, not null)
   - address (TEXT)
   - phone (VARCHAR 20)
   - email (VARCHAR 255)
   - settings (JSONB) - store all branch-specific settings
   - is_active (BOOLEAN, default true)
   - created_at (TIMESTAMP)
   - updated_at (TIMESTAMP)

2. users
   - id (UUID, primary key)
   - email (VARCHAR 255, unique, not null)
   - password_hash (VARCHAR 255)
   - role (ENUM: 'MASTER_ADMIN', 'BRANCH_ADMIN', 'STAFF')
   - branch_id (UUID, foreign key, nullable for MASTER_ADMIN)
   - full_name (VARCHAR 255)
   - phone (VARCHAR 20)
   - is_active (BOOLEAN, default true)
   - last_login (TIMESTAMP)
   - created_at (TIMESTAMP)
   - updated_at (TIMESTAMP)

3. customers
   - id (UUID, primary key)
   - full_name (VARCHAR 255, not null)
   - email (VARCHAR 255, unique)
   - phone (VARCHAR 20, unique)
   - tier (ENUM: 'REGULAR', 'VIP', default 'REGULAR')
   - total_bookings (INT, default 0)
   - successful_bookings (INT, default 0)
   - no_shows (INT, default 0)
   - cancellations (INT, default 0)
   - is_blacklisted (BOOLEAN, default false)
   - blacklist_reason (TEXT)
   - notes (TEXT)
   - preferences (JSONB)
   - referral_code (VARCHAR 20, unique)
   - referred_by (UUID, foreign key to customers)
   - created_at (TIMESTAMP)
   - updated_at (TIMESTAMP)

4. tables
   - id (UUID, primary key)
   - branch_id (UUID, foreign key, not null)
   - table_number (VARCHAR 20, not null)
   - capacity (INT, not null)
   - min_capacity (INT, default 1)
   - table_type (ENUM: 'REGULAR', 'VIP', 'PRIVATE', default 'REGULAR')
   - position_x (INT) - for visual layout
   - position_y (INT) - for visual layout
   - floor (INT, default 1)
   - is_combinable (BOOLEAN, default true)
   - is_active (BOOLEAN, default true)
   - created_at (TIMESTAMP)
   - updated_at (TIMESTAMP)
   - UNIQUE (branch_id, table_number)

5. bookings
   - id (UUID, primary key)
   - booking_code (VARCHAR 6, unique, not null)
   - customer_id (UUID, foreign key)
   - branch_id (UUID, foreign key, not null)
   - table_id (UUID, foreign key)
   - booking_date (DATE, not null)
   - time_slot (TIME, not null)
   - duration_minutes (INT, default 120)
   - party_size (INT, not null)
   - status (ENUM: 'PENDING', 'CONFIRMED', 'CHECKED_IN', 'COMPLETED', 'CANCELLED', 'NO_SHOW')
   - special_requests (TEXT)
   - internal_notes (TEXT)
   - source (ENUM: 'WEBSITE', 'PHONE', 'WALK_IN', 'ADMIN', default 'WEBSITE')
   - confirmed_at (TIMESTAMP)
   - checked_in_at (TIMESTAMP)
   - cancelled_at (TIMESTAMP)
   - cancelled_by (UUID, foreign key to users)
   - cancellation_reason (TEXT)
   - created_by (UUID, foreign key to users)
   - created_at (TIMESTAMP)
   - updated_at (TIMESTAMP)

6. booking_history
   - id (UUID, primary key)
   - booking_id (UUID, foreign key, not null)
   - action (VARCHAR 50) - 'created', 'confirmed', 'cancelled', etc.
   - old_status (VARCHAR 20)
   - new_status (VARCHAR 20)
   - changed_by (UUID, foreign key to users)
   - notes (TEXT)
   - created_at (TIMESTAMP)

7. operating_hours
   - id (UUID, primary key)
   - branch_id (UUID, foreign key, not null)
   - day_of_week (INT, 0-6, 0=Sunday)
   - open_time (TIME)
   - close_time (TIME)
   - break_start (TIME)
   - break_end (TIME)
   - is_closed (BOOLEAN, default false)
   - UNIQUE (branch_id, day_of_week)

8. blocked_slots
   - id (UUID, primary key)
   - branch_id (UUID, foreign key, not null)
   - date (DATE, not null)
   - start_time (TIME, not null)
   - end_time (TIME, not null)
   - reason (TEXT)
   - created_by (UUID, foreign key to users)
   - created_at (TIMESTAMP)

9. notifications
   - id (UUID, primary key)
   - recipient_type (ENUM: 'CUSTOMER', 'USER')
   - recipient_id (UUID)
   - type (ENUM: 'EMAIL', 'SMS', 'PUSH', 'IN_APP')
   - subject (VARCHAR 255)
   - content (TEXT)
   - status (ENUM: 'PENDING', 'SENT', 'FAILED', 'READ')
   - sent_at (TIMESTAMP)
   - read_at (TIMESTAMP)
   - error_message (TEXT)
   - created_at (TIMESTAMP)

10. settings
    - id (UUID, primary key)
    - scope (ENUM: 'GLOBAL', 'BRANCH')
    - branch_id (UUID, foreign key, nullable)
    - category (VARCHAR 50) - 'booking', 'notification', 'display'
    - key (VARCHAR 100)
    - value (TEXT)
    - value_type (ENUM: 'STRING', 'NUMBER', 'BOOLEAN', 'JSON')
    - description (TEXT)
    - updated_by (UUID, foreign key to users)
    - updated_at (TIMESTAMP)
    - UNIQUE (scope, branch_id, category, key)

Create:
1. Foreign key constraints with CASCADE rules
2. Check constraints for business rules
3. Indexes on frequently queried columns
4. Trigger function for auto-updating updated_at
5. Function to generate unique booking codes
6. Function to check table availability
7. Function to calculate customer tier
8. Initial seed data with:
   - 2 branches
   - 3 users (1 per role)
   - 10 tables per branch
   - 20 sample customers
   - Operating hours for all branches
   - Sample bookings

Include comments explaining each table and important columns.
```

## PHASE 1.2 - PRISMA MODELS PROMPT

```
Create Prisma schema and models for the restaurant booking system with TypeScript.

Required Files:
1. prisma/schema.prisma - Complete schema definition
2. src/models/index.ts - Model types and interfaces
3. src/repositories/base.repository.ts - Base repository pattern
4. src/repositories/booking.repository.ts - Booking-specific queries
5. src/repositories/customer.repository.ts - Customer-specific queries  
6. src/services/database.service.ts - Database connection and helpers

Prisma Schema Requirements:
1. All tables from the SQL schema
2. Proper relations defined
3. Indexes for performance
4. Unique constraints
5. Default values
6. Enum definitions
7. JSON fields for settings and preferences

Model Methods to Implement:

Customer Model:
- calculateTier(): Determine if customer should be VIP
- checkBlacklist(): Check if should be blacklisted
- getBookingStats(): Get booking statistics
- updateStats(): Update after booking event

Booking Model:
- generateBookingCode(): Create unique 6-char code
- checkAvailability(): Check if slot available
- autoCancel(): Cancel if no-show after 15 min
- getUpcoming(): Get upcoming bookings for branch
- getByDateRange(): Get bookings in date range

Table Model:
- isAvailable(date, time): Check availability
- getBookingsForDate(date): Get all bookings
- canCombineWith(tableId): Check if combinable

Branch Model:
- isOpen(date, time): Check if branch open
- getOperatingHours(dayOfWeek): Get hours for day
- getAvailableTables(date, time, partySize): Get suitable tables

Repository Pattern Features:
- Generic CRUD operations
- Pagination support
- Filtering and sorting
- Transaction support
- Soft delete support
- Audit trail creation

Include:
- TypeScript interfaces for all models
- Input/output DTOs
- Validation schemas
- Error handling
- Logging
- Performance optimizations with select/include

Example repository method:
```typescript
async findAvailableSlots(
  branchId: string,
  date: Date,
  partySize: number
): Promise<TimeSlot[]> {
  // Implementation
}
```

Make sure all queries are optimized and include proper error handling.
```

## TEST VERIFICATION PROMPTS

### Test Backend Setup
```
Write a test script to verify the backend setup is working correctly.

Create test/setup.test.ts that checks:
1. Server starts on correct port
2. Environment variables load
3. Database connection works
4. Health endpoint responds
5. Error handling works
6. CORS configured correctly
7. Rate limiting works
8. Logger outputs correctly

Also create a simple health check endpoint:
GET /api/health

Should return:
{
  "status": "ok",
  "timestamp": "2024-01-15T10:00:00Z",
  "environment": "development",
  "database": "connected"
}
```

### Test Frontend Setup
```
Write Cypress E2E test to verify frontend setup is working.

Create cypress/e2e/setup.cy.ts that tests:
1. App loads successfully
2. Language switcher works (EN/VI/JA)
3. Navigation works
4. Responsive design (mobile/tablet/desktop)
5. API connection configured
6. Error boundary catches errors
7. Loading states display

Test should check that switching languages changes the UI text appropriately.
```

### Test Database Schema
```
Write SQL queries to verify the database schema is correctly set up.

Create test/database.test.sql with queries that:
1. Insert test data into all tables
2. Test all foreign key relationships
3. Verify unique constraints work
4. Check trigger updates updated_at
5. Test the booking code generation
6. Verify table availability function
7. Test customer tier calculation
8. Confirm cascade deletes work

Include rollback after each test to keep database clean.
```

## RUNNING THE FULL STACK

### Docker Compose for Development
```
Create docker-compose.yml for local development with:

Services:
1. PostgreSQL database
2. Redis cache
3. Node.js backend
4. React frontend
5. Nginx reverse proxy

Include:
- Volume mounts for hot reload
- Environment variables
- Health checks
- Network configuration
- Proper startup order

Also create:
- .dockerignore files
- Dockerfile for backend
- Dockerfile for frontend
- nginx.conf for routing

Make it runnable with: docker-compose up
```

## TROUBLESHOOTING FIRST STEPS

If backend won't start:
```
Debug the backend startup issue.

Error: [paste error message]

package.json:
[paste package.json]

server.ts:
[paste server.ts]

Please fix the startup issue and ensure the server runs on port 5000.
```

If frontend won't compile:
```
Fix the React/Vite compilation error.

Error: [paste error message]

File causing issue: [filename]
[paste file content]

Please fix the compilation error and ensure the app runs on port 5173.
```

If database won't connect:
```
Fix the database connection issue.

Error: [paste error]

Connection string: [connection string with password hidden]

Database config:
[paste config file]

Please fix the connection issue for PostgreSQL.
```

---

## 💡 PRO TIPS FOR USING THESE PROMPTS

1. **Run prompts in order** - Each builds on the previous
2. **Test immediately** - Don't move forward until current phase works
3. **Save responses** - Keep the generated code for reference
4. **Customize as needed** - Modify prompts for your specific needs
5. **Ask for explanations** - If something isn't clear, ask CODEX to explain
6. **Version control** - Commit after each successful phase
7. **Keep error codes** - Reference the error guide for debugging

## NEXT STEPS

After Phase 0 and 1 are complete:
1. Test all CRUD operations
2. Verify database relationships
3. Ensure frontend talks to backend
4. Set up Git repository
5. Document any customizations
6. Move to Phase 2 (Authentication)

Remember: Each phase builds on the previous one. Don't skip steps!