const { ethers } = require( 'hardhat');

//部署ohm
async function deployOHM() {
    const OHM = await ethers.getContractFactory('OlympusERC20Token');
    let deployedOHM = await OHM.deploy();
    console.log("ohm deploy finish, ohmAddress: %s", deployedOHM.address);
    return deployedOHM;
}


module.exports = {deployOHM}