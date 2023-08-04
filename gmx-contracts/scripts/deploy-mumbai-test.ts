//执行：npx hardhat run scripts/deploy-mumbai-test.ts --network testnetMumbai

const util = require("ethereumjs-util");
const moment = require("moment");
const fs = require("fs");
const Web3 = require("web3");
const { ethers, artifacts } = require("hardhat");
const { sleep, deploy, waitTrans, upgradeDeploy, upgradeContract } = require("./contractDeploy.ts");
const { A_MINUTES_SECONDS, A_HOUR_SECONDS, A_DAY_SECONDS, A_WEEK_SECONDS, errorConfigs } = require("./constants.ts");
const { HashZero, AddressZero } = ethers.constants;

//用户及地址
let deployer: any;
let deployerAddress = "0x83B99A8f769048d3344eaC186e363Cd249B06891"; //不用填，会自动赋值  TODO 根据实际填写Owner地址
let govAddress = ""; //owner,最好是多签地址

//constant
const isLocalTest = false;
const ethDecimal = 18;
const usdtDecimal = 6;
const ONE_DAY_BLOCK = A_DAY_SECONDS / 2; //每天区块数
const depositFee = 30; // 0.3%
const minExecutionFee = ethers.utils.parseEther("0.0001"); // 0.0001 ETH
const cooldownDuration = 15 * A_MINUTES_SECONDS; //添加流动行之后需要过多久才能赎回
const timeLockBuff = 5 * A_DAY_SECONDS;
const marginFeeBasisPoints = 10; //0.1%
const maxMarginFeeBasisPoints = 500; //5%
//vault相关常量
const liquidationFeeUsd = parseU(2); //添加流动性的手续费
const fundingRateFactor = 100; //非稳定币资金费率因子(用于计算资金费率)
const stableFundingRateFactor = 100; //稳定币资金费率因子(用于计算资金费率)
const fundingInterval = A_HOUR_SECONDS; //资金费率周期时长(秒)
//orderBook
const minPurchaseTokenAmountUsd = parseU(10); // min purchase token amount usd
//PositionRouter
const minBlockDelayKeeper = 0; //头寸数据过多久才能被keeper操作
const minTimeDelayPublic = 3 * A_MINUTES_SECONDS; //头寸数据过多久才能被任何用户操作
const maxTimeDelay = 30 * A_MINUTES_SECONDS; //头寸数据有效时长
//ShortsTrackerTimelock
const buffer = A_MINUTES_SECONDS; // 60 seconds
const updateDelay = 5 * A_MINUTES_SECONDS; // 300 seconds, 5 minutes
const maxAveragePriceChange = 20; // 0.2%
const shortsTrackerKeeperArray = [deployerAddress]; //short头寸的keeper
//PositionManager
const orderKeepers = [deployerAddress]; //头寸的keeper
const liquidators = [deployerAddress]; //清算用户
const partnerContracts = []; //

//合约地址
let deployedVault: any; //Vault
let vaultAddr = "0x0Ed8AEfE3b7CE6Ebd9e9a4E30615eD6b185d4312";
let deployedUSDG: any; //USDG(Token)
let usdgAddr = "";
let deployedWETH: any; //WETH(Token)
let wethAddr = "";
let deployedGLP: any; //GLP(Token)
let glpAddr = "";
let deployedGMX: any; //GMX(Token)
let gmxAddr = "";
let deployedVaultUtils: any; //VaultUtils
let vaultUtilsAddr = "";
let deployedRouter: any; //Router
let routerAddr = "";
let deployedVaultPriceFeed: any; //VaultPriceFeed
let vaultPriceFeedAddr = "";
let deployedVaultErrorController: any; //VaultErrorController
let vaultErrorControllerAddr = "";
let deployedShortsTracker: any; //ShortsTracker
let shortsTrackerAddr = "";
let deployedOrderBook: any; //OrderBook
let orderBookAddr = "";
let deployedPositionManager: any; //PositionManager
let positionManagerAddr = "";
let deployedPositionRouter: any; //PositionRouter
let positionRouterAddr = "";
let deployedGlpManager: any; //GlpManager
let glpManagerAddr = "";
let deployedTimelock: any; //Timelock
let timelockAddr = "";
let deployedVaultReader: any; //VaultReader
let vaultReaderAddr = "";
let deployedRewardRouterV2: any; //RewardRouterV2
let rewardRouterV2Addr = "";
let deployedRewardReader: any; //RewardReader
let rewardReaderAddr = "";
let deployedOrderBookReader: any; //OrderBookReader
let orderBookReaderAddr = "";
let deployedShortsTrackerTimelock: any; //ShortsTrackerTimelock
let shortsTrackerTimelockAddr = "";

