import {HardhatUserConfig} from 'hardhat/types';
import 'hardhat-deploy';
import 'hardhat-deploy-ethers';

const config: HardhatUserConfig = {
  solidity: {
    version: '0.6.12', // 支持solidity版本
  },
  // namedAccounts: {
  //   deployer: 0,
  // },
};
export default config;