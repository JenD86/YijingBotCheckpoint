// Sources flattened with hardhat v2.23.0 https://hardhat.org

// SPDX-License-Identifier: MIT AND UNLICENSED

// File @openzeppelin/contracts/utils/Context.sol@v5.0.2

// Original license: SPDX_License_Identifier: MIT
// OpenZeppelin Contracts (last updated v5.0.1) (utils/Context.sol)

pragma solidity ^0.8.20;

/**
 * @dev Provides information about the current execution context, including the
 * sender of the transaction and its data. While these are generally available
 * via msg.sender and msg.data, they should not be accessed in such a direct
 * manner, since when dealing with meta-transactions the account sending and
 * paying for execution may not be the actual sender (as far as an application
 * is concerned).
 *
 * This contract is only required for intermediate, library-like contracts.
 */
abstract contract Context {
    function _msgSender() internal view virtual returns (address) {
        return msg.sender;
    }

    function _msgData() internal view virtual returns (bytes calldata) {
        return msg.data;
    }

    function _contextSuffixLength() internal view virtual returns (uint256) {
        return 0;
    }
}


// File @openzeppelin/contracts/access/Ownable.sol@v5.0.2

// Original license: SPDX_License_Identifier: MIT
// OpenZeppelin Contracts (last updated v5.0.0) (access/Ownable.sol)

pragma solidity ^0.8.20;

/**
 * @dev Contract module which provides a basic access control mechanism, where
 * there is an account (an owner) that can be granted exclusive access to
 * specific functions.
 *
 * The initial owner is set to the address provided by the deployer. This can
 * later be changed with {transferOwnership}.
 *
 * This module is used through inheritance. It will make available the modifier
 * `onlyOwner`, which can be applied to your functions to restrict their use to
 * the owner.
 */
abstract contract Ownable is Context {
    address private _owner;

    /**
     * @dev The caller account is not authorized to perform an operation.
     */
    error OwnableUnauthorizedAccount(address account);

    /**
     * @dev The owner is not a valid owner account. (eg. `address(0)`)
     */
    error OwnableInvalidOwner(address owner);

    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    /**
     * @dev Initializes the contract setting the address provided by the deployer as the initial owner.
     */
    constructor(address initialOwner) {
        if (initialOwner == address(0)) {
            revert OwnableInvalidOwner(address(0));
        }
        _transferOwnership(initialOwner);
    }

    /**
     * @dev Throws if called by any account other than the owner.
     */
    modifier onlyOwner() {
        _checkOwner();
        _;
    }

    /**
     * @dev Returns the address of the current owner.
     */
    function owner() public view virtual returns (address) {
        return _owner;
    }

    /**
     * @dev Throws if the sender is not the owner.
     */
    function _checkOwner() internal view virtual {
        if (owner() != _msgSender()) {
            revert OwnableUnauthorizedAccount(_msgSender());
        }
    }

    /**
     * @dev Leaves the contract without owner. It will not be possible to call
     * `onlyOwner` functions. Can only be called by the current owner.
     *
     * NOTE: Renouncing ownership will leave the contract without an owner,
     * thereby disabling any functionality that is only available to the owner.
     */
    function renounceOwnership() public virtual onlyOwner {
        _transferOwnership(address(0));
    }

    /**
     * @dev Transfers ownership of the contract to a new account (`newOwner`).
     * Can only be called by the current owner.
     */
    function transferOwnership(address newOwner) public virtual onlyOwner {
        if (newOwner == address(0)) {
            revert OwnableInvalidOwner(address(0));
        }
        _transferOwnership(newOwner);
    }

    /**
     * @dev Transfers ownership of the contract to a new account (`newOwner`).
     * Internal function without access restriction.
     */
    function _transferOwnership(address newOwner) internal virtual {
        address oldOwner = _owner;
        _owner = newOwner;
        emit OwnershipTransferred(oldOwner, newOwner);
    }
}


// File @openzeppelin/contracts/token/ERC20/IERC20.sol@v5.0.2

