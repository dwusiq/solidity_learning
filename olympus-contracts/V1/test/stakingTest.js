const { deployOHM, deploySOHM, deployDAI, deployStaking, deployStakingWarmup, deployStakingHelper, deployTreasury, deployDistributor } = require("./ohmContractDeployTest.js");

const { BigNumber } = require('ethers');
const { ethers } = require('hardhat');
const { assert, expect } = require("chai");
const { expectRevert, time, BN } = require('@openzeppelin/test-helpers');

let deployedOHM, deployedSOHM, deployedStaking, deployedDAI, deployedStakingWarmpup, deployedStakingHelper, deployedTreasury, deployedDistributor;
let owner, daoUser, user2, user3, user4;

//参数
//每个周期(Epoch)包含多少个区块（经过多少区块rebase一次）【 How many blocks are in each epoch】
const epochLengthInBlocks = '2200';
// 首个周期(Epoch)的起始区块，如果为空则取当前区块【What epoch will be first epoch】
let firstEpochNumber = '';
//首个周期(Epoch)的结束区块,如果为空，则默认开始块+每个周期（epoch）的区块数（如果设置了首个结束区块，则首个epoch的结束区块不受epochLengthInBlocks影响）
let firstEpochBlock = '';
let blocksNeededForQueue = 0; // TODO 不知道有什么用，这里跟官方脚本一样，设置为0

describe("===========================OlympusDao staking test===========================", function () {
    beforeEach(async function () {
        [owner, daoUser, user2, user3, user4] = await ethers.getSigners();

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


async function deployContract() {
    deployedOHM = await deployOHM();
    deployedSOHM = await deploySOHM();
    deployedDAI = await deployDAI();
    deployedStaking = await deployStaking(deployedOHM.address, deployedSOHM.address, epochLengthInBlocks, firstEpochNumber, firstEpochBlock)
    deployedStakingWarmpup = await deployStakingWarmup(deployedStaking.address, deployedSOHM.address);
    deployedTreasury = await deployTreasury(deployedOHM.address, deployedDAI.address, blocksNeededForQueue);
    deployedDistributor = await deployDistributor(deployedTreasury.address, deployedOHM.address, epochLengthInBlocks, firstEpochBlock);

     //StakingHelper并非必须合约
     deployedStakingHelper = await deployStakingHelper(deployedStaking.address, deployedSOHM.address);
}