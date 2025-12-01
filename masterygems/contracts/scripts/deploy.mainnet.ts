import { ethers } from "hardhat";

async function main() {
  const usdc = process.env.USDC_ADDRESS;
  const dev = process.env.DEV_ADDRESS;

  if (!usdc) {
    throw new Error("USDC_ADDRESS is not set in env");
  }

  if (!dev) {
    throw new Error("DEV_ADDRESS is not set in env");
  }

  const network = await ethers.provider.getNetwork();
  console.log("Deploying MasteryGemsRooms to network:", network.name, network.chainId);
  console.log("USDC:", usdc);
  console.log("Dev wallet:", dev);

  const [deployer] = await ethers.getSigners();
  const deployerAddress = await deployer.getAddress();
  console.log("Deployer:", deployerAddress);

  const MasteryGemsRooms = await ethers.getContractFactory("MasteryGemsRooms");
  const contract = await MasteryGemsRooms.deploy(usdc, dev);
  await contract.waitForDeployment();

  const address = await contract.getAddress();
  console.log("MasteryGemsRooms deployed at:", address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

