// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;
 
import "./GroupBuyProduct.sol"; // Importing GroupBuyProduct contract
 
contract GroupBuy {
    uint256 public groupBuyIDCounter = 0; // Counter to keep track of group buy IDs
    GroupBuyProduct[] public groupBuys; // Array of GroupBuyProduct contracts

    mapping(address => uint256) public groupBuysIDs; // Mapping of GroupBuyProduct contract addresses to their IDs
    
    // Function to create a new group buy
    function createGroupbuy(
        uint256 _endTime, // The timestamp of the end time for the group buy
        uint256 _price, // The price of the product in the group buy
        string calldata _productName, // The name of the product in the group buy
        string calldata _productDescription // The description of the product in the group buy
    ) external returns (bool) {
        // Require that the price is greater than 0 and the end time is at least 5 minutes from now
        require(_price > 0, "Invalid price set");
        require(_endTime > 5, "Minimum time for each product is 5 minutes");

        // Create a new GroupBuyProduct contract with the given parameters
        GroupBuyProduct groupBuy = new GroupBuyProduct(
            msg.sender,
            _endTime,
            _price,
            _productName,
            _productDescription
        );
        
        // Add the new contract to the array of group buys and increment the counter
        groupBuys.push(groupBuy);
        groupBuysIDs[address(groupBuy)] = groupBuyIDCounter;
        groupBuyIDCounter ++;
        
        // Return true to indicate success
        return true;
    }
 
    // Function to get the address of a GroupBuyProduct contract by its index in the array
    function getGroupBuysAddress(uint256 index) external view returns (address) {
        return address(groupBuys[index]);
    }

    // Function to get information about a GroupBuyProduct contract by its index in the array
    function getGroupBuyInfo(uint256 index) external view
        returns (
            string memory name,
            string memory description,
            uint256 price,
            address seller,
            uint256 endTime,
            uint256 groupBuyState
        )
    {
        // Get the product name, description, price, seller, end time, and state from the specified contract
        name = groupBuys[index].productName();
        description = groupBuys[index].productDescription();
        price = groupBuys[index].price();
        seller = groupBuys[index].seller();
   	    endTime = groupBuys[index].endTime();
        groupBuyState = uint256(
            groupBuys[index].getGroupBuyState()
        );
 
        // Return the information as a tuple
        return (
            name,
            description,
            price,
            seller,
            endTime,
            groupBuyState
        );
    }
}
