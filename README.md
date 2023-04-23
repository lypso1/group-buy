# DEPLOYING A GROUP BUY SMART CONTRACT ON THE CELO BLOCKHAIN

## Table of Contents
- [Introduction](#introduction)
- [Prerequisites](#prerequisites)
- [Requirements](#requirements)
- [Tech stack](#tech-stack)
- [Learning outcomes](#learning-outcomes)
- [Building the smart contract](#building-the-smart-contract)
- [Building the frontend](#building-the-frontend)
- [Deploying to vercel](#deploying-to-vercel)
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
- [Ethers.js](https://docs.ethers.org/v5/)
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

Copy and save the contract address displayed in the terminal as we would need it in the frontend to interact with our smart contracts

## Building the Frontend
To develop the frontend of the website of our project, we will be using React. React is a javascript framework which is used to make websites. You first need to create a new react app. Your folder structure should look something like this:
```js
  - GroupBuy
     - hardhat
     - frontend
```
To create the `frontend` folder, make sure the terminal points to the `GroupBuy` folder and type:
```bash
  npx create-react-app frontend
```
Now to run the app, execute these commands in the terminal:
```bash
  cd frontend
  npm start
```

Now let's install [ethers.js](https://docs.ethers.org/v5/) library. Ethers.js library aims to be a complete and compact library for interacting with the Ethereum Blockchain and its ecosystem.

> Note : We install v5 specifically since the new v6 has breaking changes to the code.

```bash
npm install ethers@5
```
Now go to App.css file in the src folder and replace all the contents of this file with the following code, this would add some styling to your dapp.
```css
* {
  font-family: 'JetBrains Mono', monospace;
}

.main {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: center;
  padding: 6rem;
  min-height: 100vh;
  background-color: whitesmoke;
}

h1 {
  text-align: center;
  text-decoration: underline;
}
nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background-color: grey;
  padding: 5px 5%;
}
nav button {
  text-transform: capitalize;
  border: none;
  background-color: #282928;
  color: #f7f7f7;
  padding: 10px 15px;
  cursor: pointer;
}

.allGroupBuys {
  font-family: var(--font-mono);
  color: black;
  padding: 20px 5%;

}


.createGroupBuy {
  margin: 20px;
  display: flex;
  flex-wrap: wrap;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}
.createGroupBuy > div {
  display: flex;
  gap: 5px 0px;
  flex-direction: column;
}
.createGroupBuy > div > input {
  border: thin solid #5e5d5d;
  width: 350px;
  background: none;
  height: 40px;
  padding-left: 10px;
  font-size: 1rem
}




.createGroupBuyBtn {
  margin: 20px;
  padding: 10px 15px;
  color: white;
  background-color: #282928;
  border: none;
  cursor: pointer;
}

.backBtn {
  margin-top: 10px;
  padding: 10px;
  background-color: black;
  color: white;
  border: none;
}


.seeMoreBtn {
  margin: 10px;
  padding: 10px;
  background-color: green;
  color: white;
}

.placeOrderBtn {
  padding: 10px;
  margin-top: 10px;
  background-color: orange;
  color: white;
  border: none;
}

.withdrawFundsBtn {
  padding: 10px;
  margin-top: 10px;
  margin-left: 15px;
  background-color: red;
  color: white;
  border: none;
}

.paragraphText {
  font-family: var(--font-mono);
  margin: 5px;
  color: black;
}

.hyperlinkText {
  font-family: var(--font-mono);
  margin: 5px;
  color: blue;
  text-decoration: underline;
}

.modal {
  position: fixed; /* Stay in place */
  z-index: 1; /* Sit on top */
  left: 0;
  top: 0;
  width: 100%; /* Full width */
  height: 100%; /* Full height */
  background-color: rgba(0, 0, 0, 0.4); /* Semi-transparent black background */
  display: flex;
  justify-content: center;
  align-items: center;
}

/* Modal Content */
.modalContent {
  margin: auto;
  padding: 20px;
  border: 1px solid #888;
  border-radius: 5px;
  display: flex;
  align-items: center;
  box-shadow: 0 5px 8px 0 rgba(0, 0, 0, 0.2);
  background-color: #fefefe;
}

.modalText {
  margin-left: 14px;
  font-size: 24px;
}

.code {
  font-weight: 700;
  font-family: var(--font-mono);
}

.grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(25%, auto));
  width: var(--max-width);
  max-width: 100%;
}

.card {
  padding: 1rem 1.2rem;
  border-radius: var(--border-radius);
  background: rgba(var(--card-rgb), 0);
  border: 1px solid rgba(var(--card-border-rgb), 0);
  transition: background 200ms, border 200ms;
}

.card span {
  display: inline-block;
  transition: transform 200ms;
}

.card h2 {
  font-weight: 600;
  margin-bottom: 0.7rem;
}

.card p {
  margin: 0;
  opacity: 0.6;
  font-size: 0.9rem;
  line-height: 1.5;
  max-width: 30ch;
}

.center {
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
  padding: 4rem 0;
}

.center::before {
  background: var(--secondary-glow);
  border-radius: 50%;
  width: 480px;
  height: 360px;
  margin-left: -400px;
}

.center::after {
  background: var(--primary-glow);
  width: 240px;
  height: 180px;
  z-index: -1;
}

.center::before,
.center::after {
  content: '';
  left: 50%;
  position: absolute;
  filter: blur(45px);
  transform: translateZ(0);
}

.logo,
.thirteen {
  position: relative;
}

.thirteen {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 75px;
  height: 75px;
  padding: 25px 10px;
  margin-left: 16px;
  transform: translateZ(0);
  border-radius: var(--border-radius);
  overflow: hidden;
  box-shadow: 0px 2px 8px -1px #0000001a;
}

.thirteen::before,
.thirteen::after {
  content: '';
  position: absolute;
  z-index: -1;
}

/* Conic Gradient Animation */
.thirteen::before {
  animation: 6s rotate linear infinite;
  width: 200%;
  height: 200%;
  background: var(--tile-border);
}

/* Inner Square */
.thirteen::after {
  inset: 0;
  padding: 1px;
  border-radius: var(--border-radius);
  background: linear-gradient(
    to bottom right,
    rgba(var(--tile-start-rgb), 1),
    rgba(var(--tile-end-rgb), 1)
  );
  background-clip: content-box;
}

/* Enable hover only on non-touch devices */
@media (hover: hover) and (pointer: fine) {
  .card:hover {
    background: rgba(var(--card-rgb), 0.1);
    border: 1px solid rgba(var(--card-border-rgb), 0.15);
  }

  .card:hover span {
    transform: translateX(4px);
  }
}

@media (prefers-reduced-motion) {
  .thirteen::before {
    animation: none;
  }

  .card:hover span {
    transform: none;
  }
}

/* Mobile */
@media (max-width: 700px) {
  .content {
    padding: 4rem;
  }

  .grid {
    grid-template-columns: 1fr;
    margin-bottom: 120px;
    max-width: 320px;
    text-align: center;
  }

  .card {
    padding: 1rem 2.5rem;
  }

  .card h2 {
    margin-bottom: 0.5rem;
  }

  .center {
    padding: 8rem 0 6rem;
  }

  .center::before {
    transform: none;
    height: 300px;
  }

  .description {
    font-size: 0.8rem;
  }

  .description a {
    padding: 1rem;
  }

  .description p,
  .description div {
    display: flex;
    justify-content: center;
    position: fixed;
    width: 100%;
  }

  .description p {
    align-items: center;
    inset: 0 0 auto;
    padding: 2rem 1rem 1.4rem;
    border-radius: 0;
    border: none;
    border-bottom: 1px solid rgba(var(--callout-border-rgb), 0.25);
    background: linear-gradient(
      to bottom,
      rgba(var(--background-start-rgb), 1),
      rgba(var(--callout-rgb), 0.5)
    );
    background-clip: padding-box;
    backdrop-filter: blur(24px);
  }

  .description div {
    align-items: flex-end;
    pointer-events: none;
    inset: auto 0 0;
    padding: 2rem;
    height: 200px;
    background: linear-gradient(
      to bottom,
      transparent 0%,
      rgb(var(--background-end-rgb)) 40%
    );
    z-index: 1;
  }
}

/* Tablet and Smaller Desktop */
@media (min-width: 701px) and (max-width: 1120px) {
  .grid {
    grid-template-columns: repeat(2, 50%);
  }
}

@media (prefers-color-scheme: dark) {
  .vercelLogo {
    filter: invert(1);
  }

  .logo,
  .thirteen img {
    filter: invert(1) drop-shadow(0 0 0.3rem #ffffff70);
  }
}

@keyframes rotate {
  from {
    transform: rotate(360deg);
  }
  to {
    transform: rotate(0deg);
  }
}
```

Create a new folder under the src folder and name it `contracts`. In this folder we will copy and paste two `.json` files.
- The first file is the `GroupBuy.json` file. To find this file, open the `artifacts` folder in the `hardhat` directory created earlier, then open the `contracts` folder and then the `GroupBuy.sol` folder. Copy the `GroupBuy.json` file and paste it in the `contracts` folder created earlier in the src directory.

- The second file is the `GroupBuyProduct.json` file. To find this file, open the `artifacts` folder in the `hardhat` directory created earlier, then open the `contracts` folder and then the `GroupBuyProduct.sol` folder. Copy the `GroupBuyProduct.json` file and paste it in the `contracts` folder created earlier in the src directory.

- Next, open your `App.js` file in the src folder, this is where our code will be written. Delete all the code in this file as we won't be needing any of it for this tutorial.

We will be importing our contract's `abi` and setting our contract address which we copied from the terminal after deploying our `GroupBuy` smart contract. Replace `your_contract_address` with the contract address copied after deploying the `GroupBuy` smart contract.

Let's look at some of the variables that we use for this project. We have a variable `currentWalletAddress` to hold and store the user-connected MetaMask wallet address. All the group buy data will be stored in the `allGroupBuys` array variable. Then we also have an object `createGroupBuyFields` to store the user inputs when creating a group buy. The `activeGroupBuy` variable stores the current group buy that the user clicks into to see the details. Lastly, we have the `isLoading` and `loadedData` variables to display the loading dialog and dialog text when a process is ongoing.

```js
import { useEffect, useState } from 'react';
import './App.css';
import { ethers } from 'ethers';
import GroupBuy from './contracts/GroupBuy.json';
import GroupBuyProduct from './contracts/GroupBuyProduct.json';
  
const groupBuyAddress = "your_contract_address";

function App () {
  const [withdrawn, setWithdrawn] = useState(false);
  const [currentWalletAddress, setCurrentWalletAddress] = useState("No Address Linked");
  const [allGroupBuys, setAllGroupBuys] = useState(null);
  const [createGroupBuyFields, setGroupBuyFields] = useState({
    endTime: 0,
    price: 0,
    productName: "",
    productDescription: "",
  });
  const [activeGroupBuy, setGroupBuyToActive] = useState(null);
  const [connectWalletText, setConnectWalletText] = useState("Connect wallet");

  // whether or not to show the loading dialog
  const [isLoading, setIsLoading] = useState(false);

  // text data to display on loading dialog
  const [loadedData, setLoadedData] = useState("Loading...");
 
}
export default App;
```

Let’s move on to the main functions of the group buy application.

#### 1. `getProviderOrSigner` function
Explanation of this function is found in the comments
```js
/**
   * Returns a Provider or Signer object representing the Ethereum RPC with or without the
   * signing capabilities of metamask attached
   *
   * A `Provider` is needed to interact with the blockchain - reading transactions, reading balances, reading state, etc.
   *
   * A `Signer` is a special type of Provider used in case a `write` transaction needs to be made to the blockchain, which involves the connected account
   * needing to make a digital signature to authorize the transaction being sent. Metamask exposes a Signer API to allow your website to
   * request signatures from the user using Signer functions.
   *
   * @param {*} needSigner - True if you need the signer, default false otherwise
  */
  const getProviderOrSigner = async(needSigner = false) => {
    // A Web3Provider wraps a standard Web3 provider, which is
    // what MetaMask injects as window.ethereum into each page
    const provider = new ethers.providers.Web3Provider(window.ethereum);

    // MetaMask requires requesting permission to connect users accounts
    await provider.send("eth_requestAccounts", []);

    // Get the chainId of the current network connected on metamask
    // If user is not connected to the Celo Alfajores network, let them know and throw an error
    const { chainId } = await provider.getNetwork();
    if(chainId !== 44787) {
      alert("Change network to Celo Alfajores");
      new Error("Change network to Celo Alfajores");
    }
    if(needSigner) {
      // The MetaMask plugin also allows signing transactions to
      // send ether and pay to change state within the blockchain.
      // For this, you need the account signer...
      const signer = provider.getSigner();
      return signer;
    }
    return provider;
  }
```

#### 2. `connectWallet` function
Explanation of this function is found in the comments
```js
  /*
    connectWallet: Connects the MetaMask wallet
  */
  const connectWallet = async () => {
    try {
      // Get the signer which in our case is MetaMask, as well as the connected address
      // When used for the first time, it prompts the user to connect their wallet
      const signer = await getProviderOrSigner(true);
      const connectedAddress = await signer.getAddress();

      setCurrentWalletAddress(connectedAddress);
      setConnectWalletText("connected");
    } catch (error) {
      console.log(error);
    }
  }
```

#### 3. `getAllGroupBuys` function
Firstly, let's start off with the `getAllGroupBuys` function which will retrieve all group buys data from the blockchain. The first part of the function attempts to connect the user's MetaMask wallet and stores the user's wallet address in a variable. 

In order to call functions in the smart contract, we will need to create a contract instance of the group buy manager smart contract using the `ethers.Contract()` library function. The 3 parameters that are passed in as arguments are the group buy manager contract address(which was displayed in the terminal after we deployed the smart contract), the group buy manager ABI as well as the current signer. Once we have the contract instance, we can call the `groupBuyIDCounter` function from the group buy manager smart contract to get the number of stored group buy

Now that we have the number of stored group buys, we will need to call the `getGroupBuyInfo` function from the group buy manager smart contract to retrieve all the information of each group buy. The `getGroupBuyInfo` function takes in an index. It will then return an array of the group buy data such as productName, productDescription, endTime, and price. The data returned is stored in a new object variable `newGroupBuys` which is pushed into an array variable `groupBuyArray`

Lastly, in this function we need to set the `groupBuyArray` variable into the React state variable so that we can display the information needed in the web application later.
```js
  const getAllGroupBuys = async() => {
    try {
      const provider = await getProviderOrSigner();
      const groupBuyContract = new ethers.Contract(
        groupBuyAddress,
        GroupBuy.abi,
        provider
      )

      const groupBuyLength = await groupBuyContract.groupBuyIDCounter();
      let groupBuyArray = [];
      for(let i = 0; i < groupBuyLength.toNumber(); i++) {
        const groupBuy = await groupBuyContract.getGroupBuyInfo(i);
        const groupBuyAddress = await groupBuyContract.getGroupBuysAddress(i);
        
        let endTime = groupBuy.endTime.toNumber();
        let groupBuyState = groupBuy.groupBuyState.toNumber();
        let price = groupBuy.price;
        let productName = groupBuy.name;
        let productDescription = groupBuy.description;
        let sellerAddress = groupBuy.seller;

        let newGroupBuy = {
          endTime: endTime,
          price: (price / 1000000).toString(),
          seller: sellerAddress.toLowerCase(),
          groupBuyState: groupBuyState,
          productName: productName,
          productDescription: productDescription,
          groupBuyAddress,
          buyers: [],
        }
        groupBuyArray.push(newGroupBuy);
      }

      setAllGroupBuys(groupBuyArray);
    } catch(err) {
      console.log(err);
    }
  }
```

#### 4. `createGroupBuy` function
We will look at the createGroupBuy function. The first portion of the code checks for user input requirements to ensure that they are not empty, the price cannot be below zero and the duration of the group buy is at least 5 minutes.

First we will be calling the `createGroupBuy` function from the smart contract. The function has 4 parameters – `endTime`, `price`, `productName` and `productDescription`. The price that we are passing in the function needs to be converted to meet the same format as the CELO token, thus the `ethers.utils.parseUnits` functionality comes in handy. Next, we need to wait for the transaction to be finished before proceeding.

```js
  const createGroupBuy = async () => {
    try {
       //check if required fields are empty
       if (
        !createGroupBuyFields.price ||
        !createGroupBuyFields.endTime ||
        !createGroupBuyFields.productName ||
        !createGroupBuyFields.productDescription
      ) {
        return alert("Fill all the fields");
      }

      //check if fields meet requirements
      if (createGroupBuyFields.price < 0) {
        return alert("Price must be more than 0");
      }

      if (createGroupBuyFields.endTime < 5) {
        return alert("Duration must be more than 5 mins");
      }
      const signer = await getProviderOrSigner(true);

      const groupBuyContract = new ethers.Contract(
        groupBuyAddress,
        GroupBuy.abi,
        signer
      )
      
      const tx = await groupBuyContract.createGroupbuy(
        createGroupBuyFields.endTime * 60, // Converting minutes to seconds
        ethers.utils.parseUnits(createGroupBuyFields.price.toString(), 6), 
        createGroupBuyFields.productName,
        createGroupBuyFields.productDescription,
      )
      
      await tx.wait();
      
      // call getAllGroupBuys to refresh the current list
      await getAllGroupBuys();

    } catch (err) {
      console.log(err);
    }
  }
```

#### 5. `setActiveGroupBuy` function
The setActiveGroupBuy function is triggered when the user clicks on a specific group buy to view the details of it. The main purpose of this function is to call the group buy smart contract that the user clicks on. It will retrieve the list of all orders placed by any users and set the data into the React state variable to display the information to the user.

```js
  const setActiveGroupBuy = async(groupBuy) => {
    const signer = await getProviderOrSigner(true);

    //create contract instance
    const groupBuyContract = new ethers.Contract(
      groupBuy.groupBuyAddress,
      GroupBuyProduct.abi,
      signer
    );

    //get all current buyers(address)
    let allCurrentBuyers = await groupBuyContract.getAllOrders();

    //set current group buy to active and update the buyers field
    setGroupBuyToActive({
      ...groupBuy,
      buyers: allCurrentBuyers,
    });
  }
```

#### 6. `productOrder` function
Now let’s move on to the `productOrder` function. We will call the `placeOrder` function in the group buy smart contract. The `placeOrder` function in the smart contract does not take in any parameters. As usual, we will need to wait for the transaction to be completed.

```js
  const productOrder = async(groupBuy) => {
    try{
      const signer = await getProviderOrSigner(true);
      const groupBuyProductContract = new ethers.Contract(
        groupBuy.groupBuyAddress,
        GroupBuyProduct.abi,
        signer
      )

      const tx = await groupBuyProductContract.placeOrder({value: ethers.utils.parseEther(groupBuy.price)});
      await tx.wait();

      //get updated buyers
      //get all current buyers(address) and price(same for all)
      const allCurrentBuyers = await groupBuyProductContract.getAllOrders();
      //set current group buy to active
      setGroupBuyToActive({
        ...groupBuy,
        buyers: allCurrentBuyers,
      });

    } catch(err) {
      console.log(err)
    }
  }
```

#### 7. `withdraw` function
Lastly, we have the `withdraw` function. The function can only be triggered by the seller and only when the group buy duration has ended. As the withdraw function does not take in any parameter we can simply call it. Next, we wait for the transaction to be completed.

```js
  const withdraw = async(groupBuy) => {
    try{
      const signer = await getProviderOrSigner(true);
      const groupBuyProductContract = new ethers.Contract(
        groupBuy.groupBuyAddress,
        GroupBuyProduct.abi,
        signer
      );

      const tx = await groupBuyProductContract.withdrawFunds();
      await tx.wait();
      setWithdrawn(true);

      // console.log(tx);
    } catch(err) {
      console.log(err);
    }
  }
```

That's all for the frontend functions we will be using in this project. Now your `App.js` file should look like this

```js
import { useEffect, useState } from 'react';
import './App.css';
import { ethers } from 'ethers';
import GroupBuy from './contracts/GroupBuy.json';
import GroupBuyProduct from './contracts/GroupBuyProduct.json';
  
const groupBuyAddress = "0xF6FefB0f889C9b37741E05AFC220eFaB84a0b254";

function App() {
  const [withdrawn, setWithdrawn] = useState(false);
  const [currentWalletAddress, setCurrentWalletAddress] = useState("No Address Linked");
  const [allGroupBuys, setAllGroupBuys] = useState(null);
  const [createGroupBuyFields, setGroupBuyFields] = useState({
    endTime: 0,
    price: 0,
    productName: "",
    productDescription: "",
  });
  const [activeGroupBuy, setGroupBuyToActive] = useState(null);
  const [connectWalletText, setConnectWalletText] = useState("Connect wallet");
  
/**
   * Returns a Provider or Signer object representing the Ethereum RPC with or without the
   * signing capabilities of metamask attached
   *
   * A `Provider` is needed to interact with the blockchain - reading transactions, reading balances, reading state, etc.
   *
   * A `Signer` is a special type of Provider used in case a `write` transaction needs to be made to the blockchain, which involves the connected account
   * needing to make a digital signature to authorize the transaction being sent. Metamask exposes a Signer API to allow your website to
   * request signatures from the user using Signer functions.
   *
   * @param {*} needSigner - True if you need the signer, default false otherwise
  */
  const getProviderOrSigner = async(needSigner = false) => {
    // A Web3Provider wraps a standard Web3 provider, which is
    // what MetaMask injects as window.ethereum into each page
    const provider = new ethers.providers.Web3Provider(window.ethereum);

    // MetaMask requires requesting permission to connect users accounts
    await provider.send("eth_requestAccounts", []);

    // Get the chainId of the current network connected on metamask
    // If user is not connected to the Celo Alfajores network, let them know and throw an error
    const { chainId } = await provider.getNetwork();
    if(chainId !== 44787) {
      alert("Change network to Celo Alfajores");
      new Error("Change network to Celo Alfajores");
    }
    if(needSigner) {
      // The MetaMask plugin also allows signing transactions to
      // send ether and pay to change state within the blockchain.
      // For this, you need the account signer...
      const signer = provider.getSigner();
      return signer;
    }
    return provider;
  }

  /*
    connectWallet: Connects the MetaMask wallet
  */
  const connectWallet = async () => {
    try {
      // Get the signer which in our case is MetaMask, as well as the connected address
      // When used for the first time, it prompts the user to connect their wallet
      const signer = await getProviderOrSigner(true);
      const connectedAddress = await signer.getAddress();

      setCurrentWalletAddress(connectedAddress);
      setConnectWalletText("connected");
    } catch (error) {
      console.log(error);
    }
  }

  const getAllGroupBuys = async() => {
    try {
      const provider = await getProviderOrSigner();
      const groupBuyContract = new ethers.Contract(
        groupBuyAddress,
        GroupBuy.abi,
        provider
      )

      const groupBuyLength = await groupBuyContract.groupBuyIDCounter();
      let groupBuyArray = [];
      for(let i = 0; i < groupBuyLength.toNumber(); i++) {
        const groupBuy = await groupBuyContract.getGroupBuyInfo(i);
        const groupBuyAddress = await groupBuyContract.getGroupBuysAddress(i);
        
        let endTime = groupBuy.endTime.toNumber();
        let groupBuyState = groupBuy.groupBuyState.toNumber();
        let price = groupBuy.price;
        let productName = groupBuy.name;
        let productDescription = groupBuy.description;
        let sellerAddress = groupBuy.seller;

        let newGroupBuy = {
          endTime: endTime,
          price: (price / 1000000).toString(),
          seller: sellerAddress.toLowerCase(),
          groupBuyState: groupBuyState,
          productName: productName,
          productDescription: productDescription,
          groupBuyAddress,
          buyers: [],
        }
        groupBuyArray.push(newGroupBuy);
      }

      setAllGroupBuys(groupBuyArray);
    } catch(err) {
      console.log(err);
    }
  }

  const createGroupBuy = async () => {
    try {
       //check if required fields are empty
       if (
        !createGroupBuyFields.price ||
        !createGroupBuyFields.endTime ||
        !createGroupBuyFields.productName ||
        !createGroupBuyFields.productDescription
      ) {
        return alert("Fill all the fields");
      }

      //check if fields meet requirements
      if (createGroupBuyFields.price < 0) {
        return alert("Price must be more than 0");
      }

      if (createGroupBuyFields.endTime < 5) {
        return alert("Duration must be more than 5 mins");
      }
      const signer = await getProviderOrSigner(true);

      const groupBuyContract = new ethers.Contract(
        groupBuyAddress,
        GroupBuy.abi,
        signer
      )
      
      const tx = await groupBuyContract.createGroupbuy(
        createGroupBuyFields.endTime * 60, // Converting minutes to seconds
        ethers.utils.parseUnits(createGroupBuyFields.price.toString(), 6), 
        createGroupBuyFields.productName,
        createGroupBuyFields.productDescription,
      )
      
      await tx.wait();
      
      // call getAllGroupBuys to refresh the current list
      await getAllGroupBuys();

    } catch (err) {
      console.log(err);
    }
  }

  const setActiveGroupBuy = async(groupBuy) => {
    const signer = await getProviderOrSigner(true);

    //create contract instance
    const groupBuyContract = new ethers.Contract(
      groupBuy.groupBuyAddress,
      GroupBuyProduct.abi,
      signer
    );

    //get all current buyers(address)
    let allCurrentBuyers = await groupBuyContract.getAllOrders();

    //set current group buy to active and update the buyers field
    setGroupBuyToActive({
      ...groupBuy,
      buyers: allCurrentBuyers,
    });
  }

  const productOrder = async(groupBuy) => {
    try{
      const signer = await getProviderOrSigner(true);
      const groupBuyProductContract = new ethers.Contract(
        groupBuy.groupBuyAddress,
        GroupBuyProduct.abi,
        signer
      )

      const tx = await groupBuyProductContract.placeOrder({value: ethers.utils.parseEther(groupBuy.price)});
      await tx.wait();

      //get updated buyers
      //get all current buyers(address) and price(same for all)
      const allCurrentBuyers = await groupBuyProductContract.getAllOrders();
      //set current group buy to active
      setGroupBuyToActive({
        ...groupBuy,
        buyers: allCurrentBuyers,
      });

    } catch(err) {
      console.log(err)
    }
  }

  const withdraw = async(groupBuy) => {
    try{
      const signer = await getProviderOrSigner(true);
      const groupBuyProductContract = new ethers.Contract(
        groupBuy.groupBuyAddress,
        GroupBuyProduct.abi,
        signer
      );

      const tx = await groupBuyProductContract.withdrawFunds();
      await tx.wait();
      setWithdrawn(true);
      // console.log(tx);
    } catch(err) {
      console.log(err);
    }
  }

  const getGroupBuyState = (groupBuy) => {
    if(groupBuy.groupBuyState === 1) {
      return "Ended";
    }
    else return "Open";
  }

  const renderActiveGroupBuy = (groupBuy) => {
    const state = getGroupBuyState(groupBuy);
    const buyers = groupBuy.buyers;

    const isCurrentUserABuyer = groupBuy.buyers.includes(currentWalletAddress);
    
    return (
      <div className="activeGroupBuyContainer">
        <div>
          <div>
            <p className="paragraphText">
              Product Name: {groupBuy.productName || 0}
            </p>
            <p className="paragraphText">
              Product Description: {groupBuy.productDescription || 0}
            </p>
            <p className="paragraphText">Price: {groupBuy.price} CELO</p>
            {/* Starting price */}
            <p className="paragraphText">
              Seller: {groupBuy.seller}
            </p>
            <div style={{ display: "flex" }}>
              <p className="paragraphText">
                <span>Group buy Smart Contract Address: </span>
                <a
                  href={`https://alfajores.celoscan.io/address/${groupBuy.groupBuyAddress}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  {groupBuy.groupBuyAddress}
                </a>
              </p>
            </div>
              {groupBuy.groupBuyState === 0 && 
                <p className="paragraphText">
                  Ending in: {Math.round((groupBuy.endTime * 1000 - Date.now()) / 1000 / 60)}{" "} minutes
                </p>
              }
              <p className="paragraphText">Group Buy State: {state}</p>
            </div>
            <div>
              <h3>List of all Buyers</h3>
              {buyers.length > 0 ? (
                <ol>
                {buyers.map((buyer) => (
                  <li>{buyer.toLowerCase()}</li>
                ))}
                </ol>
              ) : (
                <p>No buyers available</p>
              )}
            </div>
          <div>
            {state === "Open" && !isCurrentUserABuyer && groupBuy.seller !== currentWalletAddress.toLowerCase() ? (
              <div>
                <button
                  className="placeOrderBtn"
                  onClick={() => productOrder(activeGroupBuy)}
                >
                  Place Order
                </button>
              </div>
            ) : null}
          </div>
          <button
            className="backBtn"
            onClick={() => setGroupBuyToActive(null)}
          >
            Go Back
          </button>
          {groupBuy.seller === currentWalletAddress.toLowerCase() && //only seller can withdraw funds
            state === "Ended" && //can only withdraw after group buy ends
            groupBuy.buyers.length > 0 &&
            withdrawn === false && ( //withdraw if there are buyers
              <button
                className="withdrawFundsBtn"
                onClick={() => withdraw(groupBuy)}
              >
                Withdraw Funds
              </button>
            )
          }
        </div>
      </div>
    )
  }

  useEffect(() => {
    getAllGroupBuys();
  }, []);

  return (
    <>
      <nav>
        <button onClick={connectWallet}>{connectWalletText}</button>
        <div>
          <p>Wallet Address: {currentWalletAddress}</p>
        </div>
      </nav>

      <h1>Group Buying Web App</h1>

      <div className="allGroupBuys">
        <h2> All Group Buys</h2>
        <div>
          {activeGroupBuy == null ? (
            <div>
              {allGroupBuys == null ? (
                <div>
                  No Group Buy product
                </div>
              ) : (
                <div>
                {allGroupBuys.map((groupBuy) => (
                  <div className="createGroupBuyContainer">
                    <p className="paragraphText">
                      Product Name: {groupBuy.name}
                    </p>
                    <p className="paragraphText">
                      Product Description: {groupBuy.productDescription}
                    </p>
                    <p className="paragraphText">
                      Price: {groupBuy.price || 0} CELO
                    </p>
                    <p className="paragraphText">
                      Seller Address: {groupBuy.seller}
                    </p>{" "}
                    {(() => {
                      if (groupBuy.groupBuyState === 0) {
                        return (
                          <p className="paragraphText">
                            Ending in: {Math.round((groupBuy.endTime * 1000 - Date.now()) / 1000 / 60)} minutes
                          </p>
                        );
                      }
                    })()}
                    <p className="paragraphText">Group buy State: {getGroupBuyState(groupBuy)}</p>
                    <button
                      className="seeMoreBtn"
                      onClick={() => {
                        setActiveGroupBuy(groupBuy);
                      }}
                    >
                      See More
                    </button>
                  </div>
                ))}
                </div>
              )}
            </div>
          ) : (
            <div>
              {renderActiveGroupBuy(activeGroupBuy)}
            </div>
          )}
        </div>

        <div className="createGroupBuy">
          <h2>Create Group buy</h2>

          <div className="name" style={{ margin: "20px" }}>
            <label>Product Name</label>
            <input
              type="text"
              placeholder="Enter your product name"
              onChange={(e) =>
                setGroupBuyFields({
                  ...createGroupBuyFields,
                  productName: e.target.value,
                })
              }
              value={createGroupBuyFields.productName}
            />
          </div>

          <div className="description" style={{ margin: "20px" }}>
            <label>Product Description</label>
            <input
              type="text"
              placeholder="Enter your product description"
              onChange={(e) =>
                setGroupBuyFields({
                  ...createGroupBuyFields,
                  productDescription: e.target.value,
                })
              }
              value={createGroupBuyFields.productDescription}
            />
          </div>

          <div className="price" style={{ margin: "20px" }}>
            <label>Set Price (CELO)</label>
            <input
              type="number"
              placeholder="Price"
              onChange={(e) =>
                setGroupBuyFields({
                  ...createGroupBuyFields,
                  price: parseFloat(e.target.value),
                })
              }
              value={createGroupBuyFields.price}
            />
          </div>

          <div className="duration" style={{ margin: "20px" }}>
            <label>Duration in Mins (Minimum of 5 minutes)</label>
            <input
              type="number"
              placeholder="End Time(mins)"
              onChange={(e) =>
                setGroupBuyFields({
                  ...createGroupBuyFields,
                  endTime: parseInt(e.target.value),
                })
              }
              value={createGroupBuyFields.endTime}
            />
          </div>

          <button
            type="button"
            className="createGroupBuyBtn"
            onClick={() => createGroupBuy()}
          >
            Create Group Buy
          </button>
        </div>
      </div>
    </>
  );
}

export default App;
```

That's all for the frontend. Your project should look somehting like this
![]()

Your GroupBuy dapp should work without any errors 🚀.

To test your project, you'll need two accounts created on metamask. To do this, read this [article](https://digitalpinas.com/create-metamask-account/#:~:text=How%20to%20create%20Additional%20Metamask%20Account%20on%20Browser,click%20%E2%80%9CCreate%E2%80%9D%20to%20have%20an%20additional%20Metamask%20account.) for more details.

After testing your dapp and checking that everything behaves correctly, upload your project to a new GitHub repository as this will be needed to deploy our dapp using vercel

## Deploying to Vercel
To deploy our dapp we will be using vercel. Vercel is the platform for frontend developers, providing the speed and reliability innovators need to create at the moment of inspiration. To get started;

1. Go to [Vercel](https://vercel.com/), click on the sign up button, fill select the appropriate options displayed and continue the sign up with your GitHub.
2. Click on Add New button, select Project from the dropdown menu,
3. If this is your first time using vercel, you'll need to install vercel in your Github account. To do this, click the Add Github Account dropdown and follow the prompt shown. This will automatically show all your repository in your Github account. Select your GroupBuy repo from the options given and import it
4. When configuring your new project, Vercel will allow you to customize your Root Directory. For this project, we will use the `frontend` directory. Click on the edit button to change the root directory to `frontend`.
5. Select the framework as `Create React App`
6. Click Deploy. This will take a while to complete.

Now you can see your deployed website by going to your dashboard, selecting your project, and copying the URL beneath domains!


## Conclusion
That’s it! Congratulations! You are done with the tutorial, in this tutorial have built a dapp using react, hardhat, solidity and the Celo blockchain, pushed your code to Github, and deployed it to Vercel! 🎉
