// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;
 
import "./GroupBuyProduct.sol";
 
contract GroupBuy {
    uint256 public groupBuyIDCounter = 0;
    GroupBuyProduct[] public groupBuys;

    mapping(address => uint256) public groupBuysIDs;
    
    function createGroupbuy(
        uint256 _endTime,
        uint256 _price,
        string calldata _productName,
        string calldata _productDescription 
    ) external returns (bool) {
        require(_price > 0, "Invalid price set");
        require(_endTime > 5, "Minimum time for each product is 5 minutes");

        GroupBuyProduct groupBuy = new GroupBuyProduct(
            msg.sender,
            _endTime,
            _price,
            _productName,
            _productDescription
        );
        groupBuys.push(groupBuy);
        groupBuysIDs[address(groupBuy)] = groupBuyIDCounter;
        groupBuyIDCounter ++;
        return true;
    }
 
    function getGroupBuysAddress(uint256 index) external view returns (address) {
        return address(groupBuys[index]);
    }

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
        name = groupBuys[index].productName();
        description = groupBuys[index].productDescription();
        price = groupBuys[index].price();
        seller = groupBuys[index].seller();
   	    endTime = groupBuys[index].endTime();
        groupBuyState = uint256(
            groupBuys[index].getGroupBuyState()
        );
 
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