const { deployOHM, deploySOHM, deployDAI, deployStaking, deployStakingWarmup, deployStakingHelper, deployTreasury, deployDistributor } = require("./ohmContractDeployTest.js");


describe("===========================OlympusDao bond test===========================", function () {
    beforeEach(async function () {
        [owner, daoUser, staker1, user3, user4] = await ethers.getSigners();

        //默认，首个周期（epoch）起始区块从当前块开始
        if (!firstEpochNumber || firstEpochNumber == "")
            firstEpochNumber = await ethers.provider.getBlockNumber();
        //默认，首个周期（epoch）结束区块=起始区块+每个周期（epoch）的区块数
        if (!firstEpochBlock || firstEpochBlock == "")
            firstEpochBlock = firstEpochNumber + parseInt(epochLengthInBlocks);
    });


    it("OlympusDao bond test", async function () {
        //部署合约
        await deployContract();
        //合约部署之后的一些初始化
        await initAfterDeploy();
        //测试质押
        // await stakingTest();
    });

});
