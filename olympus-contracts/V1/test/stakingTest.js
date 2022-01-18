const { deployOHM, deploySOHM, deployDAI, deployStaking, deployStakingWarmup, deployStakingHelper, deployTreasury, deployDistributor } = require("./ohmContractDeployTest.js");

const { BigNumber } = require('ethers');
const { ethers } = require('hardhat');
const { assert, expect } = require("chai");
const { expectRevert, time, BN } = require('@openzeppelin/test-helpers');

let deployedOHM, deployedSOHM, deployedStaking, deployedDAI, deployedStakingWarmpup, deployedStakingHelper, deployedTreasury, deployedDistributor;
let owner, daoUser, staker1, user3, user4;

//参数
// 用于计算index的参数，每次rebase结束之后保存记录时用到（好像就没有其它作用了）【Initial staking index】
const initialIndex = '7675210820';
//每个周期(Epoch)包含多少个区块（经过多少区块rebase一次）【 How many blocks are in each epoch】
const epochLengthInBlocks = '2200';
// 首个周期(Epoch)的起始区块，如果为空则取当前区块【What epoch will be first epoch】
let firstEpochNumber = '';
//首个周期(Epoch)的结束区块,如果为空，则默认开始块+每个周期（epoch）的区块数（如果设置了首个结束区块，则首个epoch的结束区块不受epochLengthInBlocks影响）
let firstEpochBlock = '';
// TODO 不知道有什么用，这里跟官方脚本一样，设置为0
let blocksNeededForQueue = 0;
// 初始收益比例（影响到OHM产量）【Initial reward rate for epoch】
// 每次rebase给staking合约mint的用于staker分红的OHM份额：IERC20(OHM).totalSupply().mul(_rate).div(1000000)
const initialRewardRate = '3000';


//for test
//DAI decimal
const daiDecimal = 18;
// 初始mint多少token
const initialMint = '10000000000000000000000000';
//授权
const daiApproveAmount = ethers.utils.parseUnits('100000000000000000000000000000', daiDecimal);

describe("===========================OlympusDao staking test===========================", function () {
    beforeEach(async function () {
        [owner, daoUser, staker1, user3, user4] = await ethers.getSigners();

        //默认，首个周期（epoch）起始区块从当前块开始
        if (!firstEpochNumber || firstEpochNumber == "")
            firstEpochNumber = await ethers.provider.getBlockNumber();
        //默认，首个周期（epoch）结束区块=起始区块+每个周期（epoch）的区块数
        if (!firstEpochBlock || firstEpochBlock == "")
            firstEpochBlock = firstEpochNumber + parseInt(epochLengthInBlocks);
    });


    it("OlympusDao staking test", async function () {
        //部署合约
        await deployContract();
        //合约部署之后的一些初始化
        await initAfterDeploy();
        //测试质押
        await stakingTest();
        // // 测试用户购买nft
        // await buyAndMint();
        // //批量查询
        // await queryNFtBatch();
        // //nft转让
        // await transferTest();
        // //合约拥有者提现
        // await ownerWithdraw();
    });

});


/**
 * 部署合约
 */
async function deployContract() {
    console.log("deployContract start");
    deployedOHM = await deployOHM();
    deployedSOHM = await deploySOHM();
    deployedDAI = await deployDAI();
    deployedStaking = await deployStaking(deployedOHM.address, deployedSOHM.address, epochLengthInBlocks, firstEpochNumber, firstEpochBlock)
    deployedStakingWarmpup = await deployStakingWarmup(deployedStaking.address, deployedSOHM.address);
    deployedTreasury = await deployTreasury(deployedOHM.address, deployedDAI.address, blocksNeededForQueue);
    deployedDistributor = await deployDistributor(deployedTreasury.address, deployedOHM.address, epochLengthInBlocks, firstEpochBlock);

    //StakingHelper并非必须合约
    deployedStakingHelper = await deployStakingHelper(deployedStaking.address, deployedOHM.address);
    console.log("deployContract finish");
}

/**
 * 合约部署之后进行一些初始化
 */
async function initAfterDeploy() {
    console.log("initAfterDeploy start");
    //给测试用户mint一些DAI
    await deployedDAI.mint(staker1.address, initialMint)

    //初始化sOHM的参数
    await deployedSOHM.initialize(deployedStaking.address);
    await deployedSOHM.setIndex(initialIndex);

    //初始化staking合约参数(设置一些依赖的合约地址)
    await deployedStaking.setContract('0', deployedDistributor.address);
    await deployedStaking.setContract('1', deployedStakingWarmpup.address);

    //初始化OHM
    await deployedOHM.setVault(deployedTreasury.address); //只有这个地址允许调用OHM的mint

    // ！！！！！！！这一步相当重要，关系到给用户的收益
    // 每次rebase时，distributor合约会给staking合铸造OHM用于质押分红
    // 分红的份额是：IERC20(OHM).totalSupply().mul(_rate).div(1000000)
    await deployedDistributor.addRecipient(deployedStaking.address, initialRewardRate);
    console.log("initAfterDeploy finish");
}

async function stakingTest() {
    console.log("stakingTest start");
    let balance = await deployedDAI.balanceOf(staker1.address);
    //授权和质押  TODO 不支持staking dai
    await deployedDAI.connect(staker1).approve(deployedStaking.address, daiApproveAmount);
    // await deployedStaking.connect(staker1).staker1();

    console.log("balance:", balance);
    console.log("stakingTest finish");
}