# **ReadMe**

## LayerZeroTest

#### 描述

简单的消息跨链传输。即把字符串从一条链传递到另外一条链

#### 使用

- 合约`LayerZeroTest.sol`合约的构造函数配置两条链的端点合约地址，及目标链的链ID,可在[测试](https://layerzero.gitbook.io/docs/technical-reference/testnet/testnet-addresses) 或[主网](https://layerzero.gitbook.io/docs/technical-reference/mainnet/supported-chain-ids)找到链对应的 ID 及端点合约地址
- 分别在两条链部署`LayerZeroTest.sol`合约，入参`_lzEndpoint`为当前链的端点合约地址
- 分别调用刚部署的两个合约的`trustAddress`函数配置信任合约地址,即目标链部署的`LayerZeroTest.sol`合约地址
- 调用跨链函数`send`发送消息到另外一条链。 注意：需要通过 value 属性传递 gas 费，可多传一点，多余的会返还
