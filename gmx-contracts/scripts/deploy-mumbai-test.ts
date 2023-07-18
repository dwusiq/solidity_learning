//执行：npx hardhat run scripts/deploy-mumbai-test.ts --network testnetMumbai

const util = require("ethereumjs-util");
const moment = require("moment");
const fs = require("fs");
const Web3 = require("web3");
const { ethers, artifacts } = require("hardhat");
const { sleep, deploy, upgradeDeploy, upgradeContract } = require("./contractDeploy.ts");
const { A_MINUTES_SECONDS, A_HOUR_SECONDS, A_DAY_SECONDS, A_WEEK_SECONDS } = require("./constants.ts");
const { HashZero, AddressZero } = ethers.constants;

//用户及地址
let deployer: any;
let deployerAddress = ""; //不用填，会自动赋值

//constant
const isLocalTest = false;
const ethDecimal = 18;
const usdtDecimal = 6;
const ONE_DAY_BLOCK = A_DAY_SECONDS / 2; //每天区块数
const depositFee = 30; // 0.3%
const minExecutionFee = ethers.utils.parseEther("0.0001"); // 0.0001 ETH
const cooldownDuration = 15 * 60;
const timeLockBuff = 5 * 24 * 60 * 60;
const marginFeeBasisPoints = 10; //0.1%
const maxMarginFeeBasisPoints = 500; //5%

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
}

//主程序运行前配置
async function initBeforMainProcessLaunch() {
  console.log("initBeforLaunch.start");
  //注册默认用户
  // const userInfoArray = [{ nodeLevel: 0, slfeAddress: deployerAddress, slfeCode: "0xAbcd1234", inviter: AddressZero, inviterCode: "0x00000000" }];
  // await waitTrans(await deployedSignUpContract.setUserInfo(userInfoArray), "set user register info");
  //sThsToken合约配置质押合约地址
  // await waitTrans(await deployedSThsToken.setAddress([0], [stakingAddress]), "sThsToken set stakingAddress");
  // //国库添加thsToken合约地址
  // await waitTrans(await deployedTreasury.setThsToken(deployedThsToken.address), "treasury set thsAddress");
  console.log("initAfterPresaleFinish.success");
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

  // 需要临时调用的接口在这里写
  // await tmpSet();
  console.log("deploy finish");
}

main()
  .then(() => process.exit())
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

export {};
