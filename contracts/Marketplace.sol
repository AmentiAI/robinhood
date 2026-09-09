// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC721} from "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import {IERC721Receiver} from "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title Marketplace
 * @notice Escrow marketplace for OrdMaker ERC-721 collections. Fees paid in ETH.
 */
contract Marketplace is Ownable, ReentrancyGuard, IERC721Receiver {
    uint256 public platformFeeBps; // e.g. 200 = 2%
    address public platformWallet;

    struct Listing {
        address seller;
        address nft;
        uint256 tokenId;
        uint256 price;
        bool active;
    }

    mapping(bytes32 => Listing) public listings;

    event Listed(bytes32 indexed listingId, address indexed seller, address indexed nft, uint256 tokenId, uint256 price);
    event Sold(bytes32 indexed listingId, address indexed buyer, address indexed seller, uint256 price, uint256 fee);
    event Cancelled(bytes32 indexed listingId);
    event PlatformFeeUpdated(uint256 feeBps);
    event PlatformWalletUpdated(address indexed wallet);

    error NotActive();
    error IncorrectPayment();
    error NotSeller();
    error InvalidPrice();

    constructor(address platformWallet_, uint256 platformFeeBps_) Ownable(msg.sender) {
        require(platformWallet_ != address(0), "platform");
        require(platformFeeBps_ <= 1000, "fee too high");
        platformWallet = platformWallet_;
        platformFeeBps = platformFeeBps_;
    }

    function listingId(address nft, uint256 tokenId) public pure returns (bytes32) {
        return keccak256(abi.encodePacked(nft, tokenId));
    }

    function list(address nft, uint256 tokenId, uint256 price) external nonReentrant {
        if (price == 0) revert InvalidPrice();
        bytes32 id = listingId(nft, tokenId);
        Listing storage existing = listings[id];
        require(!existing.active, "already listed");

        IERC721(nft).safeTransferFrom(msg.sender, address(this), tokenId);

        listings[id] = Listing({
            seller: msg.sender,
            nft: nft,
            tokenId: tokenId,
            price: price,
            active: true
        });

        emit Listed(id, msg.sender, nft, tokenId, price);
    }

    function buy(address nft, uint256 tokenId) external payable nonReentrant {
        bytes32 id = listingId(nft, tokenId);
        Listing storage item = listings[id];
        if (!item.active) revert NotActive();
        if (msg.value != item.price) revert IncorrectPayment();

        item.active = false;
        uint256 fee = (item.price * platformFeeBps) / 10_000;
        uint256 sellerProceeds = item.price - fee;

        IERC721(item.nft).safeTransferFrom(address(this), msg.sender, item.tokenId);

        if (fee > 0) {
            (bool feeOk, ) = platformWallet.call{value: fee}("");
            require(feeOk, "fee transfer");
        }
        (bool sellerOk, ) = item.seller.call{value: sellerProceeds}("");
        require(sellerOk, "seller transfer");

        emit Sold(id, msg.sender, item.seller, item.price, fee);
    }

    function cancel(address nft, uint256 tokenId) external nonReentrant {
        bytes32 id = listingId(nft, tokenId);
        Listing storage item = listings[id];
        if (!item.active) revert NotActive();
        if (item.seller != msg.sender) revert NotSeller();

        item.active = false;
        IERC721(item.nft).safeTransferFrom(address(this), msg.sender, item.tokenId);
        emit Cancelled(id);
    }

    function setPlatformFeeBps(uint256 feeBps_) external onlyOwner {
        require(feeBps_ <= 1000, "fee too high");
        platformFeeBps = feeBps_;
        emit PlatformFeeUpdated(feeBps_);
    }

    function setPlatformWallet(address wallet_) external onlyOwner {
        require(wallet_ != address(0), "platform");
        platformWallet = wallet_;
        emit PlatformWalletUpdated(wallet_);
    }

    function onERC721Received(address, address, uint256, bytes calldata) external pure returns (bytes4) {
        return IERC721Receiver.onERC721Received.selector;
    }
}
