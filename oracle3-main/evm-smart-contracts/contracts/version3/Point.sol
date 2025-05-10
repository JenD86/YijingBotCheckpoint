// SPDX-License-Identifier: UNLICENSED
pragma solidity =0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/EIP712.sol";

error InvalidSignature();
error SignatureExpired();


contract Point is ERC20, EIP712, Ownable {
    using ECDSA for bytes32;

    /// _POINT = keccak256("Point(address to,uint256 amount,uint256 nonce,uint256 expiry)")
    bytes32 private constant _POINT =
        0x678f2cb88a4bd83e29010b05a361b4d7e1ea2f3e3c84951b05d162492f6d4e9c;
    
    mapping(address => uint256) public nonces;
    /// A list of Authorizers who given a signature to verify parameters
    mapping(address => bool) public authorizers;

    constructor(address initialOwner) EIP712("Point", "Version 1") ERC20("Point", "Point") Ownable(initialOwner) {}

    /**
        - @dev Event emitted when Authorizer role is set/removed
        - Related function: setAuthorizer()
    */
    event SetAuthorizer(address indexed account, bool isAuthorizer);

    event MintedWithNonce(address _signer, uint256 _amount);

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

    function mint(
        uint256 _amount,
        uint256 _expiry,
        bytes calldata _signature
    ) external {
        /// Validate signature's expiry
        if (block.timestamp > _expiry) revert SignatureExpired();

        /// Retrieve 'Signer' and verify authorization
        address sender = msg.sender;
        (address signer, uint256 nonce) = _getSigner(sender, _amount, _expiry, _signature);
        if (!authorizers[signer]) revert InvalidSignature();
        
        nonces[sender]++;
        _mint(sender, _amount);
        emit MintedWithNonce(signer, nonce);
    }


    function _getSigner(
        address _to, 
        uint256 _amount,
        uint256 _expiry,
        bytes calldata signature
    ) private view returns (address signer, uint256 nonce) {
        nonce = nonces[_to];
        signer = _hashTypedDataV4(
            keccak256(
                abi.encode(_POINT, _to, _amount, nonce, _expiry)
            )
        ).recover(signature);
    }
}