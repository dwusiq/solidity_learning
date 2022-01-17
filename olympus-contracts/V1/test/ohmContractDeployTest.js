const { ethers } = require('hardhat');

//部署ohm
async function deployOHM() {
    const OHM = await ethers.getContractFactory('OlympusERC20Token');
    let deployedOHM = await OHM.deploy();
    console.log("ohm deploy finish, ohmAddress: %s", deployedOHM.address);
    return deployedOHM;
}

//部署sOHM
async function deploySOHM() {
    const sOHM = await ethers.getContractFactory('sOlympus');  //取用文件内的合约名称
    let deployedSOHM = await sOHM.deploy();
    console.log("sOHM deploy finish, sohmAddress: %s", deployedSOHM.address);
    return deployedSOHM;
}

//部署DAI
async function deployDAI() {
    const DAI = await ethers.getContractFactory('DAI');
    let deployedDai = await DAI.deploy(0);
    console.log("DAI deploy finish, daiAddress: %s", deployedDai.address);
    return deployedDai;
}


//部署staking合约（依赖OHM、sOHM）
async function deployStaking(ohmAddress, sOhmAddress, epochLengthInBlocks, firstEpochNumber, firstEpochBlock) {
    const Staking = await ethers.getContractFactory('OlympusStaking');
    const deployedStaking = await Staking.deploy(ohmAddress, sOhmAddress, epochLengthInBlocks, firstEpochNumber, firstEpochBlock);
    console.log("Staking deploy finish, stakingAddress: %s", deployedStaking.address);
    return deployedStaking;
}


//部署StakingWarmup（依赖staking、sOHM）
async function deployStakingWarmup(stakingAddress, sohmAddress) {
    const StakingWarmpup = await ethers.getContractFactory('StakingWarmup');
    const deployedStakingWarmpup = await StakingWarmpup.deploy(stakingAddress, sohmAddress);
    console.log("StakingWarmup deploy finish,stakingWarmupAddress: %s", deployedStakingWarmpup.address);
    return deployedStakingWarmpup;
}

//部署StakingWarmup（依赖staking、sOHM）
async function deployStakingHelper(stakingAddress, ohmAddress) {
    const StakingHelper = await ethers.getContractFactory('StakingHelper');
    const deployedStakingHelper = await StakingHelper.deploy(stakingAddress, ohmAddress);
    console.log("StakingHelper deploy finish,stakingHelperAddress: %s", deployedStakingHelper.address);
    return deployedStakingHelper;
}


//部署MockOlympusTreasury(依赖：OHM、DAI)------生产需要根据实际支持的Treasury来调整构造函数入参的Token
async function deployTreasury(ohmAddress, daiAddress, blocksNeededForQueue) {
    const Treasury = await ethers.getContractFactory('MockOlympusTreasury');
    const deployedTreasury = await Treasury.deploy(ohmAddress, daiAddress, blocksNeededForQueue); // TODO 比原来案例减少了fraxToken
    console.log("MockOlympusTreasury deploy finish,treasuryAddress: %s", deployedTreasury.address);
    return deployedTreasury;
}

//部署Distributor(依赖：OHM、treasury)
async function deployDistributor(treasuryAddress, ohmAddress, epochLengthInBlocks, firstEpochBlock) {
    const Distributor = await ethers.getContractFactory('Distributor');
    const deployedDistributor = await Distributor.deploy(treasuryAddress, ohmAddress, epochLengthInBlocks, firstEpochBlock);
    console.log("StakingDistributor deploy finish,distributorAddress: %s", deployedDistributor.address);
    return deployedDistributor;
}


module.exports = {
    deployOHM,
    deploySOHM,
    deployDAI,
    deployStaking,
    deployStakingWarmup,
    deployStakingHelper,
    deployTreasury,
    deployDistributor
}