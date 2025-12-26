// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title YDToken
 * @dev ERC20 token implementation for YDToken
 * Exchange rate: 0.0001 ETH = 1 YDToken (1 ETH = 10000 YDToken)
 */
contract YDToken is ERC20, ERC20Burnable, Ownable, Pausable {
    // Exchange rate and initial supply
    uint256 public constant EXCHANGE_RATE = 10000; // 1 ETH = 10000 YDToken
    uint256 public constant INITIAL_SUPPLY = 1000000 * 10 ** 18; // 1,000,000 YDToken

    // Purchase limits
    uint256 public maxPurchaseLimit = 100 ether; // Max 100 ETH per purchase
    uint256 public minPurchaseLimit = 0.001 ether; // Min 0.001 ETH per purchase

    // EVENTS
    event YDTokenPurchased(
        address indexed buyer,
        uint256 ethAmount,
        uint256 tokenAmount
    );
    event YDTokenSold(
        address indexed seller,
        uint256 ethAmount,
        uint256 tokenAmount
    );
    event PurchaseLimitUpdated(uint256 minLimit, uint256 maxLimit);

    // Constructor to mint initial supply to deployer
    constructor() ERC20("YDToken", "YD") Ownable(msg.sender) {
        // Mint initial supply to deployer
        _mint(msg.sender, INITIAL_SUPPLY);
    }

    /**
     * @dev use ETH to buy YDToken
     */
    function buyYDToken() public payable whenNotPaused {
        // Require non-zero ETH amount
        require(msg.value > 0, "ETH amount must be greater than 0");
        require(msg.value >= minPurchaseLimit, "Below minimum purchase limit");
        require(msg.value <= maxPurchaseLimit, "Exceeds maximum purchase limit");

        // Calculate token amount to buy
        uint256 tokenAmount = msg.value * EXCHANGE_RATE;

        // Check contract has enough tokens
        require(
            balanceOf(address(this)) >= tokenAmount,
            "Not enough YDToken in contract"
        );

        // Transfer tokens to buyer
        _transfer(address(this), msg.sender, tokenAmount);

        // Emit purchase event
        emit YDTokenPurchased(msg.sender, msg.value, tokenAmount);
    }

    /**
     * @dev sell YDToken to get ETH
     * @param tokenAmount The amount of YDToken to sell
     */
    function sellYDToken(uint256 tokenAmount) public whenNotPaused {
        // Require non-zero token amount
        require(tokenAmount > 0, "YDToken amount must be greater than 0");

        // Check buyer has enough tokens
        require(
            balanceOf(msg.sender) >= tokenAmount,
            "Not enough YDToken to sell"
        );

        // Calculate ETH amount to return
        uint256 ethAmount = tokenAmount / EXCHANGE_RATE;
        require(
            address(this).balance >= ethAmount,
            "Not enough ETH in contract"
        );

        // Transfer tokens from seller to contract
        _transfer(msg.sender, address(this), tokenAmount);

        // Transfer ETH to seller
        (bool success, ) = msg.sender.call{value: ethAmount}("");
        require(success, "ETH transfer failed");

        // Emit sale event
        emit YDTokenSold(msg.sender, ethAmount, tokenAmount);
    }

    /**
     * @dev Owner can withdraw ETH from contract
     */
    function withdrawETH() external onlyOwner {
        // Transfer ETH to owner
        (bool success, ) = owner().call{value: address(this).balance}("");
        require(success, "ETH transfer failed");
    }

    /**
     * @dev Set purchase limits (only owner)
     */
    function setPurchaseLimits(
        uint256 _minLimit,
        uint256 _maxLimit
    ) external onlyOwner {
        require(_minLimit < _maxLimit, "Min must be less than max");
        minPurchaseLimit = _minLimit;
        maxPurchaseLimit = _maxLimit;
        emit PurchaseLimitUpdated(_minLimit, _maxLimit);
    }

    /**
     * @dev Pause token trading (only owner)
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @dev Unpause token trading (only owner)
     */
    function unpause() external onlyOwner {
        _unpause();
    }

    /**
     * @dev Calculate YDToken amount for given ETH amount
     */
    function getTokenAmount(uint256 ethAmount) public pure returns (uint256) {
        return ethAmount * EXCHANGE_RATE;
    }

    /**
     * @dev Calculate ETH amount for given YDToken amount
     */
    function getETHAmount(uint256 tokenAmount) public pure returns (uint256) {
        return tokenAmount / EXCHANGE_RATE;
    }

    /**
     * @dev Fallback function to accept ETH
     */
    receive() external payable {}
}
