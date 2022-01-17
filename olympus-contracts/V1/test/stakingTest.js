const { deployOHM } = require("./ohmContractDeployTest.js");

const { BigNumber } = require('ethers');
const { ethers } = require('hardhat');
const { assert, expect } = require("chai");
const { expectRevert, time, BN } = require('@openzeppelin/test-helpers');

let deployedOHM;
let owner, user1, user2, user3, user4;

describe("===========================OlympusDao staking test===========================", function () {
    beforeEach(async function () {
        [owner, user1, user2, user3, user4] = await ethers.getSigners();
    });


    it("FarmWorld.test test", async function () {
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
    console.log("deployedOHM", deployedOHM.address);
}