const { expect, use } = require("chai")
const { solidity } = require("ethereum-waffle")
const { deployOrAttach } = require("../../scripts/shared/contractDeploy");
const { sendTxn } = require("../../scripts/shared/helpers")
const { expandDecimals, getBlockTime, increaseTime, mineBlock, reportGasUsed, newWallet } = require("../../scripts/shared/utilities")
const { toUsd } = require("../../scripts/shared/units");
const { vaultErrors, getUsdtConfig, getEthConfig } = require("../../scripts/shared/vaultHelpers");
const { toChainlinkPrice } = require("../../scripts/shared/chainlink");
const { parseEther } = require("ethers/lib/utils");
// const { toUsd, toNormalizedPrice } = require("../shared/units")
// const { initVault, getBnbConfig, getBtcConfig, getDaiConfig } = require("../Vault/helpers")

use(solidity)
let deployedUsdt, usdtAddr = "";
let deployedWeth, wethAddr = "";
let deployedVaultErrorController, vaultErrorControllerAddr = "";
let deployedVaultUtils, vaultUtilsAddr = "";
let deployedVault, vaultAddr = "";
let deployedGlp, glpAddr = "";
let deployedUsdg, usdgAddr = "";
let deployedVaultPriceFeed, vaultPriceFeedAddr = "";
let deployedShortsTracker, shortsTrackerAddr = "";
let deployedRouter, routerAddr = "";
let deployedReader, readerAddr = "";
let deployedVaultReader, vaultReaderAddr = "";
let deployedOrderBookReader, orderBookReaderAddr = "";
let deployedOrderBook, orderBookAddr = "";
let deployedPositionRouter, positionRouterAddr = "";
let deployedGlpManager, glpManagerAddr = "";
let deployedUsdtPriceFeed, usdtPriceFeedAddr = "";
let deployedWethPriceFeed, wethPriceFeedAddr = "";
let deployedReferralStorage, referralStorageAddr = "";


//通用常量
const { HashZero, AddressZero } = ethers.constants
const usdtDecimal = 18;

//参数
const cooldownDuration = 0;//资金冻结期(添加流动性后，需要隔多久才能赎回)
const depositFeeFee = "30";//添加流动性的手续费,分母是：10000
const minExecutionFee = ethers.utils.parseEther("0.0003");//最低交易执行费（不同链的取值可能不一样）
const executionFee = "17000000000000000";//合约多空头的执行费

