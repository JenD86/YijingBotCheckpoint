/// SPDX-License-Identifier: UNLICENSED
pragma solidity =0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract Charms is ERC20 {
    struct Distribution {
        address beneficiary;
        uint256 percentage;
    }

    /// Denominator value
    uint256 private constant DENOM = 10_000;

    /// Set MAX_CAP of totalSupply
    uint256 public immutable MAX_SUPPLY;

    constructor(
        uint256 maxSupply,
        Distribution[] memory info
    ) ERC20("$CHARMS Token", "$CHARMS") {
        MAX_SUPPLY = maxSupply;

        uint256 len = info.length;
        for (uint256 i; i < len; i++)
            _mint(
                info[i].beneficiary,
                (info[i].percentage * MAX_SUPPLY) / DENOM
            );
    }
}
