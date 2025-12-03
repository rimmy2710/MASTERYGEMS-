import { ethers } from "hardhat";

async function main() {
  const usdcAddress = process.env.USDC_ADDRESS;
  const devAddress = process.env.DEV_ADDRESS;

  if (!usdcAddress || !devAddress) {
    throw new Error("USDC_ADDRESS and DEV_ADDRESS must be set in env");
  }

  console.log("Deploying MasteryGemsRooms...");
  console.log("USDC:", usdcAddress);
  console.log("Dev wallet:", devAddress);

  const MasteryGemsRooms = await ethers.getContractFactory("MasteryGemsRooms");
  const contract = await MasteryGemsRooms.deploy(usdcAddress, devAddress);
  await contract.waitForDeployment();

  const address = await contract.getAddress();
  console.log("MasteryGemsRooms deployed to:", address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
