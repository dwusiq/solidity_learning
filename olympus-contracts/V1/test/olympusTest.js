const { deployOHM, deploySOHM, deployDAI, deployStaking, deployStakingWarmup, deployStakingHelper, deployTreasury, deployDistributor, deployDaiBond, deployAlphaOHM: deployAlphAOHM, deployAohmMigration, deployOHMPresale } = require("./ohmContractDeployTest.js");

const { BigNumber } = require('ethers');
const { ethers } = require('hardhat');
const { assert, expect } = require("chai");
const { expectRevert, time, BN } = require('@openzeppelin/test-helpers');

let deployedOHM, deployedSOHM, deployedStaking, deployedDAI, deployedStakingWarmpup;
let deployedStakingHelper, deployedTreasury, deployedDistributor, deployedDaiBond;
let deployedAlphaOHM, deployedAohmMigration, deployedOHMPresale;
let deployer, presaleDaiReceiptor, daoUser, staker1, user3, user4;



//for test
// 初始mint多少dai
const daiDecimal = 18;
const initialDaiMintStr = "1000";
const initialDaiMint = ethers.utils.parseUnits(initialDaiMintStr, daiDecimal);
const daiApproveAmount = ethers.utils.parseUnits('100000000000000000000000000000', daiDecimal);
// 初始mint多少ohm
const ohmDecimal = 9;
// const initialOhmMint = ethers.utils.parseUnits('100000', ohmDecimal);
const ohmApproveAmount = ethers.utils.parseUnits('10000000000000000', ohmDecimal);


//for preSale（生产根据实际填写）
const aOhmSalePriceStr = "1";//(注，如果价格改成小于1，则下面的预售相关的案例有部分要改动)预售期1个dai买一个aOHM（如果预售期ohm相对于dai的价格小于1，则项目方需要一半的钱买ohm给客户兑换，因为合约保证一个dai对应一个ohm）
const aOhmSalePrice = ethers.utils.parseUnits(aOhmSalePriceStr, daiDecimal);  //预售期0.5个dai买一个aOHM
const aOhmSaleLength = 30 * 86400000;  //1天=86400000
const aOHMDuration = 100;//预售结束后，aohm兑换ohm的窗口开放时长（多少个区块）

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



describe("===========================OlympusDao test===========================", function () {
    beforeEach(async function () {
        [deployer, presaleDaiReceiptor, daoUser, staker1, bonder1, user3, user4] = await ethers.getSigners();
        defaultAndPrintParam();
    });


    it("OlympusDao test", async function () {

        await ethers.provider.getBlockNumber().then((blockNumber) => {
            console.log("Current block number: " + blockNumber);
        });

        //部署合约
        await deployContract();
        //合约部署后的初始配置
        await initAfterDeploy();
        //准备开启预售（生产中，如果OHM初始绑定的金额是自己出，则可以考虑不用私募，直接调treasury的deposit就可以）
        await initForPresale();
        //参与预售
        await purchaseAOHM();
        //项目方首次用存储(获取初始OHM)
        await firstDepositForOHM();
        //准备开启aOHM兑换OHM功能
        await initForMigration();
        //兑换，将aOHM兑换成OHM
        await migration();
        // await initBeforeProjectRun();
        //债券测试
        // await bondTest();
        //测试质押
        // await stakingTest();

        // // 测试用户购买nft
        // await buyAndMint();
        // //批量查询
        // await queryNFtBatch();
        // //nft转让
        // await transferTest();
        // //合约拥有者提现
        // await deployerWithdraw();
    });

});


/**
 * 部署合约
 */
async function deployContract() {
    console.log(">>>>>> deployContract start");
    //部署预售相关合约
    deployedAlphaOHM = await deployAlphAOHM();
    deployedOHMPresale = await deployOHMPresale();
    deployedAohmMigration = await deployAohmMigration();

    //部署项目正常运行的合约
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
    console.log(">>>>>> deployContract finish");
}

/**
 * 预售相关配置
 */
async function initForPresale() {
    console.log(">>>>>> initForPresale start");
    //将staker1加入预售白名单
    await deployedOHMPresale.connect(deployer).whiteListBuyers([staker1.address]);
    console.log("before initForPresale，aohmBalanceOfDeployer:%s, aohmBalanceOfSaleContract:%s", ethers.utils.formatUnits(await deployedAlphaOHM.balanceOf(deployer.address), ohmDecimal), ethers.utils.formatUnits(await deployedAlphaOHM.balanceOf(deployedOHMPresale.address), ohmDecimal));
    await deployedOHMPresale.initialize(presaleDaiReceiptor.address, deployedDAI.address, deployedAlphaOHM.address, aOhmSalePrice, aOhmSaleLength);
    await deployedAlphaOHM.connect(deployer).transfer(deployedOHMPresale.address, await deployedAlphaOHM.balanceOf(deployer.address));
    console.log("after initForPresale，aohmBalanceOfDeployer:%s, aohmBalanceOfSaleContract:%s", ethers.utils.formatUnits(await deployedAlphaOHM.balanceOf(deployer.address), ohmDecimal), ethers.utils.formatUnits(await deployedAlphaOHM.balanceOf(deployedOHMPresale.address), ohmDecimal));
    console.log(">>>>>> initForPresale fihish");
}

