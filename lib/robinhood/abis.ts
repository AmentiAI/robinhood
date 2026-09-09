export const collectionFactoryAbi = [
  {
    type: 'constructor',
    inputs: [
      { name: 'platformWallet_', type: 'address' },
      { name: 'mintSigner_', type: 'address' },
      { name: 'platformFeeWei_', type: 'uint256' },
    ],
  },
  {
    type: 'function',
    name: 'createCollection',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'name_', type: 'string' },
      { name: 'symbol_', type: 'string' },
      { name: 'baseURI_', type: 'string' },
      { name: 'maxSupply_', type: 'uint256' },
    ],
    outputs: [{ name: 'collection', type: 'address' }],
  },
  {
    type: 'function',
    name: 'platformWallet',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'address' }],
  },
  {
    type: 'function',
    name: 'mintSigner',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'address' }],
  },
  {
    type: 'function',
    name: 'platformFeeWei',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'isCollection',
    stateMutability: 'view',
    inputs: [{ name: 'collection', type: 'address' }],
    outputs: [{ type: 'bool' }],
  },
  {
    type: 'event',
    name: 'CollectionCreated',
    inputs: [
      { name: 'collection', type: 'address', indexed: true },
      { name: 'creator', type: 'address', indexed: true },
      { name: 'name', type: 'string', indexed: false },
      { name: 'symbol', type: 'string', indexed: false },
      { name: 'maxSupply', type: 'uint256', indexed: false },
    ],
  },
] as const

export const ordMakerCollectionAbi = [
  {
    type: 'function',
    name: 'mint',
    stateMutability: 'payable',
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'tokenId', type: 'uint256' },
      { name: 'uri', type: 'string' },
      { name: 'price', type: 'uint256' },
      { name: 'deadline', type: 'uint256' },
      { name: 'signature', type: 'bytes' },
    ],
    outputs: [],
  },
  {
    type: 'function',
    name: 'nonces',
    stateMutability: 'view',
    inputs: [{ name: 'owner', type: 'address' }],
    outputs: [{ type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'platformFeeWei',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'totalMinted',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'maxSupply',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'ownerOf',
    stateMutability: 'view',
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    outputs: [{ type: 'address' }],
  },
  {
    type: 'function',
    name: 'tokenURI',
    stateMutability: 'view',
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    outputs: [{ type: 'string' }],
  },
  {
    type: 'function',
    name: 'approve',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'tokenId', type: 'uint256' },
    ],
    outputs: [],
  },
  {
    type: 'function',
    name: 'setApprovalForAll',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'operator', type: 'address' },
      { name: 'approved', type: 'bool' },
    ],
    outputs: [],
  },
  {
    type: 'function',
    name: 'getApproved',
    stateMutability: 'view',
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    outputs: [{ type: 'address' }],
  },
  {
    type: 'function',
    name: 'isApprovedForAll',
    stateMutability: 'view',
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'operator', type: 'address' },
    ],
    outputs: [{ type: 'bool' }],
  },
  {
    type: 'event',
    name: 'Minted',
    inputs: [
      { name: 'to', type: 'address', indexed: true },
      { name: 'tokenId', type: 'uint256', indexed: true },
      { name: 'price', type: 'uint256', indexed: false },
      { name: 'platformFee', type: 'uint256', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'Transfer',
    inputs: [
      { name: 'from', type: 'address', indexed: true },
      { name: 'to', type: 'address', indexed: true },
      { name: 'tokenId', type: 'uint256', indexed: true },
    ],
  },
] as const

export const marketplaceAbi = [
  {
    type: 'function',
    name: 'list',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'nft', type: 'address' },
      { name: 'tokenId', type: 'uint256' },
      { name: 'price', type: 'uint256' },
    ],
    outputs: [],
  },
  {
    type: 'function',
    name: 'buy',
    stateMutability: 'payable',
    inputs: [
      { name: 'nft', type: 'address' },
      { name: 'tokenId', type: 'uint256' },
    ],
    outputs: [],
  },
  {
    type: 'function',
    name: 'cancel',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'nft', type: 'address' },
      { name: 'tokenId', type: 'uint256' },
    ],
    outputs: [],
  },
  {
    type: 'function',
    name: 'listingId',
    stateMutability: 'pure',
    inputs: [
      { name: 'nft', type: 'address' },
      { name: 'tokenId', type: 'uint256' },
    ],
    outputs: [{ type: 'bytes32' }],
  },
  {
    type: 'function',
    name: 'listings',
    stateMutability: 'view',
    inputs: [{ name: 'id', type: 'bytes32' }],
    outputs: [
      { name: 'seller', type: 'address' },
      { name: 'nft', type: 'address' },
      { name: 'tokenId', type: 'uint256' },
      { name: 'price', type: 'uint256' },
      { name: 'active', type: 'bool' },
    ],
  },
  {
    type: 'function',
    name: 'platformFeeBps',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'uint256' }],
  },
  {
    type: 'event',
    name: 'Listed',
    inputs: [
      { name: 'listingId', type: 'bytes32', indexed: true },
      { name: 'seller', type: 'address', indexed: true },
      { name: 'nft', type: 'address', indexed: true },
      { name: 'tokenId', type: 'uint256', indexed: false },
      { name: 'price', type: 'uint256', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'Sold',
    inputs: [
      { name: 'listingId', type: 'bytes32', indexed: true },
      { name: 'buyer', type: 'address', indexed: true },
      { name: 'seller', type: 'address', indexed: true },
      { name: 'price', type: 'uint256', indexed: false },
      { name: 'fee', type: 'uint256', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'Cancelled',
    inputs: [{ name: 'listingId', type: 'bytes32', indexed: true }],
  },
] as const

export const erc721Abi = [
  {
    type: 'function',
    name: 'approve',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'tokenId', type: 'uint256' },
    ],
    outputs: [],
  },
  {
    type: 'function',
    name: 'setApprovalForAll',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'operator', type: 'address' },
      { name: 'approved', type: 'bool' },
    ],
    outputs: [],
  },
  {
    type: 'function',
    name: 'ownerOf',
    stateMutability: 'view',
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    outputs: [{ type: 'address' }],
  },
  {
    type: 'function',
    name: 'tokenURI',
    stateMutability: 'view',
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    outputs: [{ type: 'string' }],
  },
] as const
