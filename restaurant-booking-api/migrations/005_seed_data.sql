WITH branch1 AS (
    INSERT INTO branches (name, address, phone, email)
    VALUES ('Downtown Branch', '123 Main St', '+1-555-0100', 'downtown@example.com')
    RETURNING id
),
branch2 AS (
    INSERT INTO branches (name, address, phone, email)
    VALUES ('Uptown Branch', '456 Elm Ave', '+1-555-0200', 'uptown@example.com')
    RETURNING id
),
users_seed AS (
    INSERT INTO users (email, password_hash, role, branch_id, full_name, phone)
    SELECT 'master.admin@example.com', '$2b$10$examplemasterhash', 'MASTER_ADMIN', NULL, 'Master Admin', '+1-555-1000'
    UNION ALL
    SELECT 'downtown.admin@example.com', '$2b$10$downtownadminhash', 'BRANCH_ADMIN', (SELECT id FROM branch1), 'Downtown Admin', '+1-555-1001'
    UNION ALL
    SELECT 'uptown.staff@example.com', '$2b$10$uptownstaffhash', 'STAFF', (SELECT id FROM branch2), 'Uptown Staff', '+1-555-2001'
    RETURNING id
)
INSERT INTO customers (full_name, email, phone, preferences, referral_code, total_bookings, successful_bookings)
SELECT
    CONCAT('Customer ', gs)::VARCHAR,
    CONCAT('customer', gs, '@example.com')::CITEXT,
    CONCAT('+1-555-30', LPAD(gs::TEXT, 2, '0')),
    jsonb_build_object('favorite_branch', CASE WHEN gs % 2 = 0 THEN 'Downtown' ELSE 'Uptown' END),
    CONCAT('REF', LPAD(gs::TEXT, 4, '0')),
    (gs % 5) + 1,
    (gs % 3) + 1
FROM generate_series(1, 20) AS gs;

INSERT INTO tables (branch_id, table_number, capacity, min_capacity, table_type, floor, position_x, position_y)
SELECT (SELECT id FROM branch1), CONCAT('D-', LPAD(gs::TEXT, 2, '0')), 4 + (gs % 3), 2, 'REGULAR', 1, gs * 2, gs * 3
FROM generate_series(1, 10) AS gs;

INSERT INTO tables (branch_id, table_number, capacity, min_capacity, table_type, floor, position_x, position_y)
SELECT (SELECT id FROM branch2), CONCAT('U-', LPAD(gs::TEXT, 2, '0')), 2 + (gs % 4), 2, 'REGULAR', 1, gs * 2, gs * 3
FROM generate_series(1, 10) AS gs;

INSERT INTO operating_hours (branch_id, day_of_week, open_time, close_time, break_start, break_end)
SELECT (SELECT id FROM branch1), day, '09:00', '22:00', '15:00', '16:00'
FROM generate_series(0, 6) AS day;

INSERT INTO operating_hours (branch_id, day_of_week, open_time, close_time, break_start, break_end)
SELECT (SELECT id FROM branch2), day, '10:00', '23:00', '16:00', '17:00'
FROM generate_series(0, 6) AS day;

INSERT INTO bookings (customer_id, branch_id, table_id, booking_date, time_slot, duration_minutes, party_size, status, created_by)
SELECT
    c.id,
    (SELECT id FROM branch1),
    t.id,
    CURRENT_DATE + ((row_number() OVER ()) % 5),
    TIME '18:00' + ((row_number() OVER ()) % 3) * INTERVAL '1 hour',
    120,
    2 + ((row_number() OVER ()) % 4),
    CASE WHEN (row_number() OVER ()) % 2 = 0 THEN 'CONFIRMED' ELSE 'PENDING' END,
    (SELECT id FROM users_seed LIMIT 1)
FROM customers c
JOIN LATERAL (
    SELECT id FROM tables WHERE branch_id = (SELECT id FROM branch1) ORDER BY random() LIMIT 1
) AS t ON TRUE
LIMIT 5;

INSERT INTO booking_history (booking_id, action, old_status, new_status, changed_by, notes)
SELECT b.id, 'status_change', 'PENDING', b.status, (SELECT id FROM users_seed LIMIT 1), 'Initial booking status'
FROM bookings b
ORDER BY b.created_at DESC
LIMIT 5;

INSERT INTO blocked_slots (branch_id, date, start_time, end_time, reason, created_by)
VALUES
    ((SELECT id FROM branch1), CURRENT_DATE + 1, '17:00', '18:00', 'Private event', (SELECT id FROM users_seed LIMIT 1)),
    ((SELECT id FROM branch2), CURRENT_DATE + 2, '19:00', '20:30', 'Maintenance', (SELECT id FROM users_seed LIMIT 1));

INSERT INTO notifications (recipient_type, recipient_id, type, subject, content, status)
VALUES
    ('CUSTOMER', (SELECT id FROM customers LIMIT 1), 'EMAIL', 'Booking Confirmation', 'Your table has been confirmed.', 'SENT'),
    ('USER', (SELECT id FROM users_seed LIMIT 1), 'IN_APP', 'New Booking', 'A new booking has been created.', 'READ');

INSERT INTO settings (scope, branch_id, category, key, value, value_type, description, updated_by)
VALUES
    ('GLOBAL', NULL, 'booking', 'default_duration', '120', 'NUMBER', 'Default booking duration in minutes', (SELECT id FROM users_seed LIMIT 1)),
    ('BRANCH', (SELECT id FROM branch1), 'notification', 'email_enabled', 'true', 'BOOLEAN', 'Enable email notifications', (SELECT id FROM users_seed LIMIT 1));

INSERT INTO customer_preferences (customer_id, key, value)
SELECT id, 'seating', CASE WHEN random() > 0.5 THEN 'Window' ELSE 'Booth' END FROM customers LIMIT 10;
