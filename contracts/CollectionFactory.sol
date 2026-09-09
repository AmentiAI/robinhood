// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {OrdMakerCollection} from "./OrdMakerCollection.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title CollectionFactory
 * @notice Deploys per-collection OrdMakerCollection ERC-721 contracts.
 */
contract CollectionFactory is Ownable {
    address public platformWallet;
    address public mintSigner;
    uint256 public platformFeeWei;

    address[] public allCollections;
    mapping(address => address[]) public collectionsByCreator;
    mapping(address => bool) public isCollection;

    event CollectionCreated(
        address indexed collection,
        address indexed creator,
        string name,
        string symbol,
        uint256 maxSupply
    );
    event PlatformWalletUpdated(address indexed wallet);
    event MintSignerUpdated(address indexed signer);
    event PlatformFeeUpdated(uint256 feeWei);

    constructor(address platformWallet_, address mintSigner_, uint256 platformFeeWei_) Ownable(msg.sender) {
        require(platformWallet_ != address(0), "platform");
        require(mintSigner_ != address(0), "signer");
        platformWallet = platformWallet_;
        mintSigner = mintSigner_;
        platformFeeWei = platformFeeWei_;
    }

    function createCollection(
        string calldata name_,
        string calldata symbol_,
        string calldata baseURI_,
        uint256 maxSupply_
    ) external returns (address collection) {
        OrdMakerCollection deployed = new OrdMakerCollection(
            name_,
            symbol_,
            baseURI_,
            maxSupply_,
            msg.sender,
            platformWallet,
            mintSigner,
            platformFeeWei
        );
        collection = address(deployed);
        allCollections.push(collection);
        collectionsByCreator[msg.sender].push(collection);
        isCollection[collection] = true;
        emit CollectionCreated(collection, msg.sender, name_, symbol_, maxSupply_);
    }

    function setPlatformWallet(address wallet_) external onlyOwner {
        require(wallet_ != address(0), "platform");
        platformWallet = wallet_;
        emit PlatformWalletUpdated(wallet_);
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

    function collectionsCount() external view returns (uint256) {
        return allCollections.length;
    }

    function creatorCollectionsCount(address creator) external view returns (uint256) {
        return collectionsByCreator[creator].length;
    }
}
