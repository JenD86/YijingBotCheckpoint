/// SPDX-License-Identifier: UNLICENSED
pragma solidity =0.8.20;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

error InvalidSignature();
error SignatureExpired();

contract Convert is EIP712, Ownable {
    using ECDSA for bytes32;
    using SafeERC20 for IERC20;

    /// _CONVERT = keccak256("Convert(address pool,address to,address token,uint256 amount,uint256 nonce,uint256 expiry)")
    bytes32 private constant _CONVERT =
        0x755c50e0a6750d4c1e91e4ce232eed5d8bae3801fac4d28e665b81bcf28259ef;

    /// Conversion requests per `account`
    mapping(address => uint256) public nonces;

    /// A list of Authorizers who given a signature to verify parameters
    mapping(address => bool) public authorizers;

    /**
        - @dev Event emitted when Authorizer role is set/removed
        - Related function: setAuthorizer()
    */
    event SetAuthorizer(address indexed account, bool isAuthorizer);

    /**
        - @dev Event emitted when `msg.sender` successfully converted "points" to "tokens"
        - Related function: convert()
    */
    event Converted(
        address indexed authorizer,
        address indexed to,
        uint256 indexed nonce,
        address token,
        uint256 amount
    );

    constructor(
        address initOwner
    ) EIP712("Convert Points to Tokens", "Version 1") Ownable(initOwner) {}

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
        @notice Convert "points" to "tokens"
        @dev
        - Requirements:
            - Caller can be ANY
            - Parameters should be valid
            - Signature MUST be provided by Authorizer
            - Ensure this contract has been approved an amount of allowance
        - Params:
            - pool            Address of the pool distribution
            - token           Address of the token contract that receives a minting request
            - amount          The number of tokens to be minted
            - expiry          Signature's expiring time
            - signature       Signature provided by Authorizer
    */
    function convert(
        address pool,
        address token,
        uint256 amount,
        uint256 expiry,
        bytes calldata signature
    ) external {
        /// Validate signature's expiry
        if (block.timestamp > expiry) revert SignatureExpired();

        /// Retrieve 'Signer' and verify authorization
        address sender = msg.sender;
        (address signer, uint256 nonce) = _getSigner(
            pool,
            sender,
            token,
            amount,
            expiry,
            signature
        );
        if (!authorizers[signer]) revert InvalidSignature();
        nonces[sender]++;

        /// Call to transfer an `amount` of `token`
        /// Ensure this contract has been approved an amount of allowance
        IERC20(token).safeTransferFrom(pool, sender, amount);

        emit Converted(signer, sender, nonce, token, amount);
    }

    function _getSigner(
        address pool,
        address to,
        address token,
        uint256 amount,
        uint256 expiry,
        bytes calldata signature
    ) private view returns (address signer, uint256 nonce) {
        nonce = nonces[to];
        signer = _hashTypedDataV4(
            keccak256(
                abi.encode(_CONVERT, pool, to, token, amount, nonce, expiry)
            )
        ).recover(signature);
    }
}
