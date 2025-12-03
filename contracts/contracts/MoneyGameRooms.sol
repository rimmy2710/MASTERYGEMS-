// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IUSDC {
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function transfer(address to, uint256 amount) external returns (bool);
}

/// @title MoneyGameRooms - Core room contract for Mastery Gems (GĐ1)
/// @notice Hỗ trợ tạo room, join bằng USDC, và settle payout 50/30/5/5 + 10% fee dev
contract MoneyGameRooms {
    struct GameRoom {
        uint256 stake;        // 1, 5, 10 (đơn vị USDC; sẽ * 1e6 khi chuyển token)
        address[] players;    // danh sách người chơi
        bool settled;         // đã settle hay chưa
    }

    IUSDC public immutable usdc;
    address public devWallet;
    uint256 public nextRoomId;

    // roomId -> GameRoom
    mapping(uint256 => GameRoom) public rooms;

    event RoomCreated(uint256 indexed roomId, uint256 stake);
    event PlayerJoined(uint256 indexed roomId, address indexed player, uint256 amount);
    event GameSettled(uint256 indexed roomId, address indexed caller, address[] ranked);
    event DevWalletUpdated(address indexed oldWallet, address indexed newWallet);

    modifier onlyDev() {
        require(msg.sender == devWallet, "Not dev");
        _;
    }

    constructor(address usdcAddress, address _devWallet) {
        require(usdcAddress != address(0), "USDC zero");
        require(_devWallet != address(0), "Dev zero");
        usdc = IUSDC(usdcAddress);
        devWallet = _devWallet;
        nextRoomId = 1;
    }

    /// @notice Tạo room mới với stake 1 / 5 / 10 USDC
    function createRoom(uint256 stake) external returns (uint256 roomId) {
        require(_isValidStake(stake), "Invalid stake");

        roomId = nextRoomId++;
        GameRoom storage room = rooms[roomId];
        room.stake = stake;
        // players[] rỗng, settled = false mặc định

        emit RoomCreated(roomId, stake);
    }

    /// @notice Player join room, chuyển stake USDC từ ví vào contract
    function joinRoom(uint256 roomId) external {
        GameRoom storage room = rooms[roomId];
        require(room.stake > 0, "Room not found");
        require(!room.settled, "Already settled");

        uint256 amount = room.stake * 1e6; // USDC decimals = 6
        bool ok = usdc.transferFrom(msg.sender, address(this), amount);
        require(ok, "USDC transfer failed");

        room.players.push(msg.sender);

        emit PlayerJoined(roomId, msg.sender, amount);
    }

    /// @notice Settle payout cho room, theo thứ hạng gửi từ backend
    /// ranked[0..3] là Top1..Top4
    function settleGame(uint256 roomId, address[] calldata ranked) external onlyDev {
        GameRoom storage room = rooms[roomId];
        require(room.stake > 0, "Room not found");
        require(!room.settled, "Already settled");
        require(ranked.length >= 4, "Need >=4 ranked");

        uint256 stakeAmount = room.stake * 1e6;
        uint256 playerCount = room.players.length;
        require(playerCount > 0, "Empty room");

        uint256 pool = stakeAmount * playerCount;

        // 50% / 30% / 5% / 5% cho Top1..Top4, 10% cho dev
        uint256 p1 = (pool * 50) / 100;
        uint256 p2 = (pool * 30) / 100;
        uint256 p3 = (pool * 5) / 100;
        uint256 p4 = (pool * 5) / 100;
        uint256 devFee = (pool * 10) / 100;

        bool ok =
            usdc.transfer(ranked[0], p1) &&
            usdc.transfer(ranked[1], p2) &&
            usdc.transfer(ranked[2], p3) &&
            usdc.transfer(ranked[3], p4) &&
            usdc.transfer(devWallet, devFee);

        require(ok, "USDC payout failed");

        room.settled = true;

        emit GameSettled(roomId, msg.sender, ranked);
    }

    /// @notice Dev có thể đổi ví nhận fee
    function updateDevWallet(address newDevWallet) external onlyDev {
        require(newDevWallet != address(0), "Zero address");
        address old = devWallet;
        devWallet = newDevWallet;
        emit DevWalletUpdated(old, newDevWallet);
    }

    function _isValidStake(uint256 stake) internal pure returns (bool) {
        return (stake == 1 || stake == 5 || stake == 10);
    }
}
