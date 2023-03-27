//执行：npx hardhat run scripts/deploy-mumbai-test.js --network testMumbai
const { expect, use } = require("chai")
const { solidity } = require("ethereum-waffle")
const { deployOrAttachPro } = require("./shared/contractDeploy");
const { sendTxnPro } = require("./shared/helpers")
const { expandDecimals, getBlockTime, increaseTime, mineBlock, reportGasUsed, newWallet } = require("./shared/utilities")
const { toUsd } = require("./shared/units");
const { vaultErrors, getUsdtConfig, getEthConfig } = require("./shared/vaultHelpers");
const { toChainlinkPrice } = require("./shared/chainlink");
const { parseEther } = require("ethers/lib/utils");
// const { toUsd, toNormalizedPrice } = require("../shared/units")
// const { initVault, getBnbConfig, getBtcConfig, getDaiConfig } = require("../Vault/helpers")


use(solidity)
let deployedUsdt, usdtAddr = "0xb645aEBA1B3b9cD82c23aC8E638384Ef42b8e09B";
let deployedWeth, wethAddr = "0xa82101A4f8C21a34a7b7a8eBf7f3915E38Acb4bc";
let deployedGlp, glpAddr = "0x3ab8ca663a5bab172c4C2DD12c714CBC4f55b281";
let deployedVaultErrorController, vaultErrorControllerAddr = "0xb2AFf53Dbf1C05636B359C14E6A15669619f8Ac2";
let deployedVaultUtils, vaultUtilsAddr = "0xEc36a7f2FF28a4b669522bc2a05C458f0BA3b008";
let deployedVault, vaultAddr = "0x436EA493Ab154399022c1dCc5BECbc11012B431d";
let deployedUsdg, usdgAddr = "0xc1BC2dA344b76E280aF1ea4629D762e5399BA3D9";
let deployedVaultPriceFeed, vaultPriceFeedAddr = "0x2590b749eac6AEF44e482362549a3C8a186a37DF";
let deployedShortsTracker, shortsTrackerAddr = "0xE698EDAdfF112Baf3450785F9d3ad3aeb3093247";
let deployedRouter, routerAddr = "0x7C08f0C96EDa2891C60153B8E5aB18F4317dD53E";
let deployedReader, readerAddr = "0xA162d077Da10f7660dfD60d4Ddf5da0d9665250F";
let deployedVaultReader, vaultReaderAddr = "0x31b78E030d9Ba712B75B18FD046e7B54b303EAec";
let deployedOrderBookReader, orderBookReaderAddr = "0x09e4073d495A5E4bd7b20b0761037Ad36CB1Bd37";
let deployedOrderBook, orderBookAddr = "0xFf253a6c9A330175e049BFBFA31cBcDABc850115";
let deployedPositionRouter, positionRouterAddr = "0xBA8228A661410451977818e7969E39CF26bE5995";
let deployedGlpManager, glpManagerAddr = "0x50AaDD01a21218605C955500C09F6Eb8EA2d131e";
let deployedUsdtPriceFeed, usdtPriceFeedAddr = "0xdEecBeBF2Ad9CB3C4f608fAe3B8578Db043c9C8a";
let deployedWethPriceFeed, wethPriceFeedAddr = "0x87a59b19dD29791019096539F659e8c677836d0B";
// let deployedReferralStorage, referralStorageAddr = "";

//通用常量
const { HashZero, AddressZero } = ethers.constants
const usdtDecimal = 18;

//参数
const cooldownDuration = 0;//资金冻结期(添加流动性后，需要隔多久才能赎回)
const depositFeeFee = "30";//添加流动性的手续费,分母是：10000
const minExecutionFee = ethers.utils.parseEther("0.0003");//最低交易执行费（不同链的取值可能不一样）
const executionFee = "17000000000000000";//合约多空头的执行费

