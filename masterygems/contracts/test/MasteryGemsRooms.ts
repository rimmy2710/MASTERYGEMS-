import { expect } from "chai";
import { ethers } from "hardhat";
import { parseUnits } from "ethers";

const ONE = parseUnits("1", 6); // 1 USDC (6 decimals)

describe("MasteryGemsRooms", function () {

  async function deployFixture() {
    const [owner, backend, player1, player2, player3, dev] =
      await ethers.getSigners();

    // Deploy MockUSDC (already created under contracts/)
    const MockUSDC = await ethers.getContractFactory("MockUSDC");
    const usdc = await MockUSDC.deploy();
    await usdc.waitForDeployment();

    // Deploy MasteryGemsRooms
    const MasteryGemsRooms = await ethers.getContractFactory("MasteryGemsRooms");
    const contract = await MasteryGemsRooms.deploy(
      await usdc.getAddress(),
      dev.address
    );
    await contract.waitForDeployment();

    // Mark backend as trusted
    await contract.setBackend(backend.address, true);

    return { contract, usdc, owner, backend, player1, player2, player3, dev };
  }

  //
  // ────────────────────────────────────────────────
  //   TEST 1: CREATE ROOM
  // ────────────────────────────────────────────────
  //
  it("creates rooms", async function () {
    const { contract, backend } = await deployFixture();

    const tx = await contract
      .connect(backend)
      .createRoom(ONE, 2, 4, backend.address);

    await expect(tx)
      .to.emit(contract, "RoomCreated")
      .withArgs(0n, backend.address, ONE, 2, 4);

    const room = await contract.rooms(0);
    expect(room.stakeAmount).to.equal(ONE);
    expect(room.minPlayers).to.equal(2n);
    expect(room.maxPlayers).to.equal(4n);
    expect(room.state).to.equal(0); // Open
  });

  //
  // ────────────────────────────────────────────────
  //   TEST 2: JOIN ROOM & LOCK
  // ────────────────────────────────────────────────
  //
  it("allows players to join and locks room", async function () {
    const { contract, backend, player1, player2, usdc } = await deployFixture();

    await contract.connect(backend).createRoom(ONE, 2, 4, backend.address);

    // Give players enough USDC
    await usdc.mint(player1.address, ONE);
    await usdc.mint(player2.address, ONE);

    // Player 1
    const joinTx1 = await contract.connect(player1).joinRoom(0);
    await expect(joinTx1)
      .to.emit(contract, "RoomJoined")
      .withArgs(0n, player1.address, ONE);

    // Player 2
    const joinTx2 = await contract.connect(player2).joinRoom(0);
    await expect(joinTx2)
      .to.emit(contract, "RoomJoined")
      .withArgs(0n, player2.address, ONE);

    // Lock the room
    const lockTx = await contract.connect(backend).lockRoom(0);
    await expect(lockTx)
      .to.emit(contract, "RoomLocked")
      .withArgs(0n);

    const room = await contract.rooms(0);
    expect(room.playerCount).to.equal(2n);
    expect(room.state).to.equal(1); // Locked
  });

  //
  // ────────────────────────────────────────────────
  //   TEST 3: SETTLE GAME + PAYOUT
  // ────────────────────────────────────────────────
  //
  it("settles game with payouts and dev fee", async function () {
    const { contract, backend, player1, player2, player3, usdc, dev } =
      await deployFixture();

    await contract.connect(backend).createRoom(ONE, 2, 4, backend.address);

    // Mint USDC for all players
    await usdc.mint(player1.address, ONE);
    await usdc.mint(player2.address, ONE);
    await usdc.mint(player3.address, ONE);

    // Join room
    await contract.connect(player1).joinRoom(0);
    await contract.connect(player2).joinRoom(0);
    await contract.connect(player3).joinRoom(0);

    // Lock
    await contract.connect(backend).lockRoom(0);

    // Winners and payouts
    const winners = [
      player1.address,
      player2.address,
      player3.address,
      ethers.ZeroAddress,
    ];

    const payouts = [ONE * 2n, ONE, 0n, 0n];

    const totalStake = ONE * 3n;
    const devFee = (totalStake * 10n) / 100n;

    const settleTx = await contract
      .connect(backend)
      .settleGame(0, winners as any, payouts as any);

    await expect(settleTx)
      .to.emit(contract, "GameSettled")
      .withArgs(0n, winners, payouts, devFee);

    // Verify payout state
    expect(await usdc.balanceOf(player1.address)).to.equal(ONE * 2n);
    expect(await usdc.balanceOf(player2.address)).to.equal(ONE);
    expect(await usdc.balanceOf(player3.address)).to.equal(0n);

    expect(await usdc.balanceOf(dev.address)).to.equal(devFee);

    const room = await contract.rooms(0);
    expect(room.state).to.equal(2); // Settled
  });

});
