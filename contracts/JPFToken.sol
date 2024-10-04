// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract JPFToken is ERC20 {
    constructor(uint256 initialSupply, string tokenName, string tokenSymbol) {
        ERC20.init(tokenName, tokenSymbol)
        //_mint(msg.sender, initialSupply);
    }
}
