//执行：npx hardhat run scripts/deploy-mumbai-test.ts --network testnetMumbai

const util = require("ethereumjs-util");
let moment = require("moment");
const fs = require("fs");
let Web3 = require("web3");
const { ethers, artifacts } = require("hardhat");
const {
  sleep,
  deploy,
  upgradeDeploy,
  upgradeContract,
} = require("./contractDeploy.ts");
const {
  A_MINUTES_SECONDS,
  A_HOUR_SECONDS,
  A_DAY_SECONDS,
  A_WEEK_SECONDS,
} = require("./constants.ts");
let ONE_DAY_BLOCK = A_DAY_SECONDS / 2; //每天区块数
const { HashZero, AddressZero } = ethers.constants;

//用户及地址
let deployer: any,
  deployerAddress = ""; //不用填，会自动赋值

//constant
const isLocalTest = false;
let ethDecimal = 18; //
let usdtDecimal = 6; //

//合约地址
let deployedVault: any,
  vaultAddr = "0x0Ed8AEfE3b7CE6Ebd9e9a4E30615eD6b185d4312"; //Vault

//部署合约
async function deployContract() {
  [deployedVault, vaultAddr] = await deploy("Vault", vaultAddr, []);
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
