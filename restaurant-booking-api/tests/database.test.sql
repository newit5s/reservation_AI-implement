BEGIN;

-- Validate table presence
WITH expected_tables AS (
  SELECT unnest(ARRAY[
    'branches',
    'users',
    'customers',
    'tables',
    'bookings',
    'booking_history',
    'operating_hours',
    'blocked_slots',
    'notifications',
    'settings',
    'customer_preferences'
  ]) AS table_name
), table_check AS (
  SELECT
    e.table_name,
    EXISTS (
      SELECT 1
      FROM information_schema.tables t
      WHERE t.table_schema = 'public'
        AND t.table_name = e.table_name
    ) AS is_present
  FROM expected_tables e
)
SELECT
  bool_and(is_present) AS all_tables_present,
  array_agg(table_name) FILTER (WHERE NOT is_present) AS missing_tables
FROM table_check;

-- Validate index presence
WITH expected_indexes AS (
  SELECT unnest(ARRAY[
    'idx_users_branch',
    'idx_customers_email',
    'idx_customers_phone',
    'idx_tables_branch',
    'idx_bookings_branch_date',
    'idx_bookings_customer',
    'idx_bookings_table_slot',
    'idx_booking_history_booking',
    'idx_operating_hours_branch',
    'idx_blocked_slots_branch_date',
    'idx_notifications_status',
    'idx_settings_branch_category'
  ]) AS index_name
), index_check AS (
  SELECT
    e.index_name,
    EXISTS (
      SELECT 1
      FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'public'
        AND c.relkind = 'i'
        AND c.relname = e.index_name
    ) AS is_present
  FROM expected_indexes e
)
SELECT
  bool_and(is_present) AS all_indexes_present,
  array_agg(index_name) FILTER (WHERE NOT is_present) AS missing_indexes
FROM index_check;

-- Validate required functions
WITH expected_functions AS (
  SELECT unnest(ARRAY[
    'set_updated_at',
    'generate_booking_code',
    'assign_booking_code',
    'check_table_availability',
    'calculate_customer_tier',
    'update_customer_tier'
  ]) AS function_name
), function_check AS (
  SELECT
    e.function_name,
    EXISTS (
      SELECT 1
      FROM pg_proc p
      JOIN pg_namespace n ON n.oid = p.pronamespace
      WHERE n.nspname = 'public'
        AND p.proname = e.function_name
    ) AS is_present
  FROM expected_functions e
)
SELECT
  bool_and(is_present) AS all_functions_present,
  array_agg(function_name) FILTER (WHERE NOT is_present) AS missing_functions
FROM function_check;

-- Validate triggers
WITH expected_triggers AS (
  SELECT unnest(ARRAY[
    'trg_branches_updated',
    'trg_users_updated',
    'trg_customers_updated',
    'trg_tables_updated',
    'trg_bookings_updated',
    'trg_operating_hours_updated',
    'trg_settings_updated',
    'trg_bookings_code',
    'trg_customers_tier'
  ]) AS trigger_name
), trigger_check AS (
  SELECT
    e.trigger_name,
    EXISTS (
      SELECT 1
      FROM pg_trigger tg
      JOIN pg_class c ON c.oid = tg.tgrelid
      WHERE NOT tg.tgisinternal
        AND tg.tgname = e.trigger_name
    ) AS is_present
  FROM expected_triggers e
)
SELECT
  bool_and(is_present) AS all_triggers_present,
  array_agg(trigger_name) FILTER (WHERE NOT is_present) AS missing_triggers
FROM trigger_check;

-- Seed primary records used across validations
CREATE TEMP TABLE tmp_branch_main(id UUID);
INSERT INTO tmp_branch_main
SELECT id
FROM (
  INSERT INTO branches (name, address, phone, email)
  VALUES ('Central Branch', '123 Test St', '+1-555-0100', 'central@example.com')
  RETURNING id
) AS inserted;

CREATE TEMP TABLE tmp_user_main(id UUID);
INSERT INTO tmp_user_main
SELECT id
FROM (
  INSERT INTO users (email, password_hash, role, branch_id)
  VALUES ('admin@example.com', 'hash', 'MASTER_ADMIN', (SELECT id FROM tmp_branch_main))
  RETURNING id
) AS inserted;

CREATE TEMP TABLE tmp_customer_main(id UUID);
INSERT INTO tmp_customer_main
SELECT id
FROM (
  INSERT INTO customers (full_name, email, phone, referral_code)
  VALUES ('Primary Customer', 'primary.customer@example.com', '+1-555-0200', 'REFMAIN')
  RETURNING id
) AS inserted;

CREATE TEMP TABLE tmp_table_main(id UUID);
INSERT INTO tmp_table_main
SELECT id
FROM (
  INSERT INTO tables (branch_id, table_number, capacity)
  VALUES ((SELECT id FROM tmp_branch_main), 'A-01', 4)
  RETURNING id
) AS inserted;

CREATE TEMP TABLE tmp_booking_main(id UUID, booking_code VARCHAR(6));
INSERT INTO tmp_booking_main
SELECT id, booking_code
FROM (
  INSERT INTO bookings (customer_id, branch_id, table_id, booking_date, time_slot, party_size, status)
  VALUES (
    (SELECT id FROM tmp_customer_main),
    (SELECT id FROM tmp_branch_main),
    (SELECT id FROM tmp_table_main),
    CURRENT_DATE,
    TIME '18:00',
    2,
    'CONFIRMED'
  )
  RETURNING id, booking_code
) AS inserted;

-- Foreign key integrity checks
SELECT
  COUNT(*) FILTER (WHERE customer_id IS NOT NULL AND branch_id IS NOT NULL AND table_id IS NOT NULL) > 0
    AS booking_foreign_keys_valid
