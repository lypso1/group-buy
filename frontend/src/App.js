import { useEffect, useState } from 'react';
import './App.css';
import { ethers } from 'ethers';
import GroupBuy from './contracts/GroupBuy.json';
import GroupBuyProduct from './contracts/GroupBuyProduct.json';
  
const groupBuyAddress = "0x3Fd077bAAD6417829dCB2Fce8AF4fE36782A7b34";

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
                      Product Name: {groupBuy.productName}
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