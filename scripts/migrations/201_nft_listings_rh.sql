-- Widen nft_listings for Robinhood Chain (ETH wei + EVM addresses)
ALTER TABLE nft_listings
  ALTER COLUMN mint_address TYPE TEXT,
  ALTER COLUMN seller_wallet TYPE TEXT,
  ALTER COLUMN price_lamports TYPE NUMERIC(78,0) USING price_lamports::numeric,
  ALTER COLUMN platform_fee_lamports TYPE NUMERIC(78,0) USING platform_fee_lamports::numeric,
  ALTER COLUMN listing_tx_signature TYPE TEXT,
  ALTER COLUMN sold_tx_signature TYPE TEXT,
  ALTER COLUMN sold_to_wallet TYPE TEXT;

ALTER TABLE nft_listings
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
