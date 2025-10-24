BEGIN;

WITH inserted_branch AS (
  INSERT INTO branches (name, address, phone, email)
  VALUES ('Test Branch', '789 Test St', '+1-555-9900', 'test.branch@example.com')
  RETURNING id
),
inserted_user AS (
  INSERT INTO users (email, password_hash, role, branch_id)
  SELECT 'test.user@example.com', 'hash', 'BRANCH_ADMIN', id FROM inserted_branch
  RETURNING id
),
inserted_customer AS (
  INSERT INTO customers (full_name, email, phone, referral_code)
  VALUES ('Test Customer', 'test.customer@example.com', '+1-555-9000', 'REFTEST')
  RETURNING id
),
inserted_table AS (
  INSERT INTO tables (branch_id, table_number, capacity)
  SELECT id, 'T-01', 4 FROM inserted_branch
  RETURNING id
),
inserted_booking AS (
  INSERT INTO bookings (customer_id, branch_id, table_id, booking_date, time_slot, party_size, status)
  SELECT c.id, b.id, t.id, CURRENT_DATE, TIME '18:00', 2, 'CONFIRMED'
  FROM inserted_customer c
  CROSS JOIN inserted_branch b
  CROSS JOIN inserted_table t
  RETURNING id, booking_code
)
SELECT COUNT(*) AS inserted_bookings FROM inserted_booking;

-- Validate foreign key relationships
SELECT COUNT(*) AS booking_fk_validations
FROM bookings
WHERE customer_id IS NOT NULL AND branch_id IS NOT NULL AND table_id IS NOT NULL;

-- Verify trigger updated_at by updating the customer record
UPDATE customers SET notes = 'Updated via test' WHERE email = 'test.customer@example.com';
SELECT (updated_at >= created_at) AS customer_updated
FROM customers
WHERE email = 'test.customer@example.com';

-- Test booking code generation uniqueness
WITH another_booking AS (
  INSERT INTO bookings (customer_id, branch_id, booking_date, time_slot, party_size, status)
  SELECT id, (SELECT id FROM inserted_branch), CURRENT_DATE + 1, TIME '19:00', 3, 'PENDING'
  FROM inserted_customer
  RETURNING booking_code
)
SELECT COUNT(*) = COUNT(DISTINCT booking_code) AS unique_codes
FROM bookings
WHERE branch_id = (SELECT id FROM inserted_branch);

ROLLBACK;