//priceFee
let deployedPriceFeedBtcUsd: any; //PriceFeeBtcUSD
let priceFeedBtcUsdAddr = "0x007A22900a3B98143368Bd5906f8E17e9867581b";
let deployedPriceFeedEthUsd: any; //PriceFeeEthUSD
let priceFeedEthUsdAddr = "0x0715A7794a1dc8e42615F059dD6e406A6594651A";
let deployedPriceFeedMaticUsd: any; //PriceFeeMaticUSD
let priceFeedMaticUsdAddr = "0xd0D5e3DB44DE05E9F294BB0a3bEEaF030DE24Ada";

//部署合约
async function deployContract() {
  [deployedVault, vaultAddr] = await deploy("Vault", vaultAddr, []);
  [deployedVaultUtils, vaultUtilsAddr] = await deploy("VaultUtils", vaultUtilsAddr, [vaultAddr]);
  [deployedUSDG, usdgAddr] = await deploy("USDG", usdgAddr, [vaultAddr]);
  [deployedWETH, wethAddr] = await deploy("WETH", wethAddr, ["Wrapped Ether", "WETH", 18]);
  [deployedGLP, glpAddr] = await deploy("GLP", glpAddr, []);
  [deployedGMX, gmxAddr] = await deploy("GMX", gmxAddr, []);
  [deployedVaultReader, vaultReaderAddr] = await deploy("VaultReader", vaultReaderAddr, []);
  [deployedRouter, routerAddr] = await deploy("Router", routerAddr, [vaultAddr, usdgAddr, wethAddr]);
  [deployedRewardRouterV2, rewardRouterV2Addr] = await deploy("RewardRouterV2", rewardRouterV2Addr, []);
  [deployedRewardReader, rewardReaderAddr] = await deploy("RewardReader", rewardReaderAddr, []);
  [deployedVaultPriceFeed, vaultPriceFeedAddr] = await deploy("VaultPriceFeed", vaultPriceFeedAddr, []);
  [deployedShortsTracker, shortsTrackerAddr] = await deploy("ShortsTracker", shortsTrackerAddr, [vaultAddr]);
  [deployedOrderBook, orderBookAddr] = await deploy("OrderBook", orderBookAddr, []);
  [deployedOrderBookReader, orderBookReaderAddr] = await deploy("OrderBookReader", orderBookReaderAddr, []);
  [deployedVaultErrorController, vaultErrorControllerAddr] = await deploy("VaultErrorController", vaultErrorControllerAddr, []);

  const shortsTrackerTimelockArgs = [deployerAddress, buffer, updateDelay, maxAveragePriceChange];
  [deployedShortsTrackerTimelock, shortsTrackerTimelockAddr] = await deploy("ShortsTrackerTimelock", shortsTrackerTimelockAddr, shortsTrackerTimelockArgs);

  const positionManagerArgs = [vaultAddr, routerAddr, shortsTrackerAddr, wethAddr, depositFee, orderBookAddr];
  [deployedPositionManager, positionManagerAddr] = await deploy("PositionManager", positionManagerAddr, positionManagerArgs);

  const positionRouterArgs = [vaultAddr, routerAddr, wethAddr, shortsTrackerAddr, depositFee, minExecutionFee];
  [deployedPositionRouter, positionRouterAddr] = await deploy("PositionRouter", positionRouterAddr, positionRouterArgs);

  const glpManagerArgs = [vaultAddr, usdgAddr, glpAddr, shortsTrackerAddr, cooldownDuration];
  [deployedGlpManager, glpManagerAddr] = await deploy("GlpManager", glpManagerAddr, glpManagerArgs);

  //TODO根据实际部署配置相关参数
  const tokenManager = deployerAddress;
  const mintReceiver = deployerAddress;
  const maxTokenSupply = ethers.utils.parseEther(100000000);
  const timeLockArgs = [
    deployerAddress,
    timeLockBuff,
    tokenManager,
    mintReceiver,
    glpManagerAddr,
    rewardRouterV2Addr,
    maxTokenSupply,
    marginFeeBasisPoints,
    maxMarginFeeBasisPoints,
  ];
  [deployedTimelock, timelockAddr] = await deploy("Timelock", timelockAddr, timeLockArgs);

  //priceFeed
  [deployedPriceFeedBtcUsd, priceFeedBtcUsdAddr] = await deploy("PriceFeed", priceFeedBtcUsdAddr, []);
  [deployedPriceFeedEthUsd, priceFeedEthUsdAddr] = await deploy("PriceFeed", priceFeedEthUsdAddr, []);
  [deployedPriceFeedMaticUsd, priceFeedMaticUsdAddr] = await deploy("PriceFeed", priceFeedMaticUsdAddr, []);
}

