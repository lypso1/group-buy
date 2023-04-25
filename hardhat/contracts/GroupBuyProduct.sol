// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

contract GroupBuyProduct {
    uint256 public endTime;
    uint256 public startTime;
    address payable[] public buyers;
    uint256 public price;
    address public seller;
    string public productName;
    string public productDescription;

    enum GroupBuyState {
        OPEN,
        ENDED
    }

    event NewOrder(address newBuyer);
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
        endTime = block.timestamp + _endTime;
        startTime = block.timestamp;
        price = _price;
        productName = _productName;
        productDescription = _productDescription;
    }

    function placeOrder() external payable returns (bool) {
        require(msg.sender != seller, "Seller cannot participate");
        require(getGroupBuyState() == GroupBuyState.OPEN, "Group buy has ended");
        require(!hasCurrentBid(msg.sender), "Already participated in the group buy");
        require(msg.value >= price, "Invalid price sent");

        buyers.push(payable(msg.sender));
        emit NewOrder(msg.sender);
        return true;
    }

    function withdrawFunds() external returns (bool) {
        require(getGroupBuyState() == GroupBuyState.ENDED, "Group buy has not ended yet");

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
        for (uint256 i = 0; i < buyers.length; i++) {
            if (buyers[i] == buyer) {
                return true;
            }
        }
        return false;
    }

    function getAllOrders() external view returns (address payable[] memory _buyers) {
        return buyers;
    }

    receive() external payable {}

    fallback() external payable {}
}
