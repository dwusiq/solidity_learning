//执行：npx hardhat run scripts/deploy-arbitrum-goerli.ts --network testnetArbitrumGoerli
import { ethers } from "ethers";

import { ContractInfo, DefaultParam, initLayerZeroTest, initOrDeployContract, tmpSet } from "./contract-method-invoke";
import { ENV } from "./constants";

const defaultParam: DefaultParam = {
  env: ENV.MAIN_NET,
  deployerAddress: "",
  // link-test: https://layerzero.gitbook.io/docs/technical-reference/testnet/testnet-addresses
  // link-main: https://layerzero.gitbook.io/docs/technical-reference/mainnet/supported-chain-ids
  endpointAddress: "0x6aB5Ae6822647046626e83ee6dB8187151E1d5ab", //根据当前端点合约地址
  destinationLayerZeroTestAddress: "0x2D197c72EAbCDd550f26454Db4D5B18b89575061",
};

//合约地址
const sourceContract: ContractInfo = {
  layerZeroTestAddr: "0x6a9D9c1EcE5Bc1b747DB2FF7f8F1770aFC7AD4b4", //layerZeroTest
};

async function main() {
  //部署合约
  await initOrDeployContract(defaultParam, sourceContract);
  //从预售合约提币
  // await initLayerZeroTest();
  //发送跨链消息
  // await sendCrossChainMessage();
  //升级合约
  // await deployedContractUpgrade();
  // 需要临时调用的接口在这里写
  await tmpSet();
}

main()
  .then(() => process.exit())
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

export {};