// Original license: SPDX_License_Identifier: MIT
// OpenZeppelin Contracts (last updated v5.0.0) (token/ERC20/IERC20.sol)

pragma solidity ^0.8.20;

/**
 * @dev Interface of the ERC20 standard as defined in the EIP.
 */
interface IERC20 {
    /**
     * @dev Emitted when `value` tokens are moved from one account (`from`) to
     * another (`to`).
     *
     * Note that `value` may be zero.
     */
    event Transfer(address indexed from, address indexed to, uint256 value);

    /**
     * @dev Emitted when the allowance of a `spender` for an `owner` is set by
     * a call to {approve}. `value` is the new allowance.
     */
    event Approval(address indexed owner, address indexed spender, uint256 value);

    /**
     * @dev Returns the value of tokens in existence.
     */
    function totalSupply() external view returns (uint256);

    /**
     * @dev Returns the value of tokens owned by `account`.
     */
    function balanceOf(address account) external view returns (uint256);

    /**
     * @dev Moves a `value` amount of tokens from the caller's account to `to`.
     *
     * Returns a boolean value indicating whether the operation succeeded.
     *
     * Emits a {Transfer} event.
     */
    function transfer(address to, uint256 value) external returns (bool);

    /**
     * @dev Returns the remaining number of tokens that `spender` will be
     * allowed to spend on behalf of `owner` through {transferFrom}. This is
     * zero by default.
     *
     * This value changes when {approve} or {transferFrom} are called.
     */
    function allowance(address owner, address spender) external view returns (uint256);

    /**
     * @dev Sets a `value` amount of tokens as the allowance of `spender` over the
     * caller's tokens.
     *
     * Returns a boolean value indicating whether the operation succeeded.
     *
     * IMPORTANT: Beware that changing an allowance with this method brings the risk
     * that someone may use both the old and the new allowance by unfortunate
     * transaction ordering. One possible solution to mitigate this race
     * condition is to first reduce the spender's allowance to 0 and set the
     * desired value afterwards:
     * https://github.com/ethereum/EIPs/issues/20#issuecomment-263524729
     *
     * Emits an {Approval} event.
     */
    function approve(address spender, uint256 value) external returns (bool);

    /**
     * @dev Moves a `value` amount of tokens from `from` to `to` using the
     * allowance mechanism. `value` is then deducted from the caller's
     * allowance.
     *
     * Returns a boolean value indicating whether the operation succeeded.
     *
     * Emits a {Transfer} event.
     */
    function transferFrom(address from, address to, uint256 value) external returns (bool);
}


// File @openzeppelin/contracts/utils/cryptography/MerkleProof.sol@v5.0.2

// Original license: SPDX_License_Identifier: MIT
// OpenZeppelin Contracts (last updated v5.0.0) (utils/cryptography/MerkleProof.sol)

pragma solidity ^0.8.20;

/**
 * @dev These functions deal with verification of Merkle Tree proofs.
 *
 * The tree and the proofs can be generated using our
 * https://github.com/OpenZeppelin/merkle-tree[JavaScript library].
 * You will find a quickstart guide in the readme.
 *
 * WARNING: You should avoid using leaf values that are 64 bytes long prior to
 * hashing, or use a hash function other than keccak256 for hashing leaves.
 * This is because the concatenation of a sorted pair of internal nodes in
 * the Merkle tree could be reinterpreted as a leaf value.
 * OpenZeppelin's JavaScript library generates Merkle trees that are safe
 * against this attack out of the box.
 */
