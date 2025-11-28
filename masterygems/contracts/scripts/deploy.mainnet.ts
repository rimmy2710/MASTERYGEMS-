import { ethers } from "hardhat";

async function main() {
  const usdc = process.env.USDC_ADDRESS;
  const dev = process.env.DEV_ADDRESS;

  if (!usdc || !dev) {
    throw new Error("USDC_ADDRESS and DEV_ADDRESS must be set in env variables");
  }

  console.log("Deploying MasteryGemsRooms to Monad mainnet...");
  console.log("USDC:", usdc);
  console.log("Dev wallet:", dev);

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
