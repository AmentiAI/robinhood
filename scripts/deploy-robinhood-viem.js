#!/usr/bin/env node
/**
 * Deploy CollectionFactory + Marketplace to Robinhood Chain using viem.
 * Usage:
 *   node scripts/deploy-robinhood-viem.js
 * Requires RH_PLATFORM_PRIVATE_KEY (and optional RH_PLATFORM_WALLET / RH_MINT_SIGNER_ADDRESS)
 */
require('dotenv').config()
const fs = require('fs')
const path = require('path')
const { createWalletClient, createPublicClient, http, parseEther } = require('viem')
const { privateKeyToAccount } = require('viem/accounts')

const network = (process.env.RH_NETWORK || 'testnet').toLowerCase()
const chainId = network === 'mainnet' ? 4663 : 46630
const rpcUrl =
  network === 'mainnet'
    ? process.env.RH_RPC_URL || 'https://rpc.mainnet.chain.robinhood.com'
    : process.env.RH_TESTNET_RPC_URL || 'https://rpc.testnet.chain.robinhood.com'

const chain = {
  id: chainId,
  name: network === 'mainnet' ? 'Robinhood Chain' : 'Robinhood Chain Testnet',
  nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  rpcUrls: { default: { http: [rpcUrl] } },
}

function loadArtifact(name) {
  const p = path.join(__dirname, '..', 'artifacts', 'contracts', `${name}.sol`, `${name}.json`)
  return JSON.parse(fs.readFileSync(p, 'utf8'))
}

async function main() {
  const key = process.env.RH_PLATFORM_PRIVATE_KEY || process.env.PRIVATE_KEY
  if (!key) throw new Error('RH_PLATFORM_PRIVATE_KEY required')
  const pk = key.startsWith('0x') ? key : `0x${key}`
  const account = privateKeyToAccount(pk)

  const platformWallet = process.env.RH_PLATFORM_WALLET || account.address
  const mintSigner = process.env.RH_MINT_SIGNER_ADDRESS || account.address
  const platformFeeWei = BigInt(process.env.RH_PLATFORM_FEE_WEI || String(parseEther('0.001')))
  const marketplaceFeeBps = BigInt(process.env.RH_MARKETPLACE_FEE_BPS || '200')

  const publicClient = createPublicClient({ chain, transport: http(rpcUrl) })
  const walletClient = createWalletClient({ account, chain, transport: http(rpcUrl) })

  console.log('Network:', network, chainId)
  console.log('Deployer:', account.address)
  console.log('Platform:', platformWallet)
  console.log('Mint signer:', mintSigner)

  const factoryArt = loadArtifact('CollectionFactory')
  const marketArt = loadArtifact('Marketplace')

  console.log('Deploying CollectionFactory...')
  const factoryHash = await walletClient.deployContract({
    abi: factoryArt.abi,
    bytecode: factoryArt.bytecode,
    args: [platformWallet, mintSigner, platformFeeWei],
  })
  const factoryReceipt = await publicClient.waitForTransactionReceipt({ hash: factoryHash })
  const factoryAddress = factoryReceipt.contractAddress
  console.log('CollectionFactory:', factoryAddress)

  console.log('Deploying Marketplace...')
  const marketHash = await walletClient.deployContract({
    abi: marketArt.abi,
    bytecode: marketArt.bytecode,
    args: [platformWallet, marketplaceFeeBps],
  })
  const marketReceipt = await publicClient.waitForTransactionReceipt({ hash: marketHash })
  const marketplaceAddress = marketReceipt.contractAddress
  console.log('Marketplace:', marketplaceAddress)

  console.log('\nAdd to .env:')
  console.log(`RH_FACTORY_ADDRESS=${factoryAddress}`)
  console.log(`RH_MARKETPLACE_ADDRESS=${marketplaceAddress}`)
  console.log(`NEXT_PUBLIC_RH_FACTORY_ADDRESS=${factoryAddress}`)
  console.log(`NEXT_PUBLIC_RH_MARKETPLACE_ADDRESS=${marketplaceAddress}`)
  console.log(`RH_PLATFORM_WALLET=${platformWallet}`)
  console.log(`RH_MINT_SIGNER_ADDRESS=${mintSigner}`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
