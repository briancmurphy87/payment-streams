const { expect } = require("chai");
const { ethers } = require("hardhat");

// var log = require('console-log-level')({ level: 'info' })

// `describe` is a Mocha function that allows you to organize your tests. It's
// not actually needed, but having your tests organized makes debugging them
// easier. All Mocha functions are available in the global scope.
// `describe` recieves the name of a section of your test suite, and a callback.
// The callback must define the tests of that section. This callback can't be
// an async function.
describe("Streaming Contract", () => {

  let owner;
  let sender;
  let recipient1, addrs;


  beforeEach(async () => {
    // Get the ContractFactory and Signers here.
    Streaming = await ethers.getContractFactory("Streaming");
    [owner, sender, recipient1, recipient2, ...addrs] = await ethers.getSigners();

    streamingContract = await Streaming.deploy();

    await streamingContract.deployed();
  });

  // You can nest describe calls to create subsections.
  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await streamingContract.owner()).to.equal(owner.address);
    });
  });

  describe("Create Stream", function () {

    let deposit;
    let now;
    let startTimestamp;
    let stopTimestamp;

    beforeEach(function () {
      deposit = 1e9;
      now = new Date();
      startTimestamp = Math.floor(now.getTime() / 1000) + 100;
      stopTimestamp = startTimestamp + 1000;
    });

    describe("Revert scenarios", function() {

      it("should fail when deposit is not sufficient", async function () {
        await expect(
          streamingContract.connect(sender).createStream(recipient1.address, deposit, startTimestamp,
            stopTimestamp, { "value": deposit - 10 })
        ).to.be.revertedWith("Deposit not received");
      });
  
      it("should fail when recipient address is zero-address", async function () {
        const zeroAddress = "0x0000000000000000000000000000000000000000";
        await expect(
          streamingContract.connect(sender).createStream(zeroAddress, deposit, startTimestamp,
            stopTimestamp, { "value": deposit })
        ).to.be.revertedWith("Stream to the zero address");
      });
  
      it("should fail when sender and recipient are same", async function () {
        await expect(
          streamingContract.connect(sender).createStream(sender.address, deposit, startTimestamp,
            stopTimestamp, { "value": deposit })
        ).to.be.revertedWith("Stream to the caller");
      });
  
      it("should fail when deposit is 0", async function () {
        await expect(
          streamingContract.connect(sender).createStream(recipient1.address, deposit, startTimestamp,
            stopTimestamp, { "value": 0 })
        ).to.be.revertedWith("Deposit not received");
      });
  
      it("should fail when start time has already passed before creation of stream", async function () {
        startTimestamp = startTimestamp - 1000;
        await expect(
          streamingContract.connect(sender).createStream(recipient1.address, deposit, startTimestamp,
            stopTimestamp, { "value": deposit })
        ).to.be.revertedWith("Start time before block timestamp");
      });
  
      it("should fail when stop time is less than start time", async function () {
        let stopTimestamp = startTimestamp - 1;
        await expect(
          streamingContract.connect(sender).createStream(recipient1.address, deposit, startTimestamp,
            stopTimestamp, { "value": deposit })
        ).to.be.revertedWith("Stop time before start time");
      });
  
      it("should fail when deposit is not a multiple of duration", async function () {
        let startTimestamp = Math.floor(now.getTime() / 1000) + 100;
        let stopTimestamp = startTimestamp + 1000;
        let deposit = (stopTimestamp - startTimestamp) * 10 + 1
  
        await expect(
          streamingContract.connect(sender).createStream(recipient1.address, deposit, startTimestamp,
            stopTimestamp, { "value": deposit })
        ).to.be.revertedWith("Deposit is not a multiple of time delta");
      });

    });
    
    describe("Success Scenarios", function() {
      
      it("should emit a CreateStream event with correct parameters", async function () {
        await expect(
          streamingContract.connect(sender).createStream(recipient1.address, deposit, startTimestamp,
            stopTimestamp, { "value": deposit })
        ).to.emit(streamingContract, "CreateStream")
        .withArgs(1, sender.address, recipient1.address, deposit, startTimestamp, stopTimestamp);
      });

    });
    

  });

  describe("Withdraw From Stream", function () {
    let deposit = 1e9;
    let now;
    let startTimestamp;
    let stopTimestamp;

    it("should Increase ether balance of recipient by deposit", async function () {
      now = new Date();
      startTimestamp = Math.floor(now.getTime() / 1000) + 100;
      stopTimestamp = startTimestamp + 1;

      await streamingContract.connect(sender).createStream(recipient1.address, deposit, startTimestamp,
        stopTimestamp, { "value": deposit })

      await network.provider.send("evm_increaseTime", [3600])
      expect(await streamingContract.connect(recipient1).withdrawFromStream(1))
        .to.changeEtherBalance(recipient1, deposit);
    });

    it ("should revert when balancie is zero")


  });
});


