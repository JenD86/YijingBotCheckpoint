// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";

error SetAddressZero();
error InactiveTourament();
error PreviousTourementNotFinished();
error AlreadyClaimed();
error NoWinners();
error NotWinner();

contract Tournament is Ownable {
    uint256 public _currTournamentId;
    
    // Add the constants here
    address public constant MULTISIG_ADDRESS = 0xB7b275681EE43c1457B21CCaEbFA0E6Cd72E8f3D;
    uint256 public constant FEE_PERCENTAGE = 20; // 20%
    uint256 public constant BASIS_POINTS = 100; // For percentage calculation

    struct TournamentData {
        uint256 id;
        string name;
        uint256 entryFee;
        uint256 startTime;
        uint256 endTime;
        uint256 totalPrize;
        uint256 winnerCount;
        bytes32 winnersRoot;
    }

    mapping(uint256 => TournamentData) public tournaments;
    // TouramentId -> Participant -> Claimed
    mapping(uint256 => mapping(address => bool)) public claimedWinners;
    

    // Mapping to store authorized addresses
    mapping(address => bool) public authorizers;

    //  Address of the ERC-20 token used for payment
    IERC20 public paymentToken;

    // Modifier to check if the sender is authorized
    modifier onlyAuthorizer() {
        require(authorizers[msg.sender], "Not authorized");
        _;
    }

    /**
        - @dev Event emitted when Authorizer role is set/removed
        - Related function: setAuthorizer()
    */
    event SetAuthorizer(address indexed account, bool isAuthorizer);

    // Event emitted when a new tournament is created
    event TournamentCreated(uint256 indexed tournamentId, string name, uint256 entryFee, address tokenAddress);

    // Event emitted when a player enters a tournament
    event PlayerEntered(uint256 indexed tournamentId, address indexed player);
    
    // Event emitted when a winners root updated
    event WinnersRootUpdated(uint256 indexed tournamentId);

    // Event emmitted when a winer claim
    event PrizeClaimed(uint256 indexed tournamentId, address indexed player, uint256);

    event TokenSet(address tokenAddress);

    constructor(address initialOwner, address paymentToken_) Ownable(initialOwner) {
        paymentToken = IERC20(paymentToken_);
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

    function _lastTouramentFinished() internal view {
        // Check if the last tournament has finished
        if (_currTournamentId > 0) {
            uint256 lastTournamentId = _currTournamentId;
            TournamentData memory lastTournament = tournaments[lastTournamentId];
            if (block.timestamp < lastTournament.endTime) revert PreviousTourementNotFinished();
        }
    }

    function _getTourament(uint256 _tournamentId) internal view returns (TournamentData memory) {
        TournamentData memory tournament = tournaments[_tournamentId];
        require(tournament.id != 0, "Tournament does not exist");

        return tournament;
    }

    /** 
        @notice Set new Payment Token
        @dev Requirements:
        - Caller must be owner
        - New updating payment token must be non-zero (not 0x00)
        - Params:
          - token: New address of the payment acceptance (ERC-20)
    */
    function setPaymentToken(address token) external onlyOwner {
        _lastTouramentFinished();
        if (token == address(0)) revert SetAddressZero();

        paymentToken = IERC20(token);
        emit TokenSet(token);
    }

    function createTournament(
        string memory _name,
        uint256 _entryFee,
        uint256 _startTime,
        uint256 _endTime
    ) external onlyAuthorizer {
        require(_startTime < _endTime, "Invalid tournament duration");
        require(_startTime > block.timestamp, "Start time must be in the future");

        _lastTouramentFinished();
        _currTournamentId++;

        tournaments[_currTournamentId] = TournamentData({
            id: _currTournamentId,
            name: _name,
            entryFee: _entryFee,
            startTime: _startTime,
            endTime: _endTime,
            totalPrize: paymentToken.balanceOf(address(this)),
            winnerCount: 0,
            winnersRoot: ""
        });

        emit TournamentCreated(_currTournamentId, _name, _entryFee, address(paymentToken));
    }

    /**
     * Enter tourament by spending tokens
     */
    function enterTournament(uint256 _tournamentId) external {
    TournamentData memory tournament = _getTourament(_tournamentId);
    
    // Calculate fee amount (20% of entry fee)
    uint256 feeAmount = (tournament.entryFee * FEE_PERCENTAGE) / BASIS_POINTS;
    uint256 prizeAmount = tournament.entryFee - feeAmount;
    
    // Transfer entry fee to contract
    require(paymentToken.transferFrom(msg.sender, address(this), tournament.entryFee), "Token transfer failed");
    
    // Transfer fee to multisig
    require(paymentToken.transfer(MULTISIG_ADDRESS, feeAmount), "Fee transfer failed");
    
    // Add remaining amount to prize pool
    tournaments[_tournamentId].totalPrize += prizeAmount;
    
    // Backend need to listen to this to finalize list of winner
    emit PlayerEntered(_tournamentId, msg.sender);
}

    function updateWinners(uint256 _tournamentId, uint256 _winnerCount, bytes32 _winnersRoot) external onlyAuthorizer {
        _getTourament(_tournamentId);
        tournaments[_tournamentId].winnerCount = _winnerCount; 
        tournaments[_tournamentId].winnersRoot = _winnersRoot; 
        
        emit WinnersRootUpdated(_tournamentId);
    }

    function _verifyProof(
        bytes32[] calldata proof,
        bytes32 rootHash,
        address sender
    ) pure internal returns (bool) {
        return MerkleProof.verify(proof, rootHash, keccak256(bytes.concat(keccak256(abi.encode(sender)))));
    }

    /**
     * Claim winning point
     * If user not claim before ending tourament, the balance will be accumulated for the next touraments
     */
    function claim(uint256 _tournamentId, bytes32[] calldata proof) external {
        TournamentData memory tournament = _getTourament(_tournamentId);
        if (claimedWinners[_tournamentId][msg.sender]) revert AlreadyClaimed();
        if (tournament.winnerCount == 0) revert NoWinners();
        if (!_verifyProof(proof, tournament.winnersRoot, msg.sender)) revert NotWinner();
        uint256 prize = tournament.totalPrize / tournament.winnerCount;

        // Mark the participant as claimed to prevent double-claiming
        claimedWinners[_tournamentId][msg.sender] = true;
        // Transfer the prize to the participant
        require(paymentToken.transfer(msg.sender, prize), "Prize transfer failed");
        emit PrizeClaimed(_tournamentId, msg.sender, prize);
    }
}
