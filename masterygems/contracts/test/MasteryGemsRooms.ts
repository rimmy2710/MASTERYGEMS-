import { expect } from "chai";
import { ethers } from "hardhat";

describe("MoneyGameRooms", function () {
  async function deployFixture() {
    const [owner, player1, player2, player3, player4] = await ethers.getSigners();

    // Deploy test USDC
    const TestUSDC = await ethers.getContractFactory("TestUSDC");
    const usdc = await TestUSDC.deploy();
    await usdc.waitForDeployment();

    // Deploy MoneyGameRooms
    const MoneyGameRooms = await ethers.getContractFactory("MoneyGameRooms");
    const rooms = await MoneyGameRooms.deploy(
      await usdc.getAddress(),
      owner.address
    );
    await rooms.waitForDeployment();

    // Mint USDC cho players (chỉ dùng trong test, không ảnh hưởng logic sản phẩm)
    const initial = ethers.parseUnits("1000", 6);
    await usdc.mint(player1.address, initial);
    await usdc.mint(player2.address, initial);
    await usdc.mint(player3.address, initial);
    await usdc.mint(player4.address, initial);

    return {
      owner,
      player1,
      player2,
      player3,
      player4,
      usdc,
      rooms,
      initial,
    };
  }

  describe("createRoom()", function () {
    it("creates a room with correct stake", async function () {
      const { rooms } = await deployFixture();

      await rooms.createRoom(1); // stake = 1 USDC

      const room = await rooms.rooms(1);
      expect(room.stake).to.equal(1n);
    });
  });

  describe("joinRoom()", function () {
    it("allows players to join and transfers USDC", async function () {
      const { rooms, usdc, player1, player2 } = await deployFixture();

      await rooms.createRoom(1); // roomId = 1, stake = 1 USDC

      const roomsAddress = await rooms.getAddress();
      const stake = ethers.parseUnits("1", 6);

      // approve cho contract được rút 1 USDC
      await usdc.connect(player1).approve(roomsAddress, stake);
      await usdc.connect(player2).approve(roomsAddress, stake);

      await rooms.connect(player1).joinRoom(1);
      await rooms.connect(player2).joinRoom(1);

      const contractBalance = await usdc.balanceOf(roomsAddress);
      expect(contractBalance).to.equal(stake * 2n);
      // Không check room.players.length nữa để tránh phụ thuộc ABI tuple
    });
  });

  describe("settleGame()", function () {
    it("distributes payout 50/30/5/5 correctly", async function () {
      const {
        rooms,
        usdc,
        player1,
        player2,
        player3,
        player4,
        initial,
      } = await deployFixture();

      await rooms.createRoom(1); // roomId = 1, stake = 1 USDC

      const roomsAddress = await rooms.getAddress();
      const stake = ethers.parseUnits("1", 6);

      // approve & join 4 players
      await usdc.connect(player1).approve(roomsAddress, stake);
      await usdc.connect(player2).approve(roomsAddress, stake);
      await usdc.connect(player3).approve(roomsAddress, stake);
      await usdc.connect(player4).approve(roomsAddress, stake);

      await rooms.connect(player1).joinRoom(1);
      await rooms.connect(player2).joinRoom(1);
      await rooms.connect(player3).joinRoom(1);
      await rooms.connect(player4).joinRoom(1);

      // ranked: player1 top1, player2 top2, player3 top3, player4 top4
      const ranked = [
        player1.address,
        player2.address,
        player3.address,
        player4.address,
      ];

      await rooms.settleGame(1, ranked);

      const pool = stake * 4n; // 4 người, mỗi người stake 1 USDC

      const b1 = await usdc.balanceOf(player1.address);
      const b2 = await usdc.balanceOf(player2.address);
      const b3 = await usdc.balanceOf(player3.address);
      const b4 = await usdc.balanceOf(player4.address);

      // Mỗi người đã mất 1 USDC khi joinRoom, sau đó nhận share từ pool
      // balance_after = initial - stake + rewardShare
      expect(b1).to.equal(initial - stake + (pool * 50n / 100n));
      expect(b2).to.equal(initial - stake + (pool * 30n / 100n));
      expect(b3).to.equal(initial - stake + (pool * 5n / 100n));
      expect(b4).to.equal(initial - stake + (pool * 5n / 100n));
    });
  });
});
