// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IUSDC {
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function transfer(address to, uint256 amount) external returns (bool);
}

/// @title MoneyGameRooms - Minimal test version for Hardhat tests only
/// @notice Bản này không thay đổi logic dự án, chỉ đủ chức năng để test joinRoom + settleGame
contract MoneyGameRooms {
    
    struct GameRoom {
        uint256 stake;        // số USDC (1 = 1 USDC)
        address[] players;    // danh sách người chơi
        bool settled;
    }

    IUSDC public usdc;
    address public devWallet;
    uint256 public nextRoomId;
    mapping(uint256 => GameRoom) public rooms;

    event RoomCreated(uint256 roomId, uint256 stake);
    event Joined(uint256 roomId, address player);
    event Settled(uint256 roomId);

    constructor(address usdcAddress, address _devWallet) {
        usdc = IUSDC(usdcAddress);
        devWallet = _devWallet;
        nextRoomId = 1;
    }

    function createRoom(uint256 stake) external {
        rooms[nextRoomId].stake = stake;
        emit RoomCreated(nextRoomId, stake);
        nextRoomId++;
    }

    function joinRoom(uint256 roomId) external {
        GameRoom storage room = rooms[roomId];
        require(room.stake > 0, "Room does not exist");

        uint256 amount = room.stake * 1e6; // USDC decimals = 6
        usdc.transferFrom(msg.sender, address(this), amount);

        room.players.push(msg.sender);
        emit Joined(roomId, msg.sender);
    }

    /// @notice settle payout 50/30/5/5
    function settleGame(uint256 roomId, address[] calldata ranked) external {
        GameRoom storage room = rooms[roomId];
        require(!room.settled, "already settled");
        require(ranked.length >= 4, "not enough players");

        uint256 stakeAmount = room.stake * 1e6;
        uint256 pool = stakeAmount * ranked.length;

        uint256 p1 = pool * 50 / 100;
        uint256 p2 = pool * 30 / 100;
        uint256 p3 = pool * 5 / 100;
        uint256 p4 = pool * 5 / 100;

        usdc.transfer(ranked[0], p1);
        usdc.transfer(ranked[1], p2);
        usdc.transfer(ranked[2], p3);
        usdc.transfer(ranked[3], p4);

        // dev fee = 10%
        uint256 devFee = pool * 10 / 100;
        usdc.transfer(devWallet, devFee);

        room.settled = true;
        emit Settled(roomId);
    }
}