describe("gmx test", function () {
  const provider = waffle.provider
  const [wallet, liquidityUser, positionUser, swapUser, user0, user1, user2, user3] = provider.getWallets();
  beforeEach(async () => {
    //USDT
    deployedUsdt = await deployOrAttach("FaucetToken", usdtAddr, ["Tether", "USDT", 18, expandDecimals(1000, 18)]);
    usdtAddr = deployedUsdt.address;
    //WETH
    deployedWeth = await deployOrAttach("WETH", wethAddr, ["WETH", "WETH", 18]);
    wethAddr = deployedWeth.address;
    //Vault
    deployedVault = await deployOrAttach("Vault", vaultAddr, []);
    vaultAddr = deployedVault.address;
    //VaultErrorController
    deployedVaultErrorController = await deployOrAttach("VaultErrorController", vaultErrorControllerAddr, []);
    vaultErrorControllerAddr = deployedVaultErrorController.address;
    //VaultUtils
    deployedVaultUtils = await deployOrAttach("VaultUtils", vaultUtilsAddr, [vaultAddr]);
    vaultUtilsAddr = deployedVaultUtils.address;
    //GLP
    deployedGlp = await deployOrAttach("GLP", glpAddr, []);
    glpAddr = deployedGlp.address;
    //USDG
    deployedUsdg = await deployOrAttach("USDG", usdgAddr, [vaultAddr]);
    usdgAddr = deployedUsdg.address;
    //VaultPriceFeed
    deployedVaultPriceFeed = await deployOrAttach("VaultPriceFeed", vaultPriceFeedAddr, []);
    vaultPriceFeedAddr = deployedVaultPriceFeed.address;
    //ShortsTracker
    deployedShortsTracker = await deployOrAttach("ShortsTracker", shortsTrackerAddr, [vaultAddr]);
    shortsTrackerAddr = deployedShortsTracker.address;
    //Router
    deployedRouter = await deployOrAttach("Router", routerAddr, [vaultAddr, usdgAddr, wethAddr]);
    routerAddr = deployedRouter.address;
    //Reader
    deployedReader = await deployOrAttach("Reader", readerAddr, []);
    readerAddr = deployedReader.address;
    //VaultReader
    deployedVaultReader = await deployOrAttach("VaultReader", vaultReaderAddr, []);
    vaultReaderAddr = deployedVaultReader.address;
    //OrderBookReader
    deployedOrderBookReader = await deployOrAttach("OrderBookReader", orderBookReaderAddr, []);
    orderBookReaderAddr = deployedOrderBookReader.address;
    //OrderBook
    deployedOrderBook = await deployOrAttach("OrderBook", orderBookAddr, []);
    orderBookAddr = deployedOrderBook.address;
    //PositionRouter
    let positionRouterParam = [vaultAddr, routerAddr, wethAddr, shortsTrackerAddr, depositFeeFee, minExecutionFee];
    deployedPositionRouter = await deployOrAttach("PositionRouter", positionRouterAddr, positionRouterParam);
    positionRouterAddr = deployedPositionRouter.address;
    //GlpManager
    let glpManagerParam = [vaultAddr, usdgAddr, glpAddr, shortsTrackerAddr, cooldownDuration];
    deployedGlpManager = await deployOrAttach("GlpManager", glpManagerAddr, glpManagerParam);
    glpManagerAddr = deployedGlpManager.address;
    //PriceFee-USDT
    deployedUsdtPriceFeed = await deployOrAttach("PriceFeed", usdtPriceFeedAddr, []);
    usdtPriceFeedAddr = deployedUsdtPriceFeed.address;
    //PriceFee-WETH
    deployedWethPriceFeed = await deployOrAttach("PriceFeed", wethPriceFeedAddr, []);
    wethPriceFeedAddr = deployedWethPriceFeed.address;
    //ReferralStorage
    deployedReferralStorage = await deployOrAttach("ReferralStorage", referralStorageAddr, []);
    referralStorageAddr = deployedReferralStorage.address;
  });

  it("init after deployed", async () => {
    //GLP
    await sendTxn(deployedGlp.setMinter(glpManagerAddr, true), "glp.setMinter");
    //Vault
    await sendTxn(deployedVault.initialize(routerAddr, usdgAddr, vaultPriceFeedAddr, toUsd(5), 600, 600), "vault.initialize");
    await sendTxn(deployedVault.setErrorController(vaultErrorControllerAddr), "Vault.setErrorController");
    await sendTxn(deployedVault.setVaultUtils(vaultUtilsAddr), "Vault.setVaultUtils");
    await sendTxn(deployedVaultErrorController.setErrors(vaultAddr, vaultErrors), "VaultErrorController.setErrors");

    //add token-USDT
    await sendTxn(deployedUsdtPriceFeed.setLatestAnswer(toChainlinkPrice(10000)), "usdtPriceFee.setLatestAnswer usdt");
    await sendTxn(deployedVaultPriceFeed.setTokenConfig(usdtAddr, usdtPriceFeedAddr, 8, false), "usdtPriceFee.setTokenConfig usdt");
    await sendTxn(deployedVault.setTokenConfig(...getUsdtConfig(deployedUsdt, deployedUsdtPriceFeed)), "vault.setTokenConfig usdt")
    //add token-WETH
    await sendTxn(deployedWethPriceFeed.setLatestAnswer(toChainlinkPrice(10000)), "usdtPriceFee.setLatestAnswer usdt");
    await sendTxn(deployedVaultPriceFeed.setTokenConfig(wethAddr, wethPriceFeedAddr, 8, false), "usdtPriceFee.setTokenConfig weth");
    await sendTxn(deployedVault.setTokenConfig(...getEthConfig(deployedWeth, deployedWethPriceFeed)), "vault.setTokenConfig weth")


    //router add plungin
    await sendTxn(deployedRouter.addPlugin(positionRouterAddr), "Router.addPlugin");
  });

  it("addLiquidity test", async () => {
    //add USDT
    const amount = expandDecimals(5000, usdtDecimal);
    await sendTxn(deployedUsdt.mint(liquidityUser.address, amount), "mint usdt to liquidityUser");
    await sendTxn(deployedUsdt.connect(liquidityUser).approve(glpManagerAddr, amount), "liquidityUser approve usdt to glpManager");
    await sendTxn(deployedGlpManager.connect(liquidityUser).addLiquidity(usdtAddr, amount, amount, amount), "router.addLiquidity(usdt)");

    //add WETH
    await sendTxn(await deployedWeth.connect(liquidityUser).deposit({ value: amount }), "deposit weth");
    await sendTxn(deployedWeth.connect(liquidityUser).approve(glpManagerAddr, amount), "weth.approve(router)");
    await sendTxn(deployedGlpManager.connect(liquidityUser).addLiquidity(wethAddr, amount, amount, amount), "router.addLiquidity(weth)");
  });

  it("position test", async () => {
    //approve Plugin
    await sendTxn(deployedRouter.connect(positionUser).approvePlugin(positionRouterAddr), "Router.approvePlugin")

    //approve usdt
    const amount = expandDecimals(20, usdtDecimal);
    await sendTxn(deployedUsdt.mint(positionUser.address, amount), "mint usdt to positionUser");
    await sendTxn(deployedUsdt.connect(positionUser).approve(routerAddr, amount), "positionUser approve usdt to positionRouterAddr");

    //increase position
    const increaseLongPositionParams = [
      [usdtAddr, wethAddr], // _path
      wethAddr, // _indexToken
      amount, // _amountIn
      0, // _minOut
      toUsd(100), // _sizeDelta
      true, // _isLong
      toUsd(5000), // _acceptablePrice
      parseEther("0.017"), // _executionFee   17000000000000000
      HashZero, // _referralCode
      AddressZero//_callbackTarget
    ]
    await sendTxn(deployedPositionRouter.connect(positionUser).createIncreasePosition(...increaseLongPositionParams, { value: executionFee }), "positionRouter.createIncreasePosition(increaseLongPositionParams)")

    //decrease position
    const decreaseLongPositionParams = [
      [wethAddr], // _collateralToken
      wethAddr, // _indexToken
      toUsd(0), // _collateralDelta
      toUsd(20), // _sizeDelta
      true, // _isLong
      positionUser.address,  // _receiver
      toUsd(2900),  // _acceptablePrice
      0, // _minOut
      parseEther("0.017"), // _executionFee   17000000000000000
      false, // _withdrawETH
      AddressZero//_callbackTarget
    ]
    await sendTxn(deployedPositionRouter.connect(positionUser).createDecreasePosition(...decreaseLongPositionParams, { value: executionFee }), "positionRouter.createDecreasePosition(decreaseLongPositionParams)")
  });


  it("swap test", async () => {
    const amount = expandDecimals(20, usdtDecimal);
    const minOut = expandDecimals(19, usdtDecimal);
    await deployedUsdt.mint(swapUser.address, amount)
    await deployedUsdt.connect(swapUser).approve(routerAddr, amount)
    await deployedRouter.connect(swapUser).swap([usdtAddr, wethAddr], amount, minOut, swapUser.address)
  });
})
