// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Import SafeMath library to prevent integer overflow or underflow vulnerabilities
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

contract GroupBuyProduct {
    using SafeMath for uint256; // Use SafeMath library for uint256 arithmetic operations

    uint256 public endTime;
    uint256 public startTime;
    address payable[] public buyers; 
    uint256 public price; 
    address public seller; 
    string public constant productName; // Declare productName as constant
    string public constant productDescription; // Declare productDescription as constant
    
    enum GroupBuyState {
        OPEN,
        ENDED
    }
 
    event NewOrder(address indexed newBuyer); // Use indexed keyword for the event parameter to enable searching
    event WithdrawFunds();
    event GroupBuyClosed();
 
    constructor(
        address _seller,
        uint256 _endTime,
        uint256 _price,
        string memory _productName,
        string memory _productDescription
    ) {
        seller = _seller; 
        endTime = block.timestamp.add(_endTime); // Use SafeMath library to add uint256 values
        startTime = block.timestamp;  
        price = _price;  
        productName = _productName;
        productDescription = _productDescription;
    }
 
    function placeOrder() external payable returns (bool) {
        require(msg.sender != seller);
        require(getGroupBuyState() == GroupBuyState.OPEN);  
        require(hasCurrentBid(msg.sender) == false);
        require(msg.value >= price, "Invalid price sent");
        
        buyers.push(payable(msg.sender));
        emit NewOrder(msg.sender);
        return true;
    }

    function withdrawFunds() external returns (bool) {
        require(msg.sender == seller); // Add access control to restrict function to seller only

        require(getGroupBuyState() == GroupBuyState.ENDED);

        // get the amount sent to the contract for the purchase of the product
        uint256 amount = address(this).balance;

        (bool sent,) = seller.call{value: amount}("");
        require(sent, "Failed to withdraw amount");
        emit WithdrawFunds();
        emit GroupBuyClosed();
        return true;
    }

    function getGroupBuyState() public view returns (GroupBuyState) {
        if (block.timestamp >= endTime) return GroupBuyState.ENDED;
        return GroupBuyState.OPEN;
    }

    function hasCurrentBid(address buyer) public view returns (bool) {
        bool isBuyer = false;
        for (uint256 i = 0; i < buyers.length; i++) {
            if (buyers[i] == buyer) {
                isBuyer = true;
            }
        }
        return isBuyer;
    }
  
    function getAllOrders(uint256 startIndex, uint256 endIndex) // Add startIndex and endIndex parameters for pagination
        external
        view
        returns (address payable[] memory _buyers)
    {
        require(endIndex >= startIndex, "Invalid index range"); // Add input validation for parameters
        require(endIndex < buyers.length, "End index out of bounds"); // Add input validation for parameters

        address payable[] memory orders = new address payable[](endIndex - startIndex + 1);
        for (uint256 i = startIndex; i <= endIndex; i++) {
            orders[i - startIndex] = buyers[i];
        }
        return orders;
    }

    receive() external payable {}
}
