// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import {EIP712} from "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";

/**
 * @title OrdMakerCollection
 * @notice Per-collection ERC-721 with EIP-712 signed minting and platform fee in ETH.
 */
contract OrdMakerCollection is ERC721, Ownable, ReentrancyGuard, EIP712 {
    using ECDSA for bytes32;
    using Strings for uint256;

    bytes32 public constant MINT_TYPEHASH =
        keccak256(
            "Mint(address to,uint256 tokenId,string tokenURI,uint256 price,uint256 nonce,uint256 deadline)"
        );

    address public immutable platformWallet;
    address public mintSigner;
    uint256 public immutable maxSupply;
    uint256 public platformFeeWei;
    uint256 public totalMinted;
    string private _baseTokenURI;
    bool public usePerTokenURI;

    mapping(uint256 => string) private _tokenURIs;
    mapping(address => uint256) public nonces;

    event Minted(address indexed to, uint256 indexed tokenId, uint256 price, uint256 platformFee);
    event MintSignerUpdated(address indexed signer);
    event PlatformFeeUpdated(uint256 feeWei);
    event BaseURIUpdated(string baseURI);

    error SoldOut();
    error InvalidSignature();
    error SignatureExpired();
    error IncorrectPayment();
    error TokenDoesNotExist();

    constructor(
        string memory name_,
        string memory symbol_,
        string memory baseURI_,
        uint256 maxSupply_,
        address creator_,
        address platformWallet_,
        address mintSigner_,
        uint256 platformFeeWei_
    ) ERC721(name_, symbol_) Ownable(creator_) EIP712("OrdMakerCollection", "1") {
        require(platformWallet_ != address(0), "platform");
        require(mintSigner_ != address(0), "signer");
        require(maxSupply_ > 0, "supply");
        _baseTokenURI = baseURI_;
        maxSupply = maxSupply_;
        platformWallet = platformWallet_;
        mintSigner = mintSigner_;
        platformFeeWei = platformFeeWei_;
        usePerTokenURI = bytes(baseURI_).length == 0;
    }

    function mint(
        address to,
        uint256 tokenId,
        string calldata uri,
        uint256 price,
        uint256 deadline,
        bytes calldata signature
    ) external payable nonReentrant {
        if (totalMinted >= maxSupply) revert SoldOut();
        if (block.timestamp > deadline) revert SignatureExpired();

        uint256 nonce = nonces[to];
        bytes32 structHash = keccak256(
            abi.encode(
                MINT_TYPEHASH,
                to,
                tokenId,
                keccak256(bytes(uri)),
                price,
                nonce,
                deadline
            )
        );
        address recovered = ECDSA.recover(_hashTypedDataV4(structHash), signature);
        if (recovered != mintSigner) revert InvalidSignature();

        uint256 totalDue = price + platformFeeWei;
        if (msg.value != totalDue) revert IncorrectPayment();

        nonces[to] = nonce + 1;
        totalMinted += 1;

        if (bytes(uri).length > 0) {
            _tokenURIs[tokenId] = uri;
        }

        _safeMint(to, tokenId);

        if (platformFeeWei > 0) {
            (bool feeOk, ) = platformWallet.call{value: platformFeeWei}("");
            require(feeOk, "fee transfer");
        }
        if (price > 0) {
            (bool creatorOk, ) = owner().call{value: price}("");
            require(creatorOk, "creator transfer");
        }

        emit Minted(to, tokenId, price, platformFeeWei);
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        if (_ownerOf(tokenId) == address(0)) revert TokenDoesNotExist();
        string memory specific = _tokenURIs[tokenId];
        if (bytes(specific).length > 0) {
            return specific;
        }
        return string(abi.encodePacked(_baseTokenURI, tokenId.toString()));
    }

    function setMintSigner(address signer_) external onlyOwner {
        require(signer_ != address(0), "signer");
        mintSigner = signer_;
        emit MintSignerUpdated(signer_);
    }

    function setPlatformFee(uint256 feeWei_) external onlyOwner {
        platformFeeWei = feeWei_;
        emit PlatformFeeUpdated(feeWei_);
    }

    function setBaseURI(string calldata baseURI_) external onlyOwner {
        _baseTokenURI = baseURI_;
        emit BaseURIUpdated(baseURI_);
    }

    function domainSeparator() external view returns (bytes32) {
        return _domainSeparatorV4();
    }
}
