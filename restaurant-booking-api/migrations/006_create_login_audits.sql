CREATE TABLE IF NOT EXISTS login_audits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NULL REFERENCES users(id) ON DELETE SET NULL,
    email CITEXT NOT NULL,
    success BOOLEAN NOT NULL,
    message VARCHAR(255),
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_login_audits_user_id ON login_audits(user_id);
CREATE INDEX IF NOT EXISTS idx_login_audits_email ON login_audits(email);
