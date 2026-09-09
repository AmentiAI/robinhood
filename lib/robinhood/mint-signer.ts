import { type Address, type Hex, encodeAbiParameters, keccak256, parseAbiParameters, toBytes } from 'viem'
import { getMintSignerAccount } from './client'
import { getRobinhoodChain } from './config'

const MINT_TYPES = {
  Mint: [
    { name: 'to', type: 'address' },
    { name: 'tokenId', type: 'uint256' },
    { name: 'tokenURI', type: 'string' },
    { name: 'price', type: 'uint256' },
    { name: 'nonce', type: 'uint256' },
    { name: 'deadline', type: 'uint256' },
  ],
} as const

export async function signMintAuthorization(params: {
  collection: Address
  to: Address
  tokenId: bigint
  tokenURI: string
  price: bigint
  nonce: bigint
  deadline: bigint
}): Promise<Hex> {
  const account = getMintSignerAccount()
  const chain = getRobinhoodChain()

  const signature = await account.signTypedData({
    domain: {
      name: 'OrdMakerCollection',
      version: '1',
      chainId: chain.id,
      verifyingContract: params.collection,
    },
    types: MINT_TYPES,
    primaryType: 'Mint',
    message: {
      to: params.to,
      tokenId: params.tokenId,
      tokenURI: params.tokenURI,
      price: params.price,
      nonce: params.nonce,
      deadline: params.deadline,
    },
  })

  return signature
}

export function hashTokenUri(uri: string): Hex {
  return keccak256(toBytes(uri))
}

export function encodeMintArgs(args: {
  to: Address
  tokenId: bigint
  uri: string
  price: bigint
  deadline: bigint
  signature: Hex
}) {
  return encodeAbiParameters(
    parseAbiParameters('address to, uint256 tokenId, string uri, uint256 price, uint256 deadline, bytes signature'),
    [args.to, args.tokenId, args.uri, args.price, args.deadline, args.signature]
  )
}
