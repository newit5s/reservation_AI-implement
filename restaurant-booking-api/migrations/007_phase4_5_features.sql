-- Phase 4 & 5 schema extensions

-- New enum types
CREATE TYPE waitlist_status AS ENUM ('PENDING', 'NOTIFIED', 'CONFIRMED', 'CANCELLED', 'EXPIRED');
CREATE TYPE customer_timeline_event AS ENUM (
    'BOOKING_CREATED',
    'BOOKING_UPDATED',
    'BOOKING_CONFIRMED',
    'BOOKING_CANCELLED',
    'CHECKED_IN',
    'COMPLETED',
    'NOTE_ADDED',
    'BLACKLISTED',
    'BLACKLIST_REMOVED',
    'LOYALTY_UPDATED',
    'MERGED',
    'WAITLIST_JOINED',
    'WAITLIST_PROMOTED'
);
CREATE TYPE loyalty_tier AS ENUM ('REGULAR', 'GOLD', 'VIP');
CREATE TYPE loyalty_transaction_type AS ENUM ('EARN', 'REDEEM', 'ADJUST', 'BONUS');
CREATE TYPE reward_redemption_status AS ENUM ('PENDING', 'APPROVED', 'CANCELLED');

-- Waitlist entries
CREATE TABLE waitlist_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
    booking_date DATE NOT NULL,
    time_slot TIME NOT NULL,
    party_size INT NOT NULL CHECK (party_size >= 1),
    status waitlist_status NOT NULL DEFAULT 'PENDING',
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX waitlist_entries_branch_date_idx ON waitlist_entries(branch_id, booking_date);

-- Customer notes
CREATE TABLE customer_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Customer timeline
CREATE TABLE customer_timeline (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    event_type customer_timeline_event NOT NULL,
    description TEXT NOT NULL,
    metadata JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX customer_timeline_customer_idx ON customer_timeline(customer_id, created_at DESC);

-- Loyalty accounts
CREATE TABLE loyalty_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL UNIQUE REFERENCES customers(id) ON DELETE CASCADE,
    tier loyalty_tier NOT NULL DEFAULT 'REGULAR',
    points INT NOT NULL DEFAULT 0,
    badges JSONB NOT NULL DEFAULT '[]',
    total_referrals INT NOT NULL DEFAULT 0,
    special_occasions JSONB NOT NULL DEFAULT '[]',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Loyalty transactions
CREATE TABLE loyalty_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID NOT NULL REFERENCES loyalty_accounts(id) ON DELETE CASCADE,
    type loyalty_transaction_type NOT NULL,
    points INT NOT NULL,
    description TEXT,
    metadata JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX loyalty_transactions_account_idx ON loyalty_transactions(account_id, created_at DESC);

-- Rewards catalog
CREATE TABLE rewards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    points_required INT NOT NULL CHECK (points_required >= 0),
    reward_type VARCHAR(50) NOT NULL,
    value TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    metadata JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Reward redemptions
CREATE TABLE reward_redemptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reward_id UUID NOT NULL REFERENCES rewards(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    account_id UUID REFERENCES loyalty_accounts(id) ON DELETE SET NULL,
    points_spent INT NOT NULL,
    status reward_redemption_status NOT NULL DEFAULT 'PENDING',
    metadata JSONB NOT NULL DEFAULT '{}',
    redeemed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX reward_redemptions_customer_idx ON reward_redemptions(customer_id, created_at DESC);
