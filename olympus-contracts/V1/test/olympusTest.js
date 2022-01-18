const { deployOHM, deploySOHM, deployDAI, deployStaking, deployStakingWarmup, deployStakingHelper, deployTreasury, deployDistributor, deployDaiBond } = require("./ohmContractDeployTest.js");

const { BigNumber } = require('ethers');
const { ethers } = require('hardhat');
const { assert, expect } = require("chai");
const { expectRevert, time, BN } = require('@openzeppelin/test-helpers');

let deployedOHM, deployedSOHM, deployedStaking, deployedDAI, deployedStakingWarmpup;
let deployedStakingHelper, deployedTreasury, deployedDistributor, deployedDaiBond;
let owner, daoUser, staker1, user3, user4;

//for staking
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
// 常量【Ethereum 0 address, used when toggling changes in treasury】
const zeroAddress = '0x0000000000000000000000000000000000000000';

//for bond
// DAI购买债券的BCV【DAI bond BCV】
const daiBondBCV = '369';
// Frax购买债券的BCV【Frax bond BCV】
const fraxBondBCV = '690';
// 用户购买债券的锁仓时长---这是以太坊的时长，其它的需要按实际设置【Bond vesting length in blocks. 33110 ~ 5 days】
const bondVestingLength = '33110';
// 债券最低价【Min bond price】
const minBondPrice = '50000';
// 债券每笔交易的最大支出【Max bond payout】
const maxBondPayout = '50'
// 债券交易中dao手续费【DAO fee for bond(500 = 5% = 0.05 for every 1 paid)】
const bondFee = '10000';
// 最多能被持有多少债券【Max debt bond can take on】
const maxBondDebt = '1000000000000000';
// 初始债券数【Initial Bond debt】
const intialBondDebt = '0'


//for test
// 初始mint多少dai
const daiDecimal = 18;
const initialDaiMint = ethers.utils.parseUnits('1000000000', daiDecimal);
const daiApproveAmount = ethers.utils.parseUnits('100000000000000000000000000000', daiDecimal);
// 初始mint多少ohm
const ohmDecimal = 9;
const initialOhmMint = ethers.utils.parseUnits('100000', ohmDecimal);
const ohmApproveAmount = ethers.utils.parseUnits('10000000000000000', ohmDecimal);

describe("===========================OlympusDao staking test===========================", function () {
    beforeEach(async function () {
        [owner, daoUser, staker1, bonder1, user3, user4] = await ethers.getSigners();
        defaultAndPrintParam();
    });


    it("OlympusDao staking test", async function () {
        //部署合约
        await deployContract();
        //合约部署之后的一些初始化
        await initAfterDeploy();
        //债券测试
        await bondTest();
        //测试质押
        // await stakingTest();

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
    deployedDaiBond = await deployDaiBond(deployedOHM.address, deployedDAI.address, deployedTreasury.address, daoUser.address, zeroAddress);
    //StakingHelper并非必须合约
    deployedStakingHelper = await deployStakingHelper(deployedStaking.address, deployedOHM.address);
    console.log("deployContract finish");
}

/**
 * 合约部署之后进行一些初始化
 */
async function initAfterDeploy() {
    console.log("initAfterDeploy start");

    //给Treasury配置权限【queue and toggle】
    //设置Treasury相关的权限--根据实际设置，具体参考Treasury的枚举MANAGING枚举
    //RESERVEDEPOSITOR:0-允许存入储备金
    await deployedTreasury.queue('0', deployedDaiBond.address);
    await deployedTreasury.toggle('0', deployedDaiBond.address, zeroAddress)
    //REWARDMANAGER: 8 - 允许铸造OHM给其它用户
    await deployedTreasury.queue('8', deployedDistributor.address);
    await deployedTreasury.toggle('8', deployedDistributor.address, zeroAddress);

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

    // 配置债券信息（如：最低价、最大单笔交易等）
    await deployedDaiBond.initializeBondTerms(daiBondBCV, bondVestingLength, minBondPrice, maxBondPayout, bondFee, maxBondDebt, intialBondDebt);

    // //测试将用户添加为REWARDMANAGER---允许给其它用户铸OHM的测试币（生产环境可以不给owner加这个权限）
    // await expectRevert(deployedTreasury.mintRewards(staker1.address, initialOhmMint), "Not approved");
    // await deployedTreasury.queue('8', owner.address);
    // await deployedTreasury.toggle('8', owner.address, zeroAddress);
    // await deployedTreasury.mintRewards(staker1.address, initialOhmMint);
    // console.log("staker1 default ohmBalance:%s", ethers.utils.formatUint(await deployedOHM.balanceOf(staker1.address), ohmDecimal));
    // console.log("staker1 default sOhmBalance:%s", ethers.utils.formatUint(await deployedSOHM.balanceOf(staker1.address), ohmDecimal));

    //专为测试的初始化
    //init for test
    //给测试用户mint一些DAI
    await deployedDAI.mint(bonder1.address, initialDaiMint);
    console.log("bonder1 default daiBalance:%s", ethers.utils.formatUnits(await deployedDAI.balanceOf(bonder1.address), daiDecimal));

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


async function bondTest() {
    console.log("bondTest start");
    
    console.log("bondPrice:%s",await deployedDaiBond.bondPrice());
    // console.log("bondPrice:%s", ethers.utils.formatUint(await deployedDaiBond.bondPrice(), daiDecimal));


    await deployedDAI.connect(staker1).approve(deployedStaking.address, daiApproveAmount);
    // await deployedStaking.connect(staker1).staker1();

    console.log("balance:", balance);
    console.log("bondTest finish");
}



//打印参数 
async function defaultAndPrintParam() {
    //默认，首个周期（epoch）起始区块从当前块开始
    if (!firstEpochNumber || firstEpochNumber == "")
        firstEpochNumber = await ethers.provider.getBlockNumber();
    //默认，首个周期（epoch）结束区块=起始区块+每个周期（epoch）的区块数
    if (!firstEpochBlock || firstEpochBlock == "")
        firstEpochBlock = firstEpochNumber + parseInt(epochLengthInBlocks);
    if (!mockDaoAddress || mockDaoAddress == "")
        mockDaoAddress = deployerAddress;

    console.log("firstEpochNumber: %s", firstEpochNumber);
    console.log("epochLengthInBlocks: %s", epochLengthInBlocks);
    console.log("firstEpochBlock: %s", firstEpochBlock);
    console.log("daiBondBCV: %s", daiBondBCV);
    console.log("fraxBondBCV: %s", fraxBondBCV);
    console.log("bondVestingLength: %s", bondVestingLength);
    console.log("minBondPrice: %s", minBondPrice);
    console.log("maxBondPayout: %s", maxBondPayout);
    console.log("bondFee: %s", bondFee);
    console.log("maxBondDebt: %s", maxBondDebt);
    console.log("intialBondDebt: %s", intialBondDebt);
    console.log("deployerAddress: %s", deployerAddress);
    console.log("mockDaoAddress: %s", mockDaoAddress);
    console.log("initialIndex: %s", initialIndex);
    console.log("initialRewardRate: %s", initialRewardRate);
    console.log("zeroAddress: %s", zeroAddress);
    console.log("largeApproval: %s", largeApproval);
    console.log("initialMint: %s", initialMint);
}