//主程序运行前配置
async function initBeforMainProcessLaunch() {
  console.log("initBeforMainProcessLaunch.start");

  //配置TimeLock
  await waitTrans(await deployedTimelock.setVaultUtils(vaultUtilsAddr), "timelock.setVaultUtils");

  //配置GLP  true-只能白名单转账
  await waitTrans(await deployedGLP.setInPrivateTransferMode(true), "GLP.setInPrivateTransferMode");

  //配置vault
  await waitTrans(
    await deployedVault.initialize(routerAddr, usdgAddr, vaultUtilsAddr, liquidationFeeUsd, fundingRateFactor, stableFundingRateFactor),
    "Vault.initialize"
  );
  await waitTrans(await deployedVault.setFundingRate(fundingInterval, fundingRateFactor, stableFundingRateFactor), "vault.setFundingRate");
  await waitTrans(await deployedVault.setVaultUtils(vaultUtilsAddr), "Vault.setVaultUtils");
  await waitTrans(await deployedVault.setErrorController(vaultErrorControllerAddr), "Vault.setErrorController");
  await waitTrans(await deployedVaultErrorController.setErrors(vaultAddr, errorConfigs), "ErrorController.setErrors");
  console.log("initBeforMainProcessLaunch.success");
}

//GlpManager
async function initSupportGlpManager() {
  console.log("initSupportGlpManager.start");
  //配置GlpManager  true-不允许增减流动性
  await waitTrans(await deployedGlpManager.setInPrivateMode(true), "GlpManager.setInPrivateMode");

  //其它合约配置glpManager
  await waitTrans(await deployedUSDG.addVault(glpManagerAddr), "USDG.addVault");
  await waitTrans(await deployedGLP.setMinter(glpManagerAddr), "GLP.setMinter");
  await waitTrans(await deployedVault.setInManagerMode(true), "vault.setInManagerMode");
  await waitTrans(await deployedVault.setManager(glpManagerAddr, true), "vault.setManager");
  console.log("initSupportGlpManager.success");
}

//OrderBook
async function initSupportOrderBook() {
  console.log("initSupportOrderBook.start");
  await waitTrans(
    await deployedOrderBook.initialize(routerAddr, vaultAddr, wethAddr, usdgAddr, minExecutionFee, minPurchaseTokenAmountUsd),
    "orderBook.initialize"
  );
  console.log("initSupportOrderBook.success");
}

