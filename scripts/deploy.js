const hre = require("hardhat");

async function main() {
    const [deployer] = await hre.ethers.getSigners();

    const StreamingContract = await hre.ethers.getContractFactory("Streaming");
    const streamingContract = await StreamingContract.deploy();
    await streamingContract.deployed();

    console.log(`Streaming Contract deployed to address: ${streamingContract.address}`);

    const Token = await hre.ethers.getContractFactory("INVToken");
    let initialSupply = hre.ethers.utils.parseUnits("100", 18);
    const token = await Token.deploy(initialSupply);
    
    await token.deployed();
    console.log(`Token deployed to address: ${token.address}`);

}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.log(error);
        process.exit(1);
    });