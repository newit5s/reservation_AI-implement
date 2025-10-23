# 🔧 ERROR CODES & DEBUGGING GUIDE

## ERROR CODE SYSTEM

### Authentication Errors (AUTH_XXX)
```javascript
AUTH_001: "Invalid credentials"
AUTH_002: "Token expired"  
AUTH_003: "Insufficient permissions"
AUTH_004: "Account locked - too many attempts"
AUTH_005: "Invalid refresh token"
AUTH_006: "User not found"
AUTH_007: "Password reset token invalid"
AUTH_008: "Branch access denied"
```

### Booking Errors (BOOK_XXX)
```javascript
BOOK_001: "Table not available for selected time"
BOOK_002: "Missing required field: {field}"
BOOK_003: "Customer is blacklisted"
BOOK_004: "Booking date exceeds maximum advance days (30)"
BOOK_005: "Party size exceeds table capacity"
BOOK_006: "Outside operating hours"
BOOK_007: "Time slot blocked by admin"
BOOK_008: "Booking not found"
BOOK_009: "Cannot modify past booking"
BOOK_010: "Duplicate booking detected"
BOOK_011: "Auto-cancelled due to no-show"
BOOK_012: "Branch at full capacity"
```

### Customer Errors (CUST_XXX)
```javascript
CUST_001: "Customer not found"
CUST_002: "Duplicate email address"
CUST_003: "Invalid phone number format"
CUST_004: "Cannot blacklist VIP customer without override"
CUST_005: "Merge conflict - customers have different emails"
CUST_006: "Invalid tier transition"
```

### Table Errors (TABL_XXX)
```javascript
TABL_001: "Table not found"
TABL_002: "Table already occupied"
TABL_003: "Cannot combine tables from different floors"
TABL_004: "Invalid table capacity"
TABL_005: "Table position conflicts with another"
```

### System Errors (SYS_XXX)
```javascript
SYS_001: "Database connection failed"
SYS_002: "Redis cache unavailable"
SYS_003: "Email service down"
SYS_004: "SMS gateway error"
SYS_005: "File upload failed"
SYS_006: "Rate limit exceeded"
SYS_007: "Invalid input format"
SYS_008: "Transaction rolled back"
```

## DEBUGGING PROMPTS FOR CODEX

### Template 1: Fix Specific Error
```
I'm getting error code [ERROR_CODE] in the restaurant booking system.

Error occurs in file: [filepath]
Function: [function_name]
Line: [line_number]

Full error message:
[paste error]

Current code:
[paste relevant code]

Expected behavior: [what should happen]
Actual behavior: [what's happening]

Please fix this error and explain what was wrong.
```

### Template 2: Debug API Endpoint
```
The [HTTP_METHOD] endpoint /api/[path] is not working correctly.

Request:
- Headers: [headers]
- Body: [request body]
- Params: [params]

Response:
- Status: [status code]
- Body: [response body]

Expected response: [what you expected]

Current handler code:
[paste controller code]

Please debug and fix the endpoint.
```

### Template 3: Fix Database Query
```
My database query is returning incorrect results.

Table schema:
[paste relevant schema]

Current query:
[paste SQL/ORM query]

Sample data:
[paste sample rows]

Expected result: [what you want]
Actual result: [what you're getting]

Please correct the query.
```

### Template 4: React Component Issue
```
React component [ComponentName] has an issue with [describe problem].

Component code:
[paste component]

Props being passed:
[paste props]

Error in console:
[paste error]

Expected behavior: [description]
Current behavior: [description]

Please fix the component.
```

## TESTING PROMPTS FOR CODEX

### Template 1: Write Unit Tests
```
Write comprehensive unit tests for this function:

Function to test:
[paste function code]

Requirements:
- Test happy path
- Test error cases
- Test edge cases
- Mock external dependencies
- Use Jest and TypeScript

Expected test scenarios:
1. [scenario 1]
2. [scenario 2]
3. [scenario 3]
```