//ShortsTrackerTimelock
async function initSupportShortsTrackerTimelock() {
  console.log("initSupportShortsTrackerTimelock.start");
  for (let keeper of shortsTrackerKeeperArray) {
    await waitTrans(deployedShortsTrackerTimelock.setContractHandler(keeper, true), `shortsTrackerTimelock.setContractHandler ${keeper}`);
  }
  console.log("initSupportShortsTrackerTimelock.success");
}

//positionRouter
async function initSupportPositionRouter() {
  console.log("initSupportPositionRouter.start");
  await waitTrans(deployedShortsTrackerTimelock.signalSetHandler(positionRouterAddr, true), "shortsTrackerTimelock.signalSetHandler(positionRouter)");
  await waitTrans(deployedRouter.addPlugin(positionRouterAddr), "router.addPlugin");
  await waitTrans(deployedPositionRouter.setDelayValues(minBlockDelayKeeper, minTimeDelayPublic, maxTimeDelay), "positionRouter.setDelayValues");
  await waitTrans(deployedTimelock.setContractHandler(positionRouterAddr, true), "timelock.setContractHandler(positionRouter)");
  await waitTrans(deployedPositionRouter.setGov(await deployedVault.gov()), "positionRouter.setGov"); //TODO 多签合约,暂用deployer,因此不需要设置
  await waitTrans(deployedPositionRouter.setAdmin(deployerAddress), "positionRouter.setAdmin");
  console.log("initSupportPositionRouter.success");
}

//PositionManager
async function initSupportPositionManager() {
  console.log("initSupportPositionManager.start");

  for (let orderKeeper of orderKeepers)
    await waitTrans(deployedPositionManager.setOrderKeeper(orderKeeper), "deployedPositionManager.setOrderKeeper(orderKeeper)");

  for (let liquidator of liquidators)
    await waitTrans(deployedPositionManager.setLiquidator(liquidator, true), "deployedPositionManager.setLiquidator(liquidator)");

  for (let partnerContract of partnerContracts)
    await waitTrans(deployedPositionManager.setPartner(partnerContract, true), "deployedPositionManager.setPartner(partnerContract)");

  await waitTrans(deployedPositionManager.setShouldValidateIncreaseOrder(false), "deployedPositionManager.setShouldValidateIncreaseOrder(false)");
  await waitTrans(deployedTimelock.setContractHandler(deployedPositionManager.address, true), "timelock.setContractHandler");

  await waitTrans(deployedTimelock.setLiquidator(vaultAddr, deployedPositionManager.address, true), "timelock.setLiquidator");
  await waitTrans(deployedShortsTracker.setHandler(deployedPositionManager.address, true), "shortsTracker.setContractHandler");
  await waitTrans(deployedRouter.addPlugin(deployedPositionManager.address), "router.addPlugin(positionManager)");
  await waitTrans(deployedPositionManager.setGov(await deployedVault.gov()), "deployedPositionManager.setGov");

  console.log("initSupportPositionManager.success");
}

//升级staking合约
async function deployedContractUpgrade() {
  // console.log("upgradeLpBondExternal");
  // await upgradeLpBondExternal(lpBondExternalAddress);
}

async function saveIdoUser() {
  // await updateIDOUser();
  // await mergedAllUser();
}

//需要临时调用的接口
async function tmpSet() {}

async function main() {
  [deployer] = await ethers.getSigners();
  deployerAddress = deployer.address;
  console.log(">>>>deployerAddress:", deployerAddress);

  //部署合约
  await deployContract();
  //初始化金库
  await initBeforMainProcessLaunch();
  //配置GlpManager
  await initSupportGlpManager();
  //配置订单簿
  await initSupportOrderBook();
  //配置ShortsTrackerTimelock
  await initSupportShortsTrackerTimelock();
  //配置PositionRouter
  await initSupportPositionRouter();
  //配置PositionManager
  await initSupportPositionManager();

  // 需要临时调用的接口在这里写
  // await tmpSet();
  console.log("deploy finish");
}

function parseU(value: number) {
  return ethers.utils.parseUnits(String(value), usdtDecimal);
}

main()
  .then(() => process.exit())
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

export {};
