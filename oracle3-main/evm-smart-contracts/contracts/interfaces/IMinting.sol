/// SPDX-License-Identifier: UNLICENSED
pragma solidity =0.8.20;

/**
  @title IMinting Contract
  @dev Interface for a contract that enables token minting.
*/
interface IMinting {
    /** 
        @notice Mint an `amount` of tokens to `to`
        @dev
        - Params:
            - to          The address that will receive the tokens
            - amount      The number of tokens to be minted.
        
        Note: 
        - Proper handling of minting logic and other requirements must be ensured before invoking this function.
    */
    function mint(address to, uint256 amount) external;
}
