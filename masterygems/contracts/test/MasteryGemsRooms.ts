import { expect } from "chai";
import { ethers } from "hardhat";
import { parseUnits } from "ethers";


const ONE = parseUnits("1", 6);

describe("MasteryGemsRooms", function () {
  async function deployFixture() {
    const [owner, backend, player1, player2, player3, dev] = await ethers.getSigners();

    const MockUSDC = await ethers.getContractFactory(`contract MockUSDC {
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
    }`);

    const usdc = await MockUSDC.deploy();
    await usdc.waitForDeployment();

    const MasteryGemsRooms = await ethers.getContractFactory("MasteryGemsRooms");
    const contract = await MasteryGemsRooms.deploy(usdc.address, dev.address);
    await contract.waitForDeployment();


const ONE = parseUnits("1", 6); // 1 USDC (6 decimals)

describe("MasteryGemsRooms", function () {

  async function deployFixture() {
    const [owner, backend, player1, player2, player3, dev] =
      await ethers.getSigners();

    // Deploy MockUSDC (đã tạo ở contracts/MockUSDC.sol)
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

    // Đánh dấu backend là backend hợp lệ


    await contract.setBackend(backend.address, true);

    return { contract, usdc, owner, backend, player1, player2, player3, dev };
  }


  it("creates rooms", async function () {
    const { contract, backend } = await deployFixture();

    const createTx = await contract.connect(backend).createRoom(ONE, 2, 4, backend.address);

    await expect(createTx)

  //
  // TEST 1: CREATE ROOM
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

    expect(room.state).to.equal(0);
  });

  it("allows players to join and locks room", async function () {
    const { contract, backend, player1, player2, usdc } = await deployFixture();
    await contract.connect(backend).createRoom(ONE, 2, 4, backend.address);

    await usdc.mint(player1.address, ONE * 2n);
    await usdc.mint(player2.address, ONE * 2n);

    await usdc.connect(player1).transfer(contract.address, 0); // ensure signer type



    expect(room.state).to.equal(0); // Open
  });

  //
  // TEST 2: JOIN ROOM & LOCK
  //
  it("allows players to join and locks room", async function () {
    const { contract, backend, player1, player2, usdc } = await deployFixture();

    await contract.connect(backend).createRoom(ONE, 2, 4, backend.address);

    // Mint USDC cho player
    await usdc.mint(player1.address, ONE);
    await usdc.mint(player2.address, ONE);

    // Player 1 join


    const joinTx1 = await contract.connect(player1).joinRoom(0);
    await expect(joinTx1)
      .to.emit(contract, "RoomJoined")
      .withArgs(0n, player1.address, ONE);



    // Player 2 join


    const joinTx2 = await contract.connect(player2).joinRoom(0);
    await expect(joinTx2)
      .to.emit(contract, "RoomJoined")
      .withArgs(0n, player2.address, ONE);



    // Backend lock room


    const lockTx = await contract.connect(backend).lockRoom(0);
    await expect(lockTx)
      .to.emit(contract, "RoomLocked")
      .withArgs(0n);

  });

  it("settles game with payouts and dev fee", async function () {
    const { contract, backend, player1, player2, player3, usdc, dev } = await deployFixture();
    await contract.connect(backend).createRoom(ONE, 2, 4, backend.address);

    await usdc.mint(player1.address, ONE * 3n);
    await usdc.mint(player2.address, ONE * 3n);
    await usdc.mint(player3.address, ONE * 3n);

    await expect(contract.connect(player1).joinRoom(0)).to.emit(contract, "RoomJoined");
    await expect(contract.connect(player2).joinRoom(0)).to.emit(contract, "RoomJoined");
    await expect(contract.connect(player3).joinRoom(0)).to.emit(contract, "RoomJoined");

    await expect(contract.connect(backend).lockRoom(0)).to.emit(contract, "RoomLocked");

    const winners = [player1.address, player2.address, player3.address, ethers.ZeroAddress];
    const payouts = [ONE * 2n, ONE, 0n, 0n];

    const totalStake = ONE * 3n;
    const devFee = (totalStake * 10n) / 100n;

    const settleTx = await contract.connect(backend).settleGame(0, winners as any, payouts as any);


    const room = await contract.rooms(0);
    expect(room.playerCount).to.equal(2n);
    expect(room.state).to.equal(1); // Locked
  });

  //
  // TEST 3: SETTLE GAME + PAYOUT
  //
  it("settles game with payouts and dev fee", async function () {
    const { contract, backend, player1, player2, player3, usdc, dev } =
      await deployFixture();

    await contract.connect(backend).createRoom(ONE, 2, 4, backend.address);

    // Mint USDC cho từng player
    await usdc.mint(player1.address, ONE);
    await usdc.mint(player2.address, ONE);
    await usdc.mint(player3.address, ONE);

    // Cả 3 player join room
    await contract.connect(player1).joinRoom(0);
    await contract.connect(player2).joinRoom(0);
    await contract.connect(player3).joinRoom(0);

    // Lock room
    await contract.connect(backend).lockRoom(0);

    // Tổng stake = 3 * ONE
    const totalStake = ONE * 3n;
    const devFee = (totalStake * 10n) / 100n; // 10%
    const maxDistributable = totalStake - devFee; // 90% pool

    // Chọn payouts sao cho tổng <= maxDistributable
    // Ở đây: chỉ top1 nhận 2 * ONE, tổng = 2 * ONE < 2.7 * ONE
    const winners = [
      player1.address,
      ethers.ZeroAddress,
      ethers.ZeroAddress,
      ethers.ZeroAddress,
    ];
    const payouts = [ONE * 2n, 0n, 0n, 0n];

    // Kiểm tra điều kiện: tổng payouts <= maxDistributable
    const totalPayout = payouts.reduce((acc, v) => acc + v, 0n);
    expect(totalPayout).to.be.lte(maxDistributable);

    const settleTx = await contract
      .connect(backend)
      .settleGame(0, winners as any, payouts as any);



    await expect(settleTx)
      .to.emit(contract, "GameSettled")
      .withArgs(0n, winners, payouts, devFee);


    expect(await usdc.balanceOf(player1.address)).to.equal(ONE * 2n);
    expect(await usdc.balanceOf(player2.address)).to.equal(ONE * 2n);
    expect(await usdc.balanceOf(player3.address)).to.equal(0n);
    expect(await usdc.balanceOf(dev.address)).to.equal(devFee);

    const room = await contract.rooms(0);
    expect(room.state).to.equal(2);
  });


    // Trước khi join:
    //   - mỗi player mint 1 * ONE
    // JoinRoom dùng transferFrom => mỗi người mất 1 * ONE vào contract
    // Sau settle:
    //   - player1 nhận về 2 * ONE
    //   - player2, player3 không nhận gì
    expect(await usdc.balanceOf(player1.address)).to.equal(ONE * 2n);
    expect(await usdc.balanceOf(player2.address)).to.equal(0n);
    expect(await usdc.balanceOf(player3.address)).to.equal(0n);

    // Dev nhận đúng devFee
    expect(await usdc.balanceOf(dev.address)).to.equal(devFee);

    const room = await contract.rooms(0);
    expect(room.state).to.equal(2); // Settled
  });



});
