import { expect } from "chai";
import { ethers } from "hardhat";

const ONE = ethers.utils.parseUnits("1", 6);

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
    await usdc.deployed();

    const MasteryGemsRooms = await ethers.getContractFactory("MasteryGemsRooms");
    const contract = await MasteryGemsRooms.deploy(usdc.address, dev.address);
    await contract.deployed();

    await contract.setBackend(backend.address, true);

    return { contract, usdc, owner, backend, player1, player2, player3, dev };
  }

  it("creates rooms", async function () {
    const { contract, backend } = await deployFixture();

    await expect(contract.connect(backend).createRoom(ONE, 2, 4, backend.address))
      .to.emit(contract, "RoomCreated")
      .withArgs(0, backend.address, ONE, 2, 4);

    const room = await contract.rooms(0);
    expect(room.stakeAmount).to.equal(ONE);
    expect(room.minPlayers).to.equal(2);
    expect(room.maxPlayers).to.equal(4);
    expect(room.state).to.equal(0);
  });

  it("allows players to join and locks room", async function () {
    const { contract, backend, player1, player2, usdc } = await deployFixture();
    await contract.connect(backend).createRoom(ONE, 2, 4, backend.address);

    await usdc.mint(player1.address, ONE.mul(2));
    await usdc.mint(player2.address, ONE.mul(2));

    await usdc.connect(player1).transfer(contract.address, 0); // ensure signer type

    await expect(contract.connect(player1).joinRoom(0))
      .to.emit(contract, "RoomJoined")
      .withArgs(0, player1.address, ONE);

    await expect(contract.connect(player2).joinRoom(0))
      .to.emit(contract, "RoomJoined")
      .withArgs(0, player2.address, ONE);

    await expect(contract.connect(backend).lockRoom(0))
      .to.emit(contract, "RoomLocked")
      .withArgs(0);
  });

  it("settles game with payouts and dev fee", async function () {
    const { contract, backend, player1, player2, player3, usdc, dev } = await deployFixture();
    await contract.connect(backend).createRoom(ONE, 2, 4, backend.address);

    await usdc.mint(player1.address, ONE.mul(3));
    await usdc.mint(player2.address, ONE.mul(3));
    await usdc.mint(player3.address, ONE.mul(3));

    await expect(contract.connect(player1).joinRoom(0)).to.emit(contract, "RoomJoined");
    await expect(contract.connect(player2).joinRoom(0)).to.emit(contract, "RoomJoined");
    await expect(contract.connect(player3).joinRoom(0)).to.emit(contract, "RoomJoined");

    await expect(contract.connect(backend).lockRoom(0)).to.emit(contract, "RoomLocked");

    const winners = [player1.address, player2.address, player3.address, ethers.constants.AddressZero];
    const payouts = [ONE.mul(2), ONE, ONE.mul(0), 0];

    const totalStake = ONE.mul(3);
    const devFee = totalStake.mul(10).div(100);

    await expect(contract.connect(backend).settleGame(0, winners as any, payouts as any))
      .to.emit(contract, "GameSettled")
      .withArgs(0, winners, payouts, devFee);

    expect(await usdc.balanceOf(player1.address)).to.equal(ONE.mul(2));
    expect(await usdc.balanceOf(player2.address)).to.equal(ONE.mul(2));
    expect(await usdc.balanceOf(player3.address)).to.equal(0);
    expect(await usdc.balanceOf(dev.address)).to.equal(devFee);

    const room = await contract.rooms(0);
    expect(room.state).to.equal(2);
  });
});
