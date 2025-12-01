import { expect } from "chai";
import { ethers } from "hardhat";
import { Contract } from "ethers";

describe("MasteryGemsRooms", function () {

  async function deployFixture() {
    const [owner, player1, player2, player3, player4] = await ethers.getSigners();

    const Token = await ethers.getContractFactory("TestUSDC");
    const usdc = await Token.deploy();
    await usdc.waitForDeployment();

    const Rooms = await ethers.getContractFactory("MoneyGameRooms");
    const rooms = await Rooms.deploy(await usdc.getAddress(), owner.address);
    await rooms.waitForDeployment();

    // Mint USDC cho 4 player
    await usdc.mint(player1.address, ethers.parseUnits("1000", 6));
    await usdc.mint(player2.address, ethers.parseUnits("1000", 6));
    await usdc.mint(player3.address, ethers.parseUnits("1000", 6));
    await usdc.mint(player4.address, ethers.parseUnits("1000", 6));

    return { owner, player1, player2, player3, player4, usdc, rooms };
  }

  describe("createRoom()", function () {
    it("should create a room and assign correct stake", async function () {
      const { rooms } = await deployFixture();

      const tx = await rooms.createRoom(1); // stake = 1 USDC
      await tx.wait();

      const room = await rooms.rooms(1);
      expect(room.stake).to.equal(1);
    });
  });

  describe("joinRoom()", function () {
    it("players should join and USDC transferred to contract", async function () {
      const { rooms, player1, player2, usdc } = await deployFixture();

      await rooms.createRoom(1);

      const addrRooms = await rooms.getAddress();

      // Approve
      await usdc.connect(player1).approve(addrRooms, ethers.parseUnits("1", 6));
      await usdc.connect(player2).approve(addrRooms, ethers.parseUnits("1", 6));

      await rooms.connect(player1).joinRoom(1);
      await rooms.connect(player2).joinRoom(1);

      const balance = await usdc.balanceOf(addrRooms);
      expect(balance).to.equal(ethers.parseUnits("2", 6));
    });
