-- Site access whitelist for locked launch
CREATE TABLE IF NOT EXISTS site_whitelist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address TEXT NOT NULL,
  email TEXT,
  twitter TEXT,
  note TEXT,
  status TEXT NOT NULL DEFAULT 'pending', -- pending | approved | rejected
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  approved_at TIMESTAMPTZ,
  approved_by TEXT
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_site_whitelist_wallet
  ON site_whitelist (LOWER(wallet_address));

CREATE INDEX IF NOT EXISTS idx_site_whitelist_status
  ON site_whitelist (status);

INSERT INTO site_settings (setting_key, setting_value, description)
VALUES (
  'site_locked',
  'true',
  'When true, only approved whitelist wallets can leave the homepage'
)
ON CONFLICT (setting_key) DO NOTHING;
