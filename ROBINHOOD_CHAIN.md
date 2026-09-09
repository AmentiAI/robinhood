# Robinhood Chain Migration

The live product path now targets **Robinhood Chain** (EVM L2) instead of Solana.

## Networks

| | Testnet | Mainnet |
|--|---------|---------|
| Chain ID | 46630 | 4663 |
| RPC | `https://rpc.testnet.chain.robinhood.com` | `https://rpc.mainnet.chain.robinhood.com` |
| Explorer | explorer.testnet.chain.robinhood.com | robinhoodchain.blockscout.com |

## Setup

1. Fund an EVM wallet with ETH on Robinhood testnet (faucet: faucet.testnet.chain.robinhood.com).
2. Set in `.env`:
   - `RH_PLATFORM_PRIVATE_KEY`
   - `RH_PLATFORM_WALLET` (same or fee recipient)
   - `RH_MINT_SIGNER_PRIVATE_KEY` / `RH_MINT_SIGNER_ADDRESS`
3. Compile + deploy:
   ```bash
   npm run compile:rh
   npm run deploy:rh
   ```
4. Paste printed `RH_FACTORY_ADDRESS` / `RH_MARKETPLACE_ADDRESS` into `.env` (and `NEXT_PUBLIC_*` copies).
5. Run DB migration:
   ```bash
   npm run db:rh
   ```
6. `npm run dev` — connect MetaMask (add Robinhood Chain), deploy a collection, mint, list, buy credits.

## Smoke path

Connect wallet → Launch collection → Deploy Collection → Go live → Mint → Marketplace list/buy → Buy credits (ETH).
