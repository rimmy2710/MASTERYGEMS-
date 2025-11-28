import { expect } from "chai";
import { ethers } from "hardhat";
import { parseUnits } from "ethers";

const ONE = parseUnits("1", 6); // 1 USDC với 6 decimals, kiểu bigint

describe("MasteryGemsRooms", function () {
  async function deployFixture() {
    const [owner, backend, player1, player2, player3, dev] =
      await ethers.getSigners();

    const MockUSDC = await ethers.getContractFactory(`
      contract MockUSDC {
        string public name = "Mock USDC";
        string public symbol = "mUSDC";
        uint8 public decimals = 6;
        mapping(address => uint256) public balanceOf;
        event Transfer(address indexed from, address indexed to, uint256 value);
        function transfer(address to, uint256 amount) external returns (bool) {
          require(balanceOf[msg.sender] >= amount, "bal");
          balanceOf[msg.sender] -= amount;
          balanceOf[to] += amount;
          emit Transfer(msg.sender, to, amount);
          return true;
        }
        function transferFrom(address from, address to, uint256 amount) external returns (bool) {
          require(balanceOf[from] >= amount, "bal");
          balanceOf[from] -= amount;
          balanceOf[to] += amount;
          emit Transfer(from, to, amount);
          return true;
        }
        function mint(address to, uint256 amount) external {
          balanceOf[to] += amount;
          emit Transfer(address(0), to, amount);
        }
      }
    `);

    const usdc = await MockUSDC.deploy();
    await usdc.waitForDeployment();

    const MasteryGemsRooms = await ethers.getContractFactory("MasteryGemsRooms");
    const contract = await MasteryGemsRooms.deploy(
      await usdc.getAddress(),
      dev.address
    );
    await contract.waitForDeployment();

    await contract.setBackend(backend.address, true);

    return { contract, usdc, owner, backend, player1, player2, player3, dev };
  }

  it("creates rooms", async function () {
    const { contract, backend } = await deployFixture();

    const createTx = await contract
      .connect(backend)
      .createRoom(ONE, 2, 4, backend.address);

    await expect(createTx)
      .to.emit(contract, "RoomCreated")
      .withArgs(0n, backend.address, ONE, 2, 4);

    const room = await contract.rooms(0);
    expect(room.stakeAmount).to.equal(ONE);
    expect(room.minPlayers).to.equal(2n);
    expect(room.maxPlayers).to.equal(4n);
    expect(room.state).to.equal(0); // Open
  });

  it("allows players to join and locks room", async function () {
    const { contract, backend, player1, player2, usdc } = await deployFixture();

    await contract.connect(backend).createRoom(ONE, 2, 4, backend.address);

    // Mỗi player được mint đúng 1 stake
    await usdc.mint(player1.address, ONE);
    await usdc.mint(player2.address, ONE);

    const joinTx1 = await contract.connect(player1).joinRoom(0);
    await expect(joinTx1)
      .to.emit(contract, "RoomJoined")
      .withArgs(0n, player1.address, ONE);

    const joinTx2 = await contract.connect(player2).joinRoom(0);
    await expect(joinTx2)
      .to.emit(contract, "RoomJoined")
      .withArgs(0n, player2.address, ONE);

    const lockTx = await contract.connect(backend).lockRoom(0);
    await expect(lockTx)
      .to.emit(contract, "RoomLocked")
      .withArgs(0n);

    const room = await contract.rooms(0);
    expect(room.playerCount).to.equal(2n);
    expect(room.state).to.equal(1); // Locked
  });

  it("settles game with payouts and dev fee", async function () {
    const { contract, backend, player1, player2, player3, usdc, dev } =
      await deployFixture();

    await contract.connect(backend).createRoom(ONE, 2, 4, backend.address);

    // Mỗi player mint đúng 1 stake
    await usdc.mint(player1.address, ONE);
    await usdc.mint(player2.address, ONE);
    await usdc.mint(player3.address, ONE);

    await contract.connect(player1).joinRoom(0);
    await contract.connect(player2).joinRoom(0);
    await contract.connect(player3).joinRoom(0);

    await contract.connect(backend).lockRoom(0);

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

    // player1: minted 1, stake 1, nhận 2 => còn 2
    expect(await usdc.balanceOf(player1.address)).to.equal(ONE * 2n);
    // player2: minted 1, stake 1, nhận 1 => còn 1
    expect(await usdc.balanceOf(player2.address)).to.equal(ONE);
    // player3: minted 1, stake 1, nhận 0 => còn 0
    expect(await usdc.balanceOf(player3.address)).to.equal(0n);

    // dev nhận 10% pool (3 * ONE * 10 / 100)
    expect(await usdc.balanceOf(dev.address)).to.equal(devFee);

    const room = await contract.rooms(0);
    expect(room.state).to.equal(2); // Settled
  });
});
