/// SPDX-License-Identifier: UNLICENSED
pragma solidity =0.8.20;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

error OperatorRoleRequired();
error TicketPurchased();
error NotTicketOwner();
error NotAWinner();
error AlreadyClaimed();
error GameInProgress();
error WonTicketAlreadySet();
error TicketNotInTheGame();
error ServiceTemporarilyUnavailable();
error AlreadyInitialized();
error InvalidSignature();
error SignatureExpired();

contract Jackpot is EIP712, Ownable {
    using ECDSA for bytes32;
    using SafeERC20 for IERC20;

    struct Game {
        uint256 totalReward; ///  Total accumulated reward per game
        uint256 numOfTickets; ///  Number of purchased tickets
        uint256 wonTicketId; ///  Won TicketId of the game
        bool claimed; ///  Reward's status (true = claimed; false = unclaimed)
    }

    struct Ticket {
        uint256 gameId; /// GameId
        address owner; /// Address of a ticket's owner
    }

    /// _PURCHASE = keccak256("Purchase(address account,uint256 nonce,uint256 expiry)")
    bytes32 private constant _PURCHASE =
        0x0a8e2d73399d803b0cfee1b5024ed466320d347e7458761ab7fb396db61720bf;

    /// Jackpot Pool starting time
    uint256 public immutable START_TIME;

    /// Window time per game
    uint256 public immutable WINDOW_TIME;

    /// Payment/Reward Token address
    IERC20 public immutable TOKEN;

    /// base jackpot prize increased per ticket purchased
    uint256 public basePrize;

    /// A list of Operators who are granted an authority to configure settings
    mapping(address => bool) public operators;

    /// A list of Authorizers who given a signature to verify parameters
    mapping(address => bool) public authorizers;

    /// Number of purchased tickets per `account`
    mapping(address => uint256) public nonces;

    /// Store a mapping of Game info (gameId => Game)
    mapping(uint256 => Game) public games;

    /// Store a mapping of Ticket info (ticketId => Ticket)
    mapping(uint256 => Ticket) public tickets;

    /// Store a mapping of game slots (gameId => slotNo => ticketId)
    mapping(uint256 => mapping(uint256 => uint256)) public gameSlots;

    /// Jackpot Pool's pending state
    bool public isPending;

    /// 1st Pool prize init flag
    bool private _isInitialized;

    /**
        - @dev Event emitted when Operator role is set/removed
        - Related function: setOperator()
    */
    event SetOperator(address indexed account, bool isOperator);

    /**
        - @dev Event emitted when Authorizer role is set/removed
        - Related function: setAuthorizer()
    */
    event SetAuthorizer(address indexed account, bool isAuthorizer);

    /**
        - @dev Event emitted when Operator role successfully update new base prize
        - Related function: setBasePrize()
    */
    event UpdatedBasePrize(address indexed operator, uint256 newBasePrize);

    /**
        - @dev Event emitted when Operator role successfully update the winning ticket of one game
        - Related function: setWinningTicket()
    */
    event WonTicket(
        address indexed operator,
        uint256 indexed gameId,
        uint256 indexed ticketId
    );

    /**
        - @dev Event emitted when `msg.sender` successfully purchased a `ticketId`
        - Related function: purchase()
    */
    event Purchased(
        address indexed buyer,
        uint256 indexed ticketId,
        uint256 indexed gameId,
        uint256 slotNo
    );

    /**
        - @dev Event emitted when `msg.sender` successfully claimed a reward
        - Related function: claim()
    */
    event Claimed(
        address indexed winner,
        uint256 indexed gameId,
        uint256 amount
    );

    modifier onlyOperator() {
        if (!operators[msg.sender]) revert OperatorRoleRequired();
        _;
    }

    constructor(
        address initOwner,
        uint256 startTime,
        uint256 windowTime,
        address token
    ) EIP712("Jackpot", "Version 1") Ownable(initOwner) {
        /// Init settings
        START_TIME = startTime;
        WINDOW_TIME = windowTime;
        TOKEN = IERC20(token);
    }

    /** 
        @notice Query `ticketId` by `account` and `nonce`
        @dev
        - Requirement:
            - Caller can be ANY
        - Returns:
            - account   Ticket's owner address
            - nonce     The `nonce` value corresponding to the `ticketId` and ticket's `owner`
    */
    function getTicketId(
        address account,
        uint256 nonce
    ) external view returns (uint256 ticketId) {
        return _getTicketId(account, nonce);
    }

    /** 
        @notice Query a current `gameId` corresponding to timestamp and settings
        @dev
        - Requirement:
            - Caller can be ANY
        - Returns:
            - gameId    The unique number of gameId
    */
    function getCurrentGameId() external view returns (uint256 gameId) {
        if (block.timestamp < START_TIME) gameId = 1;
        else gameId = _getGameId();
    }

    /** 
        @notice Set/Remove `Operator` role of an account
        @dev
        - Requirement:
            - Caller MUST be `owner`
        - Params:
            - account          Account's address to be updated
            - isOperator       Boolean flag (true = set, false = remove)
    */
    function setOperator(address account, bool isOperator) external onlyOwner {
        operators[account] = isOperator;

        emit SetOperator(account, isOperator);
    }

    /** 
        @notice Set/Remove `Authorizer` role of an account
        @dev
        - Requirement:
            - Caller MUST be `owner`
        - Params:
            - account          Account's address to be updated
            - isAuthorizer     Boolean flag (true = set, false = remove)
    */
    function setAuthorizer(
        address account,
        bool isAuthorizer
    ) external onlyOwner {
        authorizers[account] = isAuthorizer;

        emit SetAuthorizer(account, isAuthorizer);
    }

    /** 
        @notice Enable/Disable "isPending" status
        @dev
        - Requirement:
            - Caller MUST be `owner`
        - Param:
            - status            New pending status (true = pending, false = not pending)
    */
    function setPending(bool status) external onlyOwner {
        isPending = status;
    }

    /** 
        @notice Initialize 1st Jackpot Prize
        @dev
        - Requirement:
            - Caller MUST be `owner`
        - Params:
            - funder            Address that will fund the 1st Jackpot prize
            - fundingAmount     A value of funding amount
    */
    function initPool(
        address funder,
        uint256 fundingAmount
    ) external onlyOwner {
        /// @dev The first jackpot pool reward is initialized with `fundingAmount`
        /// 20% of ticket purchase will be accumulated in the pool
        /// In the next following games, jackpot pool reward only comes from
        /// the tickets purchased
        if (_isInitialized) revert AlreadyInitialized();
        _isInitialized = true;
        uint256 gameId = 1;

        TOKEN.safeTransferFrom(funder, address(this), fundingAmount);
        games[gameId].totalReward += fundingAmount;
    }

    /** 
        @notice Set new value of `basePrize`
        @dev
        - Requirement:
            - Caller MUST have "Operator" role
        - Params:
            - newBasePrize            New value of a base prize
    */
    function setBasePrize(uint256 newBasePrize) external onlyOperator {
        basePrize = newBasePrize;

        emit UpdatedBasePrize(msg.sender, newBasePrize);
    }

    /** 
        @notice Set a winning `ticketId` of the `gameId`
        @dev
        - Requirements:
            - Caller MUST have "Operator" role
            - Winning announcement can be made after the game has finished
            - Announcement can be made once
            - `ticketId` should be valid and be recorded in the `gameId`
        - Params:
            - gameId           The unique number assigned to the game
            - ticketId         The ID of a winning ticket
    */
    function setWinningTicket(
        uint256 gameId,
        uint256 ticketId
    ) external onlyOperator {
        /// @dev It's ok to ignore checking the default value of `gameId` and `ticketId`
        /// when `gameId` and `ticketId` are default, 2nd and 3rd validation are passed
        /// However, the pool reward of `gameId = 0` always zero
        /// Therefore, it won't cause any risk
        /// In addition, `ticketId` is generated using keccak256()
        /// thus, `ticketId = 0` never be owned by any account
        Game memory game = games[gameId];
        if (block.timestamp < START_TIME + WINDOW_TIME * gameId)
            revert GameInProgress();
        if (tickets[ticketId].gameId != gameId) revert TicketNotInTheGame();
        if (game.wonTicketId != 0) revert WonTicketAlreadySet();

        /// Update Game storage state
        games[gameId].wonTicketId = ticketId;

        emit WonTicket(msg.sender, gameId, ticketId);
    }

    /** 
        @notice Purchase a `ticketId`
        @dev
        - Requirements:
            - Caller can be ANY
            - Signature must be valid
        - Params:
            - expiry           Signature's expiring timestamp
            - signature        Signature provided by Authorizer
    */
    function purchase(uint256 expiry, bytes calldata signature) external {
        /// Users allowed to purchase tickets after `START_TIME`
        /// If `isPending` flag is set, the Jackpot Pool service is temporarily unavailable
        uint256 currentTime = block.timestamp;
        if (isPending || currentTime < START_TIME)
            revert ServiceTemporarilyUnavailable();
        if (currentTime > expiry) revert SignatureExpired();

        /// Retrieve 'Signer' and verify authorization
        address sender = msg.sender;
        (address signer, uint256 nonce) = _getSigner(sender, expiry, signature);
        if (!authorizers[signer]) revert InvalidSignature();

        /// update accumulated `totalReward` and `numOfTickets` of the `gameId`
        /// @dev: For each of ticket purchased, `totalReward` of a jackpot's pool
        /// will be accumulated `basePrize` amount
        uint256 gameId = _getGameId();
        uint256 slot = games[gameId].numOfTickets;
        games[gameId].totalReward += basePrize;
        games[gameId].numOfTickets = slot + 1;

        /// Update Ticket info and Game Slot info
        uint256 ticketId = _getTicketId(sender, nonce);
        if (tickets[ticketId].gameId != 0) revert TicketPurchased();
        tickets[ticketId] = Ticket({gameId: gameId, owner: sender});
        nonces[sender]++;
        gameSlots[gameId][slot] = ticketId;

        emit Purchased(sender, ticketId, gameId, slot);
    }

    /** 
        @notice Claim a winning reward
        @dev
        - Requirements:
            - Caller can be ANY
            - Must be the owner of `ticketId`
            - `ticketId` should be announced as the wining ticket of the `gameId`
            - `ticketId` should be claimed once
        - Params:
            - ticketId        The ID of a winning ticket
    */
    function claim(uint256 ticketId) external {
        address winner = msg.sender;
        uint256 gameId = tickets[ticketId].gameId;
        Game memory game = games[gameId];
        if (tickets[ticketId].owner != winner) revert NotTicketOwner();
        if (game.wonTicketId != ticketId) revert NotAWinner();
        if (game.claimed) revert AlreadyClaimed();

        /// update storage status
        games[gameId].claimed = true;
        uint256 rewardAmount = game.totalReward;

        /// transfer `rewardAmount` to a winner
        TOKEN.safeTransfer(winner, rewardAmount);

        emit Claimed(winner, gameId, rewardAmount);
    }

    function _getGameId() private view returns (uint256 gameId) {
        gameId = (block.timestamp - START_TIME) / WINDOW_TIME + 1;
    }

    function _getTicketId(
        address account,
        uint256 nonce
    ) private view returns (uint256 ticketId) {
        ticketId = uint256(
            keccak256(abi.encode(address(this), account, nonce))
        );
    }

    function _getSigner(
        address account,
        uint256 expiry,
        bytes calldata signature
    ) private view returns (address signer, uint256 nonce) {
        nonce = nonces[account];
        signer = _hashTypedDataV4(
            keccak256(abi.encode(_PURCHASE, account, nonce, expiry))
        ).recover(signature);
    }
}