### Template 2: Write Integration Tests
```
Create integration tests for the [module_name] module.

API endpoints to test:
[list endpoints]

Database models involved:
[list models]

Test scenarios needed:
1. [scenario 1]
2. [scenario 2]
3. [scenario 3]

Include:
- Setup and teardown
- Database seeding
- Authentication
- Permission testing
```

### Template 3: Write E2E Tests
```
Write Cypress/Playwright E2E tests for the booking flow.

User journey:
1. [step 1]
2. [step 2]
3. [step 3]

Test data needed:
- Valid customer: [data]
- Invalid cases: [data]

Assertions required:
- [assertion 1]
- [assertion 2]
- [assertion 3]

Include waits for async operations.
```

## COMMON ISSUES & SOLUTIONS

### Issue 1: Booking Overlap
**Problem**: Double bookings occurring
**Debug Steps**:
1. Check timezone handling
2. Verify duration calculation  
3. Review availability query
4. Check transaction isolation

**CODEX Prompt**:
```
The booking overlap detection is not working. Here's the availability check function:
[paste code]

Time slots that should conflict:
- Booking 1: 2024-01-15 18:00-20:00
- Booking 2: 2024-01-15 19:00-21:00

Please fix the overlap detection logic.
```

### Issue 2: Auto-cancel Not Working
**Problem**: No-show bookings not auto-cancelling
**Debug Steps**:
1. Check cron job running
2. Verify time calculation
3. Review job queue  
4. Check booking status

**CODEX Prompt**:
```
Auto-cancel after 15 minutes no-show is not working.

Current implementation:
[paste cron job code]

Booking data structure:
[paste model]

Please fix the auto-cancel logic and ensure it runs every minute.
```

### Issue 3: Customer Tier Not Updating
**Problem**: VIP status not triggered after 5 bookings
**Debug Steps**:
1. Check booking counter
2. Verify successful booking definition
3. Review tier calculation
4. Check update trigger

**CODEX Prompt**:
```
Customer tier is not updating to VIP after 5 successful bookings.

Tier calculation function:
[paste code]

Customer model:
[paste model]

Database query for counting:
[paste query]

Please fix the tier update logic.
```

### Issue 4: Real-time Updates Not Showing
**Problem**: WebSocket events not reaching clients
**Debug Steps**:
1. Check WebSocket connection
2. Verify room joining
3. Review event emitting
4. Check client listeners

**CODEX Prompt**:
```
WebSocket real-time updates not working.

Server emit code:
[paste server code]

Client listener code:
[paste client code]

Socket.io configuration:
[paste config]

Events should broadcast to all users in the same branch. Please fix.
```

### Issue 5: Multi-language Not Working
**Problem**: Translations not showing
**Debug Steps**:
1. Check i18n configuration
2. Verify translation keys
3. Review language detection
4. Check translation files

**CODEX Prompt**:
```
Translations not working for Vietnamese and Japanese.

i18n configuration:
[paste config]

Translation file structure:
[paste example]

Component using translations:
[paste component]

Please fix the multi-language setup.
```

## PERFORMANCE OPTIMIZATION PROMPTS

### Template 1: Optimize Database Query
```
This query is taking too long (>500ms):

Query:
[paste slow query]

Table sizes:
- bookings: 100,000 rows
- customers: 50,000 rows
- tables: 500 rows

EXPLAIN output:
[paste explain]

Please optimize this query with proper indexes and joins.
```

### Template 2: Fix Memory Leak
```
The Node.js app memory usage keeps growing.

Suspected code:
[paste code]

Memory snapshot shows:
[paste heap info]

Please identify and fix the memory leak.
```

### Template 3: Improve React Performance
```
React component [ComponentName] is re-rendering too often.

Component code:
[paste component]

Parent component:
[paste parent]

DevTools shows [X] renders per second.

Please optimize using memo, useCallback, and useMemo.
```

## SECURITY FIX PROMPTS

### Template 1: Fix SQL Injection
```
Security scan found potential SQL injection in:

Code:
[paste vulnerable code]

User input: [example input]

Please fix using parameterized queries.
```

### Template 2: Fix XSS Vulnerability
```
XSS vulnerability found in:

Component:
[paste component]

User input displayed at:
[indicate line]

Please sanitize properly.
```

