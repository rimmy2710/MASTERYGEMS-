import { ethers } from "hardhat";

async function main() {
  const USDC = "0x0000000000000000000000000000000000000001";
  const DEV = "0x0000000000000000000000000000000000000002";

  const MasteryGemsRooms = await ethers.getContractFactory("MasteryGemsRooms");
  const contract = await MasteryGemsRooms.deploy(USDC, DEV);
  await contract.deployed();

  console.log(`MasteryGemsRooms deployed to: ${contract.address}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
