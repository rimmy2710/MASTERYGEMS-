// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IERC20 {
    function transfer(address to, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
}

contract MasteryGemsRooms {
    struct Room {
        uint128 totalStake;
        uint128 devFee;
        uint64 minPlayers;
        uint64 maxPlayers;
        uint64 playerCount;
        uint8 state; // 0 Open, 1 Locked, 2 Settled, 3 Cancelled
        address creator;
        uint256 stakeAmount;
    }

    struct PlayerInfo {
        bool joined;
        bool hasCommitted;
        bool hasSettled;
        bytes32 commitHash;
    }

    IERC20 public immutable usdc;
    address public immutable devWallet;
    address public owner;
    uint256 public nextRoomId;

    mapping(uint256 => Room) public rooms;
    mapping(uint256 => mapping(address => PlayerInfo)) public players;
    mapping(address => bool) public isBackend;

    event RoomCreated(uint256 roomId, address creator, uint256 stakeAmount, uint64 minPlayers, uint64 maxPlayers);
    event RoomJoined(uint256 roomId, address player, uint256 amount);
    event RoomLocked(uint256 roomId);
    event MoveCommitted(uint256 roomId, address player, bytes32 commitHash);
    event GameSettled(uint256 roomId, address[4] winners, uint256[4] payouts, uint256 devFeeAmount);

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    modifier onlyBackendOrOwner() {
        require(msg.sender == owner || isBackend[msg.sender], "Not authorized");
        _;
    }

    modifier roomExists(uint256 roomId) {
        require(roomId < nextRoomId, "Room does not exist");
        _;
    }

    modifier inState(uint256 roomId, uint8 requiredState) {
        require(rooms[roomId].state == requiredState, "Invalid state");
        _;
    }

    constructor(address _usdc, address _devWallet) {
        require(_usdc != address(0) && _devWallet != address(0), "Zero address");
        usdc = IERC20(_usdc);
        devWallet = _devWallet;
        owner = msg.sender;
    }

    function setOwner(address newOwner) external onlyOwner {
        require(newOwner != address(0), "Zero address");
        owner = newOwner;
    }

    function setBackend(address backend, bool allowed) external onlyOwner {
        require(backend != address(0), "Zero address");
        isBackend[backend] = allowed;
    }

    function createRoom(uint256 stakeAmount, uint64 minPlayers, uint64 maxPlayers, address creator) external onlyBackendOrOwner {
        require(stakeAmount > 0, "Stake must be >0");
        require(minPlayers > 0 && maxPlayers >= minPlayers, "Invalid players");
        require(creator != address(0), "Zero creator");

        uint256 roomId = nextRoomId++;
        rooms[roomId] = Room({
            totalStake: 0,
            devFee: 0,
            minPlayers: minPlayers,
            maxPlayers: maxPlayers,
            playerCount: 0,
            state: 0,
            creator: creator,
            stakeAmount: stakeAmount
        });

        emit RoomCreated(roomId, creator, stakeAmount, minPlayers, maxPlayers);
    }

    function joinRoom(uint256 roomId) external roomExists(roomId) inState(roomId, 0) {
        Room storage room = rooms[roomId];
        require(room.playerCount < room.maxPlayers, "Room full");

        PlayerInfo storage info = players[roomId][msg.sender];
        require(!info.joined, "Already joined");

        info.joined = true;
        room.playerCount += 1;
        uint256 amount = room.stakeAmount;
        room.totalStake += uint128(amount);

        require(usdc.transferFrom(msg.sender, address(this), amount), "Transfer failed");

        emit RoomJoined(roomId, msg.sender, amount);
    }

    function lockRoom(uint256 roomId) external onlyBackendOrOwner roomExists(roomId) inState(roomId, 0) {
        Room storage room = rooms[roomId];
        require(room.playerCount >= room.minPlayers, "Not enough players");
        room.state = 1;
        emit RoomLocked(roomId);
    }

    function commitMove(uint256 roomId, bytes32 commitHash) external roomExists(roomId) inState(roomId, 1) {
        PlayerInfo storage info = players[roomId][msg.sender];
        require(info.joined, "Not joined");
        require(!info.hasCommitted, "Already committed");

        info.hasCommitted = true;
        info.commitHash = commitHash;

        emit MoveCommitted(roomId, msg.sender, commitHash);
    }

    function settleGame(uint256 roomId, address[4] calldata winners, uint256[4] calldata payouts)
        external
        onlyBackendOrOwner
        roomExists(roomId)
        inState(roomId, 1)
    {
        Room storage room = rooms[roomId];
        require(room.playerCount >= room.minPlayers, "Not enough players");

        uint256 totalStake = room.totalStake;
        uint256 devFeeAmount = (totalStake * 10) / 100;
        room.devFee = uint128(devFeeAmount);

        uint256 totalPayout;
        for (uint256 i = 0; i < 4; i++) {
            address winner = winners[i];
            uint256 payout = payouts[i];
            if (winner != address(0) && payout > 0) {
                PlayerInfo storage info = players[roomId][winner];
                require(info.joined, "Winner not player");
                require(!info.hasSettled, "Already settled");
                info.hasSettled = true;

                totalPayout += payout;
                require(usdc.transfer(winner, payout), "Payout failed");
            }
        }

        require(totalPayout <= totalStake - devFeeAmount, "Invalid payouts");
        require(usdc.transfer(devWallet, devFeeAmount), "Dev fee failed");

        room.state = 2;

        emit GameSettled(roomId, winners, payouts, devFeeAmount);
    }
}
