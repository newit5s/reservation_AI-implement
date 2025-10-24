-- Trigger to automatically update updated_at
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_branches_updated
BEFORE UPDATE ON branches
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_users_updated
BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_customers_updated
BEFORE UPDATE ON customers
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_tables_updated
BEFORE UPDATE ON tables
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_bookings_updated
BEFORE UPDATE ON bookings
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_operating_hours_updated
BEFORE UPDATE ON operating_hours
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_settings_updated
BEFORE UPDATE ON settings
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Function to generate a unique booking code
CREATE OR REPLACE FUNCTION generate_booking_code()
RETURNS TEXT AS $$
DECLARE
    code TEXT;
BEGIN
    LOOP
        code := upper(substr(md5(gen_random_uuid()::text), 1, 6));
        EXIT WHEN NOT EXISTS (SELECT 1 FROM bookings WHERE booking_code = code);
    END LOOP;
    RETURN code;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION assign_booking_code()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.booking_code IS NULL THEN
        NEW.booking_code := generate_booking_code();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_bookings_code
BEFORE INSERT ON bookings
FOR EACH ROW EXECUTE FUNCTION assign_booking_code();

-- Function to check table availability
CREATE OR REPLACE FUNCTION check_table_availability(
    p_branch_id UUID,
    p_table_id UUID,
    p_booking_date DATE,
    p_time_slot TIME,
    p_duration_minutes INT
) RETURNS BOOLEAN AS $$
DECLARE
    overlap_count INT;
BEGIN
    SELECT COUNT(*)
      INTO overlap_count
      FROM bookings b
     WHERE b.branch_id = p_branch_id
       AND (p_table_id IS NULL OR b.table_id = p_table_id)
       AND b.booking_date = p_booking_date
       AND b.status NOT IN ('CANCELLED', 'NO_SHOW')
       AND (
           tstzrange(b.booking_date + b.time_slot, b.booking_date + b.time_slot + make_interval(mins => b.duration_minutes)) &&
           tstzrange(p_booking_date + p_time_slot, p_booking_date + p_time_slot + make_interval(mins => p_duration_minutes))
       );

    RETURN overlap_count = 0;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate customer tier
CREATE OR REPLACE FUNCTION calculate_customer_tier(p_customer_id UUID)
RETURNS customer_tier AS $$
DECLARE
    success_count INT;
BEGIN
    SELECT successful_bookings INTO success_count FROM customers WHERE id = p_customer_id;
    IF success_count IS NULL THEN
        RETURN 'REGULAR';
    END IF;
    IF success_count >= 10 THEN
        RETURN 'VIP';
    END IF;
    RETURN 'REGULAR';
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_customer_tier()
RETURNS TRIGGER AS $$
BEGIN
    NEW.tier := calculate_customer_tier(NEW.id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_customers_tier
BEFORE INSERT OR UPDATE ON customers
FOR EACH ROW EXECUTE FUNCTION update_customer_tier();
