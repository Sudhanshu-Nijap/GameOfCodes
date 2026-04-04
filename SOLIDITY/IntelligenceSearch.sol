// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title IntelligenceSearch
 * @dev Manages search execution counts and billing for WhiteDUMP platforms.
 * First 3 searches per address are free, thereafter a fee in MegaETH is required.
 */
contract IntelligenceSearch {
    address public owner;
    uint256 public constant FREE_LIMIT = 3;
    uint256 public searchFee = 0.0005 ether; // Dynamic fee per search after limit

    mapping(address => uint256) public searchCounts;
    
    event SearchExecuted(address indexed user, uint256 currentCount, bool paid);
    event FeeUpdated(uint256 newFee);
    event FeesWithdrawn(address indexed owner, uint256 amount);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only the operator can execute this.");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    /**
     * @dev Executes a search and increments the user's counter.
     * Reverts if user has exceeded free limit and hasn't provided the fee.
     */
    function executeSearch() external payable {
        uint256 currentCount = searchCounts[msg.sender];
        bool needsPayment = currentCount >= FREE_LIMIT;

        if (needsPayment) {
            require(msg.value >= searchFee, "Insufficient MegaETH for search intelligence.");
        }

        searchCounts[msg.sender] = currentCount + 1;
        
        emit SearchExecuted(msg.sender, searchCounts[msg.sender], needsPayment);
    }

    /**
     * @dev Updates the search fee for users past the free limit.
     * @param _newFee The new fee in wei.
     */
    function updateFee(uint256 _newFee) external onlyOwner {
        searchFee = _newFee;
        emit FeeUpdated(_newFee);
    }

    /**
     * @dev Allows the owner to withdraw collected search fees.
     */
    function withdrawFees() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No fees available for withdrawal.");
        
        (bool success, ) = owner.call{value: balance}("");
        require(success, "Withdrawal failed.");
        
        emit FeesWithdrawn(owner, balance);
    }

    /**
     * @dev Returns the remaining free searches for an address.
     */
    function getRemainingFreeSearches(address _user) external view returns (uint256) {
        uint256 current = searchCounts[_user];
        if (current >= FREE_LIMIT) return 0;
        return FREE_LIMIT - current;
    }

    // Function to receive MegaETH directly
    receive() external payable {}
}
