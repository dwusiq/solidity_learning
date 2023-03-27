const { sleep } = require("./units")

async function deployContract(name, args) {
    const contractFactory = await ethers.getContractFactory(name)
    const contract = await contractFactory.deploy(...args)
    await contract.deployed();
    return contract;
}

async function contractAt(name, address) {
    const contractFactory = await ethers.getContractFactory(name)
    return await contractFactory.attach(address)
}

async function deployOrAttach(name, address, args) {
    var deployedContract;
    if (!address || address == "") {
        deployedContract = await deployContract(name, args);
    } else {
        deployedContract = await contractAt(name, address);
    }
    console.log(`${name} already deployed. address:${deployedContract.address}`);
    return deployedContract;
}

async function deployOrAttachPro(name, address, args) {
    var deployedContract = await deployOrAttach(name, address, args);
    if (!address)
        await sleep(500);
    return deployedContract;
}

module.exports = {
    deployOrAttach,
    deployOrAttachPro
}