/**
 * 预售期购买aOHM
 */
async function purchaseAOHM() {
    console.log(">>>>>> presaleOHM start");
    //给staker1铸造dai
    await deployedDAI.connect(deployer).mint(staker1.address, initialDaiMint);
    console.log("mint dai to staker1,amount:%s", initialDaiMintStr);
    //staker1用dai购买aOHM
    await deployedDAI.connect(staker1).approve(deployedOHMPresale.address, daiApproveAmount);
    await deployedOHMPresale.connect(staker1).purchaseaOHM(initialDaiMint);
    //检查预售合约的dai份额
    await deployedDAI.balanceOf(presaleDaiReceiptor.address).then(function (result) {
        console.log("after presale, presaleDaiReceiptorBalanceOfDai:%s", ethers.utils.formatUnits(result, daiDecimal));
        assert.equal(ethers.utils.formatUnits(result, daiDecimal), ethers.utils.formatUnits(initialDaiMint, daiDecimal));
    });
    //检查staker1的aOHM份额
    await deployedAlphaOHM.balanceOf(staker1.address).then(function (result) {
        console.log("after presale, staker1BalanceOfAohm:%s", ethers.utils.formatUnits(result, ohmDecimal));
        let exceptAohmAmount = parseFloat(initialDaiMintStr) / parseFloat(aOhmSalePriceStr);
        assert.equal(parseFloat(ethers.utils.formatUnits(result, ohmDecimal)), exceptAohmAmount);
    });
    console.log(">>>>>> presaleOHM finish");

}

/**
 * 首次存储DAI，获得项目初始OHM.
 */
async function firstDepositForOHM() {
    console.log(">>>>>> firstDepositForOHM start");
    let presaleDaiReceiptorOwnDaiAmount = await deployedDAI.balanceOf(presaleDaiReceiptor.address);
    console.log("presaleDaiReceiptorOwnDaiAmount:%s", presaleDaiReceiptorOwnDaiAmount);
    let depositDaiAmountStr = ethers.utils.formatUnits(presaleDaiReceiptorOwnDaiAmount, daiDecimal);
    console.log("before deposit,presaleDaiReceiptorOwnDaiAmount:%s", presaleDaiReceiptorOwnDaiAmount);
    await deployedDAI.connect(presaleDaiReceiptor).approve(deployedTreasury.address, daiApproveAmount);

    //首次进DAI和出OHM的份额比已确定了他们的价格比(注意，如果有引入预售，需要结合预售的价格配置比例，如果这里投入的dai产出的OHM比预售的高，则会导致项目方自己垫钱)
    // 计算存储的dai份额根据价格运算总应得多少OHM
    let outOHMAmount = parseFloat(depositDaiAmountStr) / parseFloat(aOhmSalePriceStr);//计算dai对应的OHM产出
    let outOHMAmountBitnumber = ethers.utils.parseUnits(outOHMAmount + "", ohmDecimal);
    // 计算指定资产的份额价值多少OHM(无风险价值RFV)
    let rfvValue = await deployedTreasury.valueOfToken(deployedDAI.address, presaleDaiReceiptorOwnDaiAmount);
    //计算用于收益分红的份额
    let profitAmount = rfvValue.sub(outOHMAmountBitnumber);
    console.log("rfvValue:%s profitAmount:%s", rfvValue, profitAmount);
    await deployedTreasury.connect(presaleDaiReceiptor).deposit(presaleDaiReceiptorOwnDaiAmount, deployedDAI.address, profitAmount);

    //份额确认
    let presaleDaiReceiptorOwnOhmAmount = await deployedOHM.balanceOf(presaleDaiReceiptor.address);
    let expectPresaleDaiReceiptorOwnOhmAmount = ethers.utils.parseUnits(outOHMAmount + "", ohmDecimal);
    console.log("after deposit, expectPresaleDaiReceiptorOwnOhmAmount:%s presaleDaiReceiptorOwnOhmAmount:%s", expectPresaleDaiReceiptorOwnOhmAmount, presaleDaiReceiptorOwnOhmAmount);
    assert.equal(parseFloat(ethers.utils.formatUnits(presaleDaiReceiptorOwnOhmAmount, ohmDecimal)), outOHMAmount);
    console.log(">>>>>> firstDepositForOHM finish");
}


/**
 * 开启兑换功能（aOHM兑换OHM）
 */
