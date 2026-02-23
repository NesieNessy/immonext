-- PersonalData table for user settings (Benutzereinstellungen)
CREATE TABLE IF NOT EXISTS personal_data (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    last_name VARCHAR(50) NOT NULL,
    first_name VARCHAR(50) NOT NULL,
    street VARCHAR(100) NOT NULL,
    house_number VARCHAR(10) NOT NULL,
    city VARCHAR(100) NOT NULL,
    postal_code VARCHAR(10) NOT NULL,
    phone_number VARCHAR(50),
    email_address VARCHAR(100) NOT NULL,
    personal_marginal_tax_rate VARCHAR(50) NOT NULL,
    profile_picture BYTEA,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE personal_data ENABLE ROW LEVEL SECURITY;

-- Users can only read/write their own personal data
CREATE POLICY "Users can view own personal data"
    ON personal_data FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own personal data"
    ON personal_data FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own personal data"
    ON personal_data FOR UPDATE
    USING (auth.uid() = user_id);

-- Auto-update updated_at on changes
CREATE OR REPLACE FUNCTION update_personal_data_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER personal_data_updated_at
    BEFORE UPDATE ON personal_data
    FOR EACH ROW EXECUTE FUNCTION update_personal_data_updated_at();
