// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract JPFToken is ERC20, Ownable {
    // Token decimals (optional, defaults to 18 in ERC20)
    uint8 private constant _decimals = 18;

    // Initial supply in tokens (not wei)
    uint256 private constant INITIAL_SUPPLY = 1000000;

    constructor() ERC20("JPFToken", "JPF") Ownable(msg.sender) {
        // Mint initial supply to contract creator
        _mint(msg.sender, INITIAL_SUPPLY * (10 ** decimals()));
    }

    // Mint new tokens (only owner)
    function mint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
    }

    // Burn tokens from your own address
    function burn(uint256 amount) public {
        _burn(msg.sender, amount);
    }

    // Override decimals function (optional)
    function decimals() public pure override returns (uint8) {
        return _decimals;
    }
}