async function initForMigration() {
    console.log(">>>>>> initForMigration start");
    //将OHM转进兑换合约
    let presaleDaiReceiptorOwnOhmAmount = await deployedOHM.balanceOf(presaleDaiReceiptor.address);
    await deployedOHM.connect(presaleDaiReceiptor).transfer(deployedAohmMigration.address, presaleDaiReceiptorOwnOhmAmount);

    //检查兑换合约的OHM份额
    await deployedOHM.balanceOf(deployedAohmMigration.address).then(function (result) {
        console.log("migrationOwnOhmAmount:%s", ethers.utils.formatUnits(result, ohmDecimal));
        assert.equal(parseFloat(ethers.utils.formatUnits(result, ohmDecimal)), parseFloat(ethers.utils.formatUnits(presaleDaiReceiptorOwnOhmAmount, ohmDecimal)));
    });

    //开启初始化兑换功能
    await deployedAohmMigration.connect(deployer).initialize(deployedOHM.address, deployedAlphaOHM.address, aOHMDuration);
    console.log(">>>>>> initForMigration finish");
}


/**
 * 兑换（aOHM兑换ohm）
 */
async function migration() {
    console.log(">>>>>> migration start");

    let staker1OwnAohmAmountBefore = await deployedAlphaOHM.balanceOf(staker1.address);
    let staker1OwnOhmAmountBefore = await deployedOHM.balanceOf(staker1.address);
    console.log("befores migration, staker1OwnAohmAmountBefore:%s staker1OwnOhmAmountBefore:%s", staker1OwnAohmAmountBefore, staker1OwnOhmAmountBefore);
    //兑换
    await deployedAlphaOHM.connect(staker1).approve(deployedAohmMigration.address, ohmApproveAmount);
    await deployedAohmMigration.connect(staker1).migrate(staker1OwnAohmAmountBefore);

    //校验结果
    staker1OwnAohmAmountAfterMigrate = await deployedAlphaOHM.balanceOf(staker1.address);
    staker1OwnOhmAmountAfterMigrate = await deployedOHM.balanceOf(staker1.address);
    console.log("after migration, staker1OwnAohmAmountAfterMigrate:%s staker1OwnOhmAmountAfterMigrate:%s", staker1OwnAohmAmountAfterMigrate, staker1OwnOhmAmountAfterMigrate);

    assert.equal(parseFloat(ethers.utils.formatUnits(staker1OwnAohmAmountBefore, ohmDecimal)), parseFloat(ethers.utils.formatUnits(staker1OwnOhmAmountAfterMigrate, ohmDecimal)));

    console.log(">>>>>> migration finish");
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
    // //RESERVETOKEN:2-允许成为合约支持的储备金  允许将dai作为国库的储备金  已经在构造函数中配置DAI作为储备金
    // await deployedTreasury.queue('2', deployedDAI.address);
    // await deployedTreasury.toggle('2', deployedDAI.address, zeroAddress);
    //RESERVEDEPOSITOR:0-允许存入储备金   这是为了在firstDepositForOHM函数中，首次存入储备金
    await deployedTreasury.queue('0', presaleDaiReceiptor.address);
    await deployedTreasury.toggle('0', presaleDaiReceiptor.address, zeroAddress);


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

    // //测试将用户添加为REWARDMANAGER---允许给其它用户铸OHM的测试币（生产环境可以不给deployer加这个权限）
    // await expectRevert(deployedTreasury.mintRewards(staker1.address, initialOhmMint), "Not approved");
    // await deployedTreasury.queue('8', deployer.address);
    // await deployedTreasury.toggle('8', deployer.address, zeroAddress);
    // await deployedTreasury.mintRewards(staker1.address, initialOhmMint);
    // console.log("staker1 default ohmBalance:%s", ethers.utils.formatUint(await deployedOHM.balanceOf(staker1.address), ohmDecimal));
    // console.log("staker1 default sOhmBalance:%s", ethers.utils.formatUint(await deployedSOHM.balanceOf(staker1.address), ohmDecimal));

    //专为测试的初始化
    //init for test
    //给测试用户mint一些DAI
    // await deployedDAI.mint(staker1.address, initialDaiMint);
    // console.log("bonder1 default daiBalance:%s", ethers.utils.formatUnits(await deployedDAI.balanceOf(bonder1.address), daiDecimal));

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

    console.log("bondPrice:%s", await deployedDaiBond.bondPrice());
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
    console.log("deployerAddress: %s", deployer.address);
    console.log("mockDaoAddress: %s", daoUser.address);
    console.log("initialIndex: %s", initialIndex);
    console.log("initialRewardRate: %s", initialRewardRate);
    console.log("zeroAddress: %s", zeroAddress);
    console.log("daiApproveAmount: %s", daiApproveAmount);
    console.log("initialDaiMint: %s", initialDaiMint);
}