// describe("Token contract", function () {
//   // Mocha has four functions that let you hook into the the test runner's
//   // lifecyle. These are: `before`, `beforeEach`, `after`, `afterEach`.

//   // They're very useful to setup the environment for tests, and to clean it
//   // up after they run.

//   // A common pattern is to declare some variables, and assign them in the
//   // `before` and `beforeEach` callbacks.

//   let Token;
//   let hardhatToken;
//   let owner;
//   let addr1;
//   let addr2;
//   let addrs;

//   // `beforeEach` will run before each test, re-deploying the contract every
//   // time. It receives a callback, which can be async.
//   beforeEach(async function () {
//     // Get the ContractFactory and Signers here.
//     Token = await ethers.getContractFactory("Token");
//     [owner, addr1, addr2, ...addrs] = await ethers.getSigners();

//     // To deploy our contract, we just have to call Token.deploy() and await
//     // for it to be deployed(), which happens onces its transaction has been
//     // mined.
//     hardhatToken = await Token.deploy();
//     await hardhatToken.deployed();

//     // We can interact with the contract by calling `hardhatToken.method()`
//     await hardhatToken.deployed();
//   });

//   // You can nest describe calls to create subsections.
//   describe("Deployment", function () {
//     // `it` is another Mocha function. This is the one you use to define your
//     // tests. It receives the test name, and a callback function.

//     // If the callback function is async, Mocha will `await` it.
//     it("Should set the right owner", async function () {
//       // Expect receives a value, and wraps it in an assertion objet. These
//       // objects have a lot of utility methods to assert values.

//       // This test expects the owner variable stored in the contract to be equal
//       // to our Signer's owner.
//       expect(await hardhatToken.owner()).to.equal(owner.address);
//     });

//     it("Should assign the total supply of tokens to the owner", async function () {
//       const ownerBalance = await hardhatToken.balanceOf(owner.address);
//       expect(await hardhatToken.totalSupply()).to.equal(ownerBalance);
//     });
//   });

//   describe("Transactions", function () {
//     it("Should transfer tokens between accounts", async function () {
//       // Transfer 50 tokens from owner to addr1
//       await hardhatToken.transfer(addr1.address, 50);
//       const addr1Balance = await hardhatToken.balanceOf(
//         addr1.address
//       );
//       expect(addr1Balance).to.equal(50);

//       // Transfer 50 tokens from addr1 to addr2
//       // We use .connect(signer) to send a transaction from another account
//       await hardhatToken.connect(addr1).transfer(addr2.address, 50);
//       const addr2Balance = await hardhatToken.balanceOf(
//         addr2.address
//       );
//       expect(addr2Balance).to.equal(50);
//     });

//     it("Should fail if sender doesn’t have enough tokens", async function () {
//       const initialOwnerBalance = await hardhatToken.balanceOf(
//         owner.address
//       );

//       // Try to send 1 token from addr1 (0 tokens) to owner (1000 tokens).
//       // `require` will evaluate false and revert the transaction.
//       await expect(
//         hardhatToken.connect(addr1).transfer(owner.address, 1)
//       ).to.be.revertedWith("Not enough tokens");

//       // Owner balance shouldn't have changed.
//       expect(await hardhatToken.balanceOf(owner.address)).to.equal(
//         initialOwnerBalance
//       );
//     });

//     it("Should update balances after transfers", async function () {
//       const initialOwnerBalance = await hardhatToken.balanceOf(
//         owner.address
//       );

//       // Transfer 100 tokens from owner to addr1.
//       await hardhatToken.transfer(addr1.address, 100);

//       // Transfer another 50 tokens from owner to addr2.
//       await hardhatToken.transfer(addr2.address, 50);

//       // Check balances.
//       const finalOwnerBalance = await hardhatToken.balanceOf(
//         owner.address
//       );
//       expect(finalOwnerBalance).to.equal(initialOwnerBalance - 150);

//       const addr1Balance = await hardhatToken.balanceOf(
//         addr1.address
//       );
//       expect(addr1Balance).to.equal(100);

//       const addr2Balance = await hardhatToken.balanceOf(
//         addr2.address
//       );
//       expect(addr2Balance).to.equal(50);
//     });
//   });
// });