library MerkleProof {
    /**
     *@dev The multiproof provided is not valid.
     */
    error MerkleProofInvalidMultiproof();

    /**
     * @dev Returns true if a `leaf` can be proved to be a part of a Merkle tree
     * defined by `root`. For this, a `proof` must be provided, containing
     * sibling hashes on the branch from the leaf to the root of the tree. Each
     * pair of leaves and each pair of pre-images are assumed to be sorted.
     */
    function verify(bytes32[] memory proof, bytes32 root, bytes32 leaf) internal pure returns (bool) {
        return processProof(proof, leaf) == root;
    }

    /**
     * @dev Calldata version of {verify}
     */
    function verifyCalldata(bytes32[] calldata proof, bytes32 root, bytes32 leaf) internal pure returns (bool) {
        return processProofCalldata(proof, leaf) == root;
    }

    /**
     * @dev Returns the rebuilt hash obtained by traversing a Merkle tree up
     * from `leaf` using `proof`. A `proof` is valid if and only if the rebuilt
     * hash matches the root of the tree. When processing the proof, the pairs
     * of leafs & pre-images are assumed to be sorted.
     */
    function processProof(bytes32[] memory proof, bytes32 leaf) internal pure returns (bytes32) {
        bytes32 computedHash = leaf;
        for (uint256 i = 0; i < proof.length; i++) {
            computedHash = _hashPair(computedHash, proof[i]);
        }
        return computedHash;
    }

    /**
     * @dev Calldata version of {processProof}
     */
    function processProofCalldata(bytes32[] calldata proof, bytes32 leaf) internal pure returns (bytes32) {
        bytes32 computedHash = leaf;
        for (uint256 i = 0; i < proof.length; i++) {
            computedHash = _hashPair(computedHash, proof[i]);
        }
        return computedHash;
    }

    /**
     * @dev Returns true if the `leaves` can be simultaneously proven to be a part of a Merkle tree defined by
     * `root`, according to `proof` and `proofFlags` as described in {processMultiProof}.
     *
     * CAUTION: Not all Merkle trees admit multiproofs. See {processMultiProof} for details.
     */
    function multiProofVerify(
        bytes32[] memory proof,
        bool[] memory proofFlags,
        bytes32 root,
        bytes32[] memory leaves
    ) internal pure returns (bool) {
        return processMultiProof(proof, proofFlags, leaves) == root;
    }

    /**
     * @dev Calldata version of {multiProofVerify}
     *
     * CAUTION: Not all Merkle trees admit multiproofs. See {processMultiProof} for details.
     */
    function multiProofVerifyCalldata(
        bytes32[] calldata proof,
        bool[] calldata proofFlags,
        bytes32 root,
        bytes32[] memory leaves
    ) internal pure returns (bool) {
        return processMultiProofCalldata(proof, proofFlags, leaves) == root;
    }

    /**
     * @dev Returns the root of a tree reconstructed from `leaves` and sibling nodes in `proof`. The reconstruction
     * proceeds by incrementally reconstructing all inner nodes by combining a leaf/inner node with either another
     * leaf/inner node or a proof sibling node, depending on whether each `proofFlags` item is true or false
     * respectively.
     *
     * CAUTION: Not all Merkle trees admit multiproofs. To use multiproofs, it is sufficient to ensure that: 1) the tree
     * is complete (but not necessarily perfect), 2) the leaves to be proven are in the opposite order they are in the
     * tree (i.e., as seen from right to left starting at the deepest layer and continuing at the next layer).
     */
    function processMultiProof(
        bytes32[] memory proof,
        bool[] memory proofFlags,
        bytes32[] memory leaves
    ) internal pure returns (bytes32 merkleRoot) {
        // This function rebuilds the root hash by traversing the tree up from the leaves. The root is rebuilt by
        // consuming and producing values on a queue. The queue starts with the `leaves` array, then goes onto the
        // `hashes` array. At the end of the process, the last hash in the `hashes` array should contain the root of
        // the Merkle tree.
        uint256 leavesLen = leaves.length;
        uint256 proofLen = proof.length;
        uint256 totalHashes = proofFlags.length;

        // Check proof validity.
        if (leavesLen + proofLen != totalHashes + 1) {
            revert MerkleProofInvalidMultiproof();
        }

        // The xxxPos values are "pointers" to the next value to consume in each array. All accesses are done using
        // `xxx[xxxPos++]`, which return the current value and increment the pointer, thus mimicking a queue's "pop".
        bytes32[] memory hashes = new bytes32[](totalHashes);
        uint256 leafPos = 0;
        uint256 hashPos = 0;
        uint256 proofPos = 0;
        // At each step, we compute the next hash using two values:
        // - a value from the "main queue". If not all leaves have been consumed, we get the next leaf, otherwise we
        //   get the next hash.
        // - depending on the flag, either another value from the "main queue" (merging branches) or an element from the
        //   `proof` array.
        for (uint256 i = 0; i < totalHashes; i++) {
            bytes32 a = leafPos < leavesLen ? leaves[leafPos++] : hashes[hashPos++];
            bytes32 b = proofFlags[i]
                ? (leafPos < leavesLen ? leaves[leafPos++] : hashes[hashPos++])
                : proof[proofPos++];
            hashes[i] = _hashPair(a, b);
        }

        if (totalHashes > 0) {
            if (proofPos != proofLen) {
                revert MerkleProofInvalidMultiproof();
            }
            unchecked {
                return hashes[totalHashes - 1];
            }
        } else if (leavesLen > 0) {
            return leaves[0];
        } else {
            return proof[0];
        }
    }

    /**
     * @dev Calldata version of {processMultiProof}.
     *
     * CAUTION: Not all Merkle trees admit multiproofs. See {processMultiProof} for details.
     */
    function processMultiProofCalldata(
        bytes32[] calldata proof,
        bool[] calldata proofFlags,
        bytes32[] memory leaves
    ) internal pure returns (bytes32 merkleRoot) {
        // This function rebuilds the root hash by traversing the tree up from the leaves. The root is rebuilt by
        // consuming and producing values on a queue. The queue starts with the `leaves` array, then goes onto the
        // `hashes` array. At the end of the process, the last hash in the `hashes` array should contain the root of
        // the Merkle tree.
        uint256 leavesLen = leaves.length;
        uint256 proofLen = proof.length;
        uint256 totalHashes = proofFlags.length;

        // Check proof validity.
        if (leavesLen + proofLen != totalHashes + 1) {
            revert MerkleProofInvalidMultiproof();
        }

        // The xxxPos values are "pointers" to the next value to consume in each array. All accesses are done using
        // `xxx[xxxPos++]`, which return the current value and increment the pointer, thus mimicking a queue's "pop".
        bytes32[] memory hashes = new bytes32[](totalHashes);
        uint256 leafPos = 0;
        uint256 hashPos = 0;
        uint256 proofPos = 0;
        // At each step, we compute the next hash using two values:
        // - a value from the "main queue". If not all leaves have been consumed, we get the next leaf, otherwise we
        //   get the next hash.
        // - depending on the flag, either another value from the "main queue" (merging branches) or an element from the
        //   `proof` array.
        for (uint256 i = 0; i < totalHashes; i++) {
            bytes32 a = leafPos < leavesLen ? leaves[leafPos++] : hashes[hashPos++];
            bytes32 b = proofFlags[i]
                ? (leafPos < leavesLen ? leaves[leafPos++] : hashes[hashPos++])
                : proof[proofPos++];
            hashes[i] = _hashPair(a, b);
        }

        if (totalHashes > 0) {
            if (proofPos != proofLen) {
                revert MerkleProofInvalidMultiproof();
            }
            unchecked {
                return hashes[totalHashes - 1];
            }
        } else if (leavesLen > 0) {
            return leaves[0];
        } else {
            return proof[0];
        }
    }

    /**
     * @dev Sorts the pair (a, b) and hashes the result.
     */
    function _hashPair(bytes32 a, bytes32 b) private pure returns (bytes32) {
        return a < b ? _efficientHash(a, b) : _efficientHash(b, a);
    }

    /**
     * @dev Implementation of keccak256(abi.encode(a, b)) that doesn't allocate or expand memory.
     */
    function _efficientHash(bytes32 a, bytes32 b) private pure returns (bytes32 value) {
        /// @solidity memory-safe-assembly
        assembly {
            mstore(0x00, a)
            mstore(0x20, b)
            value := keccak256(0x00, 0x40)
        }
    }
}


// File contracts/version3/Tournament.sol

// Original license: SPDX_License_Identifier: UNLICENSED
pragma solidity ^0.8.20;



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
