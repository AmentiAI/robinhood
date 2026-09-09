const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  const platformWallet = process.env.RH_PLATFORM_WALLET || deployer.address;
  const mintSigner = process.env.RH_MINT_SIGNER_ADDRESS || deployer.address;
  const platformFeeWei = BigInt(process.env.RH_PLATFORM_FEE_WEI || "1000000000000000"); // 0.001 ETH
  const marketplaceFeeBps = Number(process.env.RH_MARKETPLACE_FEE_BPS || "200"); // 2%

  console.log("Deployer:", deployer.address);
  console.log("Platform wallet:", platformWallet);
  console.log("Mint signer:", mintSigner);
  console.log("Platform mint fee (wei):", platformFeeWei.toString());

  const Factory = await hre.ethers.getContractFactory("CollectionFactory");
  const factory = await Factory.deploy(platformWallet, mintSigner, platformFeeWei);
  await factory.waitForDeployment();
  const factoryAddress = await factory.getAddress();
  console.log("CollectionFactory:", factoryAddress);

  const Marketplace = await hre.ethers.getContractFactory("Marketplace");
  const marketplace = await Marketplace.deploy(platformWallet, marketplaceFeeBps);
  await marketplace.waitForDeployment();
  const marketplaceAddress = await marketplace.getAddress();
  console.log("Marketplace:", marketplaceAddress);

  console.log("\nAdd to .env:");
  console.log(`RH_FACTORY_ADDRESS=${factoryAddress}`);
  console.log(`RH_MARKETPLACE_ADDRESS=${marketplaceAddress}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
