/// SPDX-License-Identifier: UNLICENSED
pragma solidity =0.8.20;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
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

contract JackpotV2 is Ownable {
    using SafeERC20 for IERC20;

    struct Distribution {
        address receiver; /// Address that receives the token distribution
        uint256 percentage; /// Percentage amount
    }

    /// @dev:
    /// The first element of the `info` array should be dedicated for the Jackpot pool
    struct Settings {
        uint256 ticketPrice; /// Payment amount per ticket
        Distribution[] info;
    }

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

    /// Denominator value
    uint256 private constant DENOM = 1_000_000;

    /// Burning address
    address private constant BURNING_ADDR =
        0x000000000000000000000000000000000000dEaD;

    /// Jackpot Pool starting time
    uint256 public immutable START_TIME;

    /// Window time per game
    uint256 public immutable WINDOW_TIME;

    /// Payment/Reward Token address
    IERC20 public immutable TOKEN;

    Settings private _settings;

    /// A list of Operators who are granted an authority to configure settings
    mapping(address => bool) public operators;

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
        - @dev Event emitted when Operator role successfully update new settings
        - Related function: updateSettings()
    */
    event SettingsUpdated(address indexed operator, uint256 price);

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
    ) Ownable(initOwner) {
        /// Init settings
        START_TIME = startTime;
        WINDOW_TIME = windowTime;
        TOKEN = IERC20(token);
    }

    /** 
        @notice Query current `settings` configurations
        @dev
        - Requirement:
            - Caller can be ANY
        - Returns:
            - price   Current setting of `ticketPrice`
            - info    Array of Distribution `info` struct
    */
    function getSettings()
        external
        view
        returns (uint256 price, Distribution[] memory info)
    {
        return (_settings.ticketPrice, _settings.info);
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
        @notice Update settings' info
        @dev
        - Requirement:
            - Caller MUST have "Operator" role
        - Params:
            - price           A new value of `ticketPrice`
            - info            A new array of distribution info

        Note: @dev
        - The first element of the `info` array should be dedicated for the Jackpot pool
    */
    function updateSettings(
        uint256 price,
        Distribution[] calldata info
    ) external onlyOperator {
        /// delete settings.info before calling to make an update
        delete _settings.info;
        _updateSettings(price, info);

        emit SettingsUpdated(msg.sender, price);
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
            - Should have sufficient balance to purchase a ticket
            - Should approve sufficient amount of allowance
    */
    function purchase() external {
        /// Users allowed to purchase tickets after `START_TIME`
        /// If `isPending` flag is set, the Jackpot Pool service is temporarily unavailable
        if (isPending || block.timestamp < START_TIME)
            revert ServiceTemporarilyUnavailable();

        /// make a payment
        address sender = msg.sender;
        Distribution[] memory info = _settings.info;
        uint256 ticketPrice = _settings.ticketPrice;
        uint256 len = info.length;

        for (uint256 i; i < len; i++)
            TOKEN.safeTransferFrom(
                sender,
                info[i].receiver,
                (info[i].percentage * ticketPrice) / DENOM
            );

        /// update accumulated `totalReward` and `numOfTickets` of the `gameId`
        /// @dev The first element of the `info` array is dedicated for the Jackpot pool
        uint256 gameId = _getGameId();
        uint256 slot = games[gameId].numOfTickets;
        games[gameId].totalReward += (info[0].percentage * ticketPrice) / DENOM;
        games[gameId].numOfTickets = slot + 1;

        /// Update Ticket info and Game Slot info
        uint256 ticketId = _getTicketId(sender, nonces[sender]);
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

    function _updateSettings(
        uint256 price,
        Distribution[] memory info
    ) private {
        /// @dev Ensure settings.info array deleted before calling this function
        _settings.ticketPrice = price;
        uint256 len = info.length;
        for (uint256 i; i < len; i++) _settings.info.push(info[i]);
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
}
