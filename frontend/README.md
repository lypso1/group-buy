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

