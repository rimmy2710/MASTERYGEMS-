import { expect } from "chai";
import { ethers } from "hardhat";

describe("MasteryGemsRooms", function () {

  // Deploy fixture chuẩn
  async function deployFixture() {
    const [owner, player1, player2, player3, player4] = await ethers.getSigners();

    // Fake USDC test token
    const Token = await ethers.getContractFactory("TestUSDC");
    const usdc = await Token.deploy();
    await usdc.waitForDeployment();

    // Deploy Rooms
    const Rooms = await ethers.getContractFactory("MoneyGameRooms");
    const rooms = await Rooms.deploy(await usdc.getAddress(), owner.address);
    await rooms.waitForDeployment();

    // Mint tiền
    await usdc.mint(player1.address, ethers.parseUnits("1000", 6));
    await usdc.mint(player2.address, ethers.parseUnits("1000", 6));
    await usdc.mint(player3.address, ethers.parseUnits("1000", 6));
    await usdc.mint(player4.address, ethers.parseUnits("1000", 6));

    return {
      owner,
      player1,
      player2,
      player3,
      player4,
      usdc,
      rooms,
    };
  }

  describe("createRoom()", function () {
    it("creates a room with correct stake", async function () {
      const { rooms } = await deployFixture();

      await rooms.createRoom(1);
      const room = await rooms.rooms(1);

      expect(room.stake).to.equal(1);
    });
  });

  describe("joinRoom()", function () {
    it("allows players to join and transfers USDC", async function () {
      const { rooms, usdc, player1, player2 } = await deployFixture();

      await rooms.createRoom(1);

      const addrRooms = await rooms.getAddress();

      await usdc.connect(player1).approve(addrRooms, ethers.parseUnits("1", 6));
      await usdc.connect(player2).approve(addrRooms, ethers.parseUnits("1", 6));

      await rooms.connect(player1).joinRoom(1);
      await rooms.connect(player2).joinRoom(1);

      const bal = await usdc.balanceOf(addrRooms);
      expect(bal).to.equal(ethers.parseUnits("2", 6));
    });
  });

  describe("settleGame()", function () {
    it("distributes payout 50/30/5/5 correctly", async function () {
      const { rooms, usdc, player1, player2, player3, player4 } = await deployFixture();

      await rooms.createRoom(1);

      const addrRooms = await rooms.getAddress();

      await usdc.connect(player1).approve(addrRooms, ethers.parseUnits("1", 6));
      await usdc.connect(player2).approve(addrRooms, ethers.parseUnits("1", 6));
      await usdc.connect(player3).approve(addrRooms, ethers.parseUnits("1", 6));
      await usdc.connect(player4).approve(addrRooms, ethers.parseUnits("1", 6));

      await rooms.connect(player1).joinRoom(1);
      await rooms.connect(player2).joinRoom(1);
      await rooms.connect(player3).joinRoom(1);
      await rooms.connect(player4).joinRoom(1);

      const players = [
        player1.address,
        player2.address,
        player3.address,
        player4.address,
      ];

      await rooms.settleGame(1, players);

      const pool = ethers.parseUnits("4", 6);

      const b1 = await usdc.balanceOf(player1.address);
      const b2 = await usdc.balanceOf(player2.address);
      const b3 = await usdc.balanceOf(player3.address);
      const b4 = await usdc.balanceOf(player4.address);

      expect(b1).to.equal(ethers.parseUnits("1000", 6) + (pool * 50n / 100n));
      expect(b2).to.equal(ethers.parseUnits("1000", 6) + (pool * 30n / 100n));
      expect(b3).to.equal(ethers.parseUnits("1000", 6) + (pool * 5n / 100n));
      expect(b4).to.equal(ethers.parseUnits("1000", 6) + (pool * 5n / 100n));
    });
  });

});
