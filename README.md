# DEPLOYING A GROUP BUY SMART CONTRACT ON THE CELO BLOCKHAIN

## Table of Contents
- [Introduction](#introduction)
- [Prerequisites](#prerequisites)
- [Requirements](#requirements)
- [Tech stack](#tech-stack)
- [Learning outcomes](#learning-outcomes)
- [Building the smart contract](#building-the-smart-contract)
- [Building the frontend](#building-the-frontend)
- [Conclusion](#conclusion)


## Introduction
A group buy is a type of purchasing arrangement where a group of individuals pool their money together to buy a product or service in bulk. The goal of a group buy is to secure a better price for the product or service than what each individual would have paid if they had purchased it on their own. Typically, a group buy is organized by one person, who collects the funds from the participants and makes the purchase on behalf of the group. Once the product or service is received, it is then distributed among the participants according to the terms of the arrangement. Group buys are popular in various communities, such as online forums, social media groups, and cryptocurrency communities, where members have shared interests and can benefit from buying in bulk. One example of a group buy application is [WeBuy](https://www.webuysg.com/).

In this tutorial, we will be writing two smart contracts that allow multiple buyers to place orders in CELO. We will also be creating a group buying web application which provides us with an interface to interact with the smart contracts.

To successfully test out the web application, you will need to have three accounts in your MetaMask wallet. Each account should have at least 10



## Prerequisites
To follow along with this tutorial, you should have a basic understanding of:
1. React and web development.
2. Solidity.
3. The Celo blockchain.
4. The GitHub interface.

## Requirements
- Have the Metamask extension wallet installed and set up. If not, install [MetamaskExtensionWallet](https://metamask.io/)
- [Node.js](https://nodejs.org/) installed on your machine.
- An IDE such as [Vscode](https://code.visualstudio.com/) or [Sublime Text](https://www.sublimetext.com/).
- Command line or similar software installed.

## Tech Stack
We will use the following tools and languages in this tutorial
- [Hardhat](https://hardhat.org/)
- [Web3modal](https://web3modal.com/)
- [Vercel](https://vercel.com/)

## Learning Outcomes
By the end of this tutorial, you will be able to:
- Interact with multiple file smart contract compiled and deployed using hardhat
- Build and run a group buying web application

## Building the Smart Contract
For this tutorial we will be building two smart contracts – one for group buys called `GroupBuyProduct` and another as a manager for the group buys called `GroupBuy`. We will explain the use case of each smart contract individually.

To setup a Hardhat project, Open up a terminal and execute these commands

```bash
  mkdir GroupBuy
  cd GroupBuy
  mkdir hardhat
  cd hardhat
  npm init --yes
  npm install --save-dev hardhat
```

If you are a Windows user, you'll have to add one more dependency. so in the terminal, add the following command :
```bash
  npm install --save-dev @nomicfoundation/hardhat-toolbox
```

In the same directory where you installed Hardhat run:
```bash
npx hardhat
```
Make sure you select `Create a Javascript Project` and then follow the steps in the terminal to complete your Hardhat setup.

In the contracts folder, delete the Lock.sol file and create a two new files in the folder. The first file should be named `GroupBuy.sol` and the second file named `GroupBuyProduct.sol`.

### `GroupBuyProduct` Smart Contract
In this step, we focus on the functions and variables of the group buy smart contract. The group buy smart contract controls everything related to the individual group buy such as the placing of orders and the withdrawal of funds.

For this smart contract, we are expecting it to do the following:
Be able to store information regarding the group buy such as the end time, price, product name, and buyers.
The buyers are able to place orders using the smart contract provided they did not place one earlier.
The seller is able to withdraw funds after the group is closed.
The seller can only close the group buy after the end time has reached.

For this smart contract, we will be using the following variables.
- `endTime`: the timestamp indicating the ending time of the group buy
- `startTime`: the timestamp indicating the start time of the group buy
- `buyers`: array of buyers wallet address
- `price` : price of the product in CELO
- `seller` : the wallet address of the seller
- `productName` : the name of the product
- `productDescription` : the description of the product

Now that you know what variables will be used, we will be going through the functions in the smart contract.

#### 1. `constructor` function
The first function is the constructor which will be called when a new group is created on the frontend with the required input. This constructor function will add values to the variables that we mentioned earlier.
```solidity
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
```
#### 2. `getGroupBuyState` function
This function gets the current state of the group buy. It determines whether a group buy is open or closed by checking if the end time has passed. For this group buy, the seller cannot prematurely close a group buy so the only determining factor is the end time. If the end time has not passed, then it will still be considered open.
```solidity
    function getGroupBuyState() public view returns (GroupBuyState) {
        if (block.timestamp >= endTime) return GroupBuyState.ENDED;
        return GroupBuyState.OPEN;
    }
```
#### 3. `hasCurrentBid` function.
This function will check if the buyer has a current order. This is to prevent duplicate orders for the group buy. The function traverses the array of the buyers’ wallet addresses and determines if any of them matches the address that was passed into the function. If there is a match, it will return true. Otherwise, it will return false.
```solidity
    function hasCurrentBid(address buyer) public view returns (bool) {
        bool isBuyer = false;
        for (uint256 i = 0; i < buyers.length; i++) {
            if (buyers[i] == buyer) {
                isBuyer = true;
            }
        }
        return isBuyer;
    }
```

#### 4. `getAllOrders` function
The function that we will be looking at next is the getAllOrders function where it will retrieve all the buyers’ wallet addresses. It will return all the buyer’s wallet addresses for that group buy.
```solidity
    function getAllOrders()
        external
        view
        returns (address payable[] memory _buyers)
    {
        return buyers;
    }
```

#### 5. `placeOrder` function
The next function is the placeOrder function which will be called when an order is placed. When this function is called, it must pass 3 checks. The first is that the buyer wallet address calling the function must not be the same as the seller. This is to prevent the seller from placing orders and inflating order numbers. The second is that the group buy must be open and it should not accept orders when it is closed. The third is that the user placing the order must not already have an order in place to prevent duplicate orders. Once these 3 checks have passed, the function will then proceed to transfer the CELO from the buyer wallet address and transfer it to the group buy smart contract. Once the transfer is successful, it will then add the buyer’s wallet address to the array of buyers’ wallet addresses and emit the `NewOrder` event.

An event is used to record actions that occur in a smart contract. These events are stored and can be viewed on the blockchain. For our smart contract, we have 3 events and they are `NewOrder`, `WithdrawFunds` and `GroupBuyClosed`.
```solidity
    function placeOrder() external payable returns (bool) {
        require(msg.sender != seller);
        require(getGroupBuyState() == GroupBuyState.OPEN);  
        require(hasCurrentBid(msg.sender) == false);
        require(msg.value >= price, "Invalid price sent");
        
        buyers.push(payable(msg.sender));
        emit NewOrder(msg.sender);
        return true;
    }
```

#### 6. `withdrawFunds` function
This function is called when the group buy has ended and the seller wants to withdraw the funds. The function will first check if the group buy has indeed ended and if the wallet address of the request sender matches the seller’s wallet address. If both checks pass, then it will transfer the CELO to the seller and emit the events `WithdrawFunds` and `GroupBuyClosed` which will record the end of the group buy.
```solidity
    function withdrawFunds() external returns (bool) {
        require(getGroupBuyState() == GroupBuyState.ENDED);

        // get the amount sent to the contract for the purchase of the product
        uint256 amount = address(this).balance;

        (bool sent,) = seller.call{value: amount}("");
        require(sent, "Failed to withdraw amount");
        emit WithdrawFunds();
        emit GroupBuyClosed();
        return true;
    }
```

Finally, to allow for adding more CELO deposits to the smart contract, we need to add some special functions. For that, let's add these two functions:
```solidity
    receive() external payable {}
    fallback() external payable {}
```

That is all we would need for the `GroupBuyProduct` smart contract. Your file should look like this
```solidity
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
        require(msg.sender != seller);
        require(getGroupBuyState() == GroupBuyState.OPEN);  
        require(hasCurrentBid(msg.sender) == false);
        require(msg.value >= price, "Invalid price sent");
        
        buyers.push(payable(msg.sender));
        emit NewOrder(msg.sender);
        return true;
    }


    function withdrawFunds() external returns (bool) {
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
  
    function getAllOrders()
        external
        view
        returns (address payable[] memory _buyers)
    {
        return buyers;
    }

    receive() external payable {}
    fallback() external payable {}
}
```


### `GroupBuy` Smart Contract
For this step, we will look at the group buy manager smart contract to see how it works.

To see how the group buy manager smart contract looks like, check out the 'working code' at the end of this step.

For the group buy manager, we are expecting it to do the following:
- Create group buys.
- Retrieve the list of group buys smart contract addresses.
- Retrieve information about a group buy based on a list of group smart contract addresses.

Let's take a look at the variables that we will be using for this smart contract.
- `groupBuyIDCounter` : this represents the counter that is used as the group buy ID. It will increment every time a group bnuy is created
- `groupBuys` : an array that contains the group buy smart contract reference object. These are the objects that will be used to interact with the smart contract
- `groupBuysIDs` : this is a map that is mapping the address of the group buy smart contract to its group buy ID

Next, we will go through the functions that are available for this group buy smart contract.

#### 1. `createGroupBuy` function
The first function is `createGroupBuy` and as the name suggests it is called by the user when creating a group buy. This function will take in 4 inputs which are necessary to set up the group buy smart contract. There are 2 checks that need to be done before a group buy smart contract is created. The first is that the price is more than 0. For prices, we will not accept zero or negative values as prices are usually not within that range. The second check is that the group buy end time is longer than 5 minutes from the current time. This would ensure that there is enough time for the group buy order to be placed. Once the checks are done, it will get the new group buy ID from the counter and then it will increment that counter to prevent repeated values. After that, the group buy smart contract will be created and it will be added to the group buy array and it will map the address of the new group buy smart contract to the allocated ID.

```solidity
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
```

#### 2. `getGroupBuyInfo` function
This function takes in an index and returns information of a list of group buys. Information provided will include name, description, price, seller address, the end time and the current state of the group buy.

The function will us the index provided to get access to the information of a particular group buy and assigning them to local variables created. After assigning the information to the variables, these various variables will be returned by the function to the caller.

```solidity
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
```

#### 3. `getGroupBuysAddress` function
This function takes in the index as an argument. It uses the index to get the address of a particular group buy from the `groupBuys` mapping. This address is returned by the function to the caller.

```solidity
    function getGroupBuysAddress(uint256 index) external view returns (address) {
        return address(groupBuys[index]);
    }
```

That is all we would need for the `GroupBuy` smart contract. Your file should look like this
```solidity
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
```

### Deploying The Smart Contract
To deploy our smart contract, we will need to install some packages. Let's install dotenv package to be able to import the env file and use it in our config.

Open up a terminal pointing at hardhat-tutorial directory and execute this command
```bash
  npm install dotenv
```
Now create a `.env` file in the hardhat folder and add the following lines.

Add your mnemonic into the file, like this:
```js
MNEMONIC="YOUR_SECRET_RECOVERY_PHRASE"
```

In this case, we are using a mnemonic from an account created on Metamask. You can copy it from your Metamask. In Metamask, you can click on the identicon, go to settings, select "Security & Privacy", click on “Reveal Secret Recovery Phrase”, and copy that phrase.

Let's deploy the contract to the celo alfajores network. In the scripts folder, replace the code in the `deploy.js` file with the following
```js
const hre = require("hardhat");

async function main() {
  const GroupBuy = await hre.ethers.getContractFactory("GroupBuy");
  const groupBuy = await GroupBuy.deploy();

  await groupBuy.deployed();

  console.log(`Deployed to ${groupBuy.address}`);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
```

Now open the `hardhat.config.js` file, we will set-up the celo network here so that we can deploy our contract to the Celo alfajores network. Replace all the lines in the hardhat.config.js file with the following code
```js
require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config({ path: ".env" });

 module.exports = {
  solidity: "0.8.17",
  networks: {
    alfajores: {
      url: "https://alfajores-forno.celo-testnet.org",
      accounts: {
        mnemonic: process.env.MNEMONIC,
        path: "m/44'/60'/0'/0",
      },
      chainId: 44787,
    },
  },
};
```

To compile the contract, open up a terminal pointing at hardhat directory and execute this command
```bash
  npx hardhat compile
```

You should get a message in the terminal like this
- image of terminal

To deploy, open up a terminal pointing at hardhat directory and execute this commands
```bash
  npx hardhat run scripts/deploy.js --network alfajores
```







