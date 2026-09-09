-- Robinhood Chain migration: contract addresses + mint tracking
-- Keep Solana columns for historical read-only data.

ALTER TABLE collections
  ADD COLUMN IF NOT EXISTS contract_address TEXT,
  ADD COLUMN IF NOT EXISTS rh_chain_id INTEGER,
  ADD COLUMN IF NOT EXISTS rh_deploy_tx TEXT,
  ADD COLUMN IF NOT EXISTS rh_factory_address TEXT;

ALTER TABLE mint_phases
  ADD COLUMN IF NOT EXISTS mint_price_eth NUMERIC(36, 18);

-- Prefer mint_price_eth; fall back from mint_price_sol for display during transition
UPDATE mint_phases
SET mint_price_eth = COALESCE(mint_price_eth, mint_price_sol, 0)
WHERE mint_price_eth IS NULL;

CREATE TABLE IF NOT EXISTS rh_nft_mints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collection_id UUID NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
  session_id UUID,
  phase_id UUID,
  ordinal_id UUID,
  minter_wallet TEXT NOT NULL,
  contract_address TEXT,
  token_id TEXT,
  token_uri TEXT,
  mint_price_wei TEXT,
  platform_fee_wei TEXT,
  mint_tx_hash TEXT,
  mint_status TEXT NOT NULL DEFAULT 'pending',
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  confirmed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_rh_nft_mints_collection ON rh_nft_mints(collection_id);
CREATE INDEX IF NOT EXISTS idx_rh_nft_mints_status ON rh_nft_mints(mint_status);
CREATE INDEX IF NOT EXISTS idx_rh_nft_mints_minter ON rh_nft_mints(minter_wallet);
CREATE INDEX IF NOT EXISTS idx_rh_nft_mints_tx ON rh_nft_mints(mint_tx_hash);

INSERT INTO site_settings (setting_key, setting_value, description)
VALUES
  ('rh_network', '"testnet"', 'Robinhood Chain network: testnet or mainnet'),
  ('rh_rpc_url', '"https://rpc.testnet.chain.robinhood.com"', 'Active Robinhood RPC URL'),
  ('rh_testnet_rpc_url', '"https://rpc.testnet.chain.robinhood.com"', 'Robinhood testnet RPC'),
  ('rh_mainnet_rpc_url', '"https://rpc.mainnet.chain.robinhood.com"', 'Robinhood mainnet RPC')
ON CONFLICT (setting_key) DO UPDATE SET setting_value = EXCLUDED.setting_value, updated_at = NOW();