async function deployContract() {
    //USDT
    deployedUsdt = await deployOrAttachPro("FaucetToken", usdtAddr, ["Tether", "USDT", 18, expandDecimals(1000, 18)]);
    usdtAddr = deployedUsdt.address;
    console.log(`USDT:${usdtAddr}`);
    //WETH
    deployedWeth = await deployOrAttachPro("WETH", wethAddr, ["WETH", "WETH", 18]);
    wethAddr = deployedWeth.address;
    //GLP
    deployedGlp = await deployOrAttachPro("GLP", glpAddr, []);
    glpAddr = deployedGlp.address;
    //Vault
    deployedVault = await deployOrAttachPro("Vault", vaultAddr, []);
    vaultAddr = deployedVault.address;
    //VaultErrorController
    deployedVaultErrorController = await deployOrAttachPro("VaultErrorController", vaultErrorControllerAddr, []);
    vaultErrorControllerAddr = deployedVaultErrorController.address;
    //VaultUtils
    deployedVaultUtils = await deployOrAttachPro("VaultUtils", vaultUtilsAddr, [vaultAddr]);
    vaultUtilsAddr = deployedVaultUtils.address;
    //USDG
    deployedUsdg = await deployOrAttachPro("USDG", usdgAddr, [vaultAddr]);
    usdgAddr = deployedUsdg.address;
    //VaultPriceFeed
    deployedVaultPriceFeed = await deployOrAttachPro("VaultPriceFeed", vaultPriceFeedAddr, []);
    vaultPriceFeedAddr = deployedVaultPriceFeed.address;
    //ShortsTracker
    deployedShortsTracker = await deployOrAttachPro("ShortsTracker", shortsTrackerAddr, [vaultAddr]);
    shortsTrackerAddr = deployedShortsTracker.address;
    //Router
    deployedRouter = await deployOrAttachPro("Router", routerAddr, [vaultAddr, usdgAddr, wethAddr]);
    routerAddr = deployedRouter.address;
    //Reader
    deployedReader = await deployOrAttachPro("Reader", readerAddr, []);
    readerAddr = deployedReader.address;
    //VaultReader
    deployedVaultReader = await deployOrAttachPro("VaultReader", vaultReaderAddr, []);
    vaultReaderAddr = deployedVaultReader.address;
    //OrderBookReader
    deployedOrderBookReader = await deployOrAttachPro("OrderBookReader", orderBookReaderAddr, []);
    orderBookReaderAddr = deployedOrderBookReader.address;
    //OrderBook
    deployedOrderBook = await deployOrAttachPro("OrderBook", orderBookAddr, []);
    orderBookAddr = deployedOrderBook.address;
    //PositionRouter
    let positionRouterParam = [vaultAddr, routerAddr, wethAddr, shortsTrackerAddr, depositFeeFee, minExecutionFee];
    deployedPositionRouter = await deployOrAttachPro("PositionRouter", positionRouterAddr, positionRouterParam);
    positionRouterAddr = deployedPositionRouter.address;
    //GlpManager
    let glpManagerParam = [vaultAddr, usdgAddr, glpAddr, shortsTrackerAddr, cooldownDuration];
    deployedGlpManager = await deployOrAttachPro("GlpManager", glpManagerAddr, glpManagerParam);
    glpManagerAddr = deployedGlpManager.address;
    //PriceFee-USDT
    deployedUsdtPriceFeed = await deployOrAttachPro("PriceFeed", usdtPriceFeedAddr, []);
    usdtPriceFeedAddr = deployedUsdtPriceFeed.address;
    console.log(`usdtPriceFeed:${usdtPriceFeedAddr}`);
    //PriceFee-WETH
    deployedWethPriceFeed = await deployOrAttachPro("PriceFeed", wethPriceFeedAddr, []);
    wethPriceFeedAddr = deployedWethPriceFeed.address;
    console.log(`wethPriceFeed:${wethPriceFeedAddr}`);
    // //ReferralStorage
    // deployedReferralStorage = await deployOrAttachPro("ReferralStorage", referralStorageAddr, []);
    // referralStorageAddr = deployedReferralStorage.address;
}

//合约部署之后初始化
async function initAfterDeployed() {
    //GLP
    await sendTxnPro(deployedGlp.setMinter(glpManagerAddr, true), "glp.setMinter");
    //Vault
    await sendTxnPro(deployedVault.initialize(routerAddr, usdgAddr, vaultPriceFeedAddr, toUsd(5), 600, 600), "vault.initialize");
    await sendTxnPro(deployedVault.setErrorController(vaultErrorControllerAddr), "Vault.setErrorController");
    await sendTxnPro(deployedVault.setVaultUtils(vaultUtilsAddr), "Vault.setVaultUtils");
    await sendTxnPro(deployedVaultErrorController.setErrors(vaultAddr, vaultErrors), "VaultErrorController.setErrors");

    //add token-USDT
    await sendTxnPro(deployedUsdtPriceFeed.setLatestAnswer(toChainlinkPrice(10000)), "usdtPriceFee.setLatestAnswer usdt");
    await sendTxnPro(deployedVaultPriceFeed.setTokenConfig(usdtAddr, usdtPriceFeedAddr, 8, false), "usdtPriceFee.setTokenConfig usdt");
    await sendTxnPro(deployedVault.setTokenConfig(...getUsdtConfig(deployedUsdt, deployedUsdtPriceFeed)), "vault.setTokenConfig usdt")
    //add token-WETH
    await sendTxnPro(deployedWethPriceFeed.setLatestAnswer(toChainlinkPrice(10000)), "usdtPriceFee.setLatestAnswer usdt");
    await sendTxnPro(deployedVaultPriceFeed.setTokenConfig(wethAddr, wethPriceFeedAddr, 8, false), "usdtPriceFee.setTokenConfig weth");
    await sendTxnPro(deployedVault.setTokenConfig(...getEthConfig(deployedWeth, deployedWethPriceFeed)), "vault.setTokenConfig weth")

    //router add plungin
    await sendTxnPro(deployedRouter.addPlugin(positionRouterAddr), "Router.addPlugin");
}

//临时调用
async function tempSet() {
    // const amount = expandDecimals(10000, usdtDecimal);
    // await sendTxnPro(deployedUsdt.mint("0x910cBA72870aaCA57BdFC8A98A76bA46F0a08573", amount), "mint usdt to positionUser");

    const rsp = await deployedPositionRouter.minExecutionFee();
    console.log("rsp>>>",rsp);
}

async function main() {
    //合约部署
    await deployContract();
    //合约部署之后进行初始化
    // await initAfterDeployed();
    //临时调用
    await tempSet();
}
main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error)
        process.exit(1)
    })