FROM bookings
WHERE id = (SELECT id FROM tmp_booking_main);

-- Self-referencing foreign key validation for customers.referred_by
CREATE TEMP TABLE tmp_customer_referred(id UUID);
INSERT INTO tmp_customer_referred
SELECT id
FROM (
  INSERT INTO customers (full_name, email, phone, referral_code, referred_by)
  VALUES (
    'Referred Customer',
    'referred.customer@example.com',
    '+1-555-0300',
    'REFREF',
    (SELECT id FROM tmp_customer_main)
  )
  RETURNING id
) AS inserted;

SELECT
  COUNT(*) = 1 AS referred_customer_linked
FROM customers
WHERE id = (SELECT id FROM tmp_customer_referred)
  AND referred_by = (SELECT id FROM tmp_customer_main);

-- Cascade behaviour when deleting a branch
CREATE TEMP TABLE tmp_branch_cascade(id UUID);
INSERT INTO tmp_branch_cascade
SELECT id
FROM (
  INSERT INTO branches (name, address)
  VALUES ('Cascade Branch', '789 Cascade Ave')
  RETURNING id
) AS inserted;

CREATE TEMP TABLE tmp_table_cascade(id UUID);
INSERT INTO tmp_table_cascade
SELECT id
FROM (
  INSERT INTO tables (branch_id, table_number, capacity)
  VALUES ((SELECT id FROM tmp_branch_cascade), 'B-01', 6)
  RETURNING id
) AS inserted;

INSERT INTO bookings (customer_id, branch_id, table_id, booking_date, time_slot, party_size, status)
VALUES (
  (SELECT id FROM tmp_customer_main),
  (SELECT id FROM tmp_branch_cascade),
  (SELECT id FROM tmp_table_cascade),
  CURRENT_DATE + 1,
  TIME '19:00',
  4,
  'PENDING'
);

DELETE FROM branches WHERE id = (SELECT id FROM tmp_branch_cascade);

SELECT COUNT(*) = 0 AS cascade_removed_tables FROM tables WHERE branch_id = (SELECT id FROM tmp_branch_cascade);
SELECT COUNT(*) = 0 AS cascade_removed_bookings FROM bookings WHERE branch_id = (SELECT id FROM tmp_branch_cascade);

-- Trigger validation: updated_at should change on update
UPDATE customers SET notes = 'Updated via validation suite' WHERE id = (SELECT id FROM tmp_customer_main);
SELECT (updated_at > created_at) AS customer_updated_timestamp FROM customers WHERE id = (SELECT id FROM tmp_customer_main);

-- Unique constraint checks using ON CONFLICT clauses
WITH attempted_user AS (
  INSERT INTO users (email, password_hash, role)
  VALUES ('admin@example.com', 'hash-duplicate', 'STAFF')
  ON CONFLICT (email) DO NOTHING
  RETURNING id
)
SELECT COUNT(*) = 0 AS user_email_unique_enforced FROM attempted_user;

WITH attempted_customer_phone AS (
  INSERT INTO customers (full_name, email, phone)
  VALUES ('Duplicate Phone', 'duplicate.phone@example.com', '+1-555-0200')
  ON CONFLICT (phone) DO NOTHING
  RETURNING id
)
SELECT COUNT(*) = 0 AS customer_phone_unique_enforced FROM attempted_customer_phone;

WITH attempted_customer_referral AS (
  INSERT INTO customers (full_name, email, phone, referral_code)
  VALUES ('Duplicate Referral', 'duplicate.referral@example.com', '+1-555-0400', 'REFMAIN')
  ON CONFLICT (referral_code) DO NOTHING
  RETURNING id
)
SELECT COUNT(*) = 0 AS customer_referral_unique_enforced FROM attempted_customer_referral;

WITH attempted_table AS (
  INSERT INTO tables (branch_id, table_number, capacity)
  VALUES ((SELECT id FROM tmp_branch_main), 'A-01', 2)
  ON CONFLICT (branch_id, table_number) DO NOTHING
  RETURNING id
)
SELECT COUNT(*) = 0 AS table_number_unique_enforced FROM attempted_table;

WITH attempted_booking_code AS (
  INSERT INTO bookings (booking_code, customer_id, branch_id, booking_date, time_slot, party_size, status)
  SELECT
    booking_code,
    (SELECT id FROM tmp_customer_main),
    (SELECT id FROM tmp_branch_main),
    CURRENT_DATE + 2,
    TIME '20:00',
    2,
    'PENDING'
  FROM tmp_booking_main
  ON CONFLICT (booking_code) DO NOTHING
  RETURNING id
)
SELECT COUNT(*) = 0 AS booking_code_unique_enforced FROM attempted_booking_code;

-- Function validation: booking code generator returns six characters
SELECT LENGTH(generate_booking_code()) = 6 AS generated_code_length_valid;

-- Function validation: check table availability returns expected results
SELECT check_table_availability(
    (SELECT id FROM tmp_branch_main),
    (SELECT id FROM tmp_table_main),
    CURRENT_DATE,
    TIME '18:30',
    90
  ) AS availability_overlap_false;

SELECT check_table_availability(
    (SELECT id FROM tmp_branch_main),
    (SELECT id FROM tmp_table_main),
    CURRENT_DATE,
    TIME '21:00',
    90
  ) AS availability_open_true;

-- Function validation: customer tier recalculation promotes VIP customers
UPDATE customers SET successful_bookings = 12 WHERE id = (SELECT id FROM tmp_customer_main);
SELECT tier = 'VIP' AS customer_promoted_to_vip FROM customers WHERE id = (SELECT id FROM tmp_customer_main);

ROLLBACK;