### Template 3: Fix Authentication Bypass
```
Authentication can be bypassed in:

Middleware:
[paste middleware]

Route:
[paste route]

Please strengthen the authentication check.
```

## QUICK FIX CHECKLIST

Before asking CODEX/Claude for help:

### 1. Gather Information
- [ ] Error code/message
- [ ] File and line number
- [ ] Recent changes
- [ ] Input that triggers error
- [ ] Expected vs actual output

### 2. Provide Context
- [ ] Relevant code (not entire file)
- [ ] Related models/schemas
- [ ] Sample data
- [ ] Environment (dev/prod)
- [ ] Dependencies versions

### 3. Be Specific
- [ ] One issue at a time
- [ ] Clear problem statement
- [ ] Desired outcome
- [ ] What you've tried
- [ ] Any constraints

### 4. After Receiving Fix
- [ ] Test the solution
- [ ] Check edge cases
- [ ] Verify no side effects
- [ ] Update tests
- [ ] Document the fix

## MONITORING QUERIES

### Check System Health
```sql
-- Active bookings today
SELECT COUNT(*) FROM bookings 
WHERE booking_date = CURRENT_DATE 
AND status IN ('confirmed', 'checked_in');

-- No-show rate
SELECT 
  COUNT(CASE WHEN status = 'no_show' THEN 1 END) * 100.0 / COUNT(*) as no_show_rate
FROM bookings 
WHERE booking_date >= CURRENT_DATE - INTERVAL '30 days';

-- Customer tier distribution
SELECT tier, COUNT(*) 
FROM customers 
GROUP BY tier;

-- Table utilization
SELECT 
  t.table_number,
  COUNT(b.id) * 100.0 / 30 as utilization_rate
FROM tables t
LEFT JOIN bookings b ON t.id = b.table_id 
  AND b.booking_date >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY t.id;
```

## LOG ANALYSIS PATTERNS

### Find Errors in Logs
```bash
# Find all errors
grep ERROR app.log | tail -50

# Find specific error code
grep "BOOK_001" app.log

# Count errors by code
grep -o "ERROR_[0-9]\{3\}" app.log | sort | uniq -c

# Find slow queries
grep "Query took" app.log | grep -E "[0-9]{4,}ms"

# Track user journey
grep "customerId:123" app.log | grep -E "(booking|table|customer)"
```

## DEPLOYMENT VERIFICATION

### Post-Deployment Checklist
```bash
# 1. Check all services running
kubectl get pods

# 2. Verify database connection
curl http://api/health/db

# 3. Test critical endpoints
curl -X POST http://api/bookings/check-availability

# 4. Check error rate
kubectl logs -f deployment/api | grep ERROR

# 5. Verify WebSocket
wscat -c ws://api/socket.io

# 6. Check background jobs
kubectl logs deployment/worker

# 7. Verify email sending
tail -f logs/email.log

# 8. Check performance metrics
curl http://api/metrics
```

## ROLLBACK PROCEDURE

### If deployment fails:
```bash
# 1. Immediate rollback
kubectl rollout undo deployment/api

# 2. Restore database if needed
pg_restore -d restaurant backup_before_deploy.sql

# 3. Clear cache
redis-cli FLUSHALL

# 4. Notify team
./scripts/notify-rollback.sh

# 5. Investigate issue
kubectl logs deployment/api --previous
```

---

## TIPS FOR WORKING WITH AI ASSISTANTS

### DO's:
- ✅ Provide complete error messages
- ✅ Include relevant code context
- ✅ Specify the framework/library versions
- ✅ Show sample data
- ✅ Explain what you've tried
- ✅ One problem per prompt
- ✅ Test solutions incrementally

### DON'Ts:
- ❌ Paste entire codebases
- ❌ Use vague descriptions
- ❌ Mix multiple issues
- ❌ Forget to test edge cases
- ❌ Skip error handling
- ❌ Ignore security implications
- ❌ Deploy without testing

---

This guide ensures smooth debugging and development with AI assistance!