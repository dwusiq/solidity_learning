# 工程描述


## 合约
|合约|描述|目录|继承|
|-|-|-|-|
|`OlympusERC20Token`|`OHM`主币|`/`|`ERC20Permit, IOHM, OlympusAccessControlled` |
|`ERC20Permit`|用户线下签名`approve`函数，其它用户可以线上验证这个签名串，然后自行调用`approve`获得`owner`的`allowance`份额|`/types/ERC20Permit.sol`|`ERC20, IERC20Permit, EIP712` |
|`OlympusAccessControlled`|各权限控制的`modifier`|`/types/OlympusAccessControlled.sol`||
|`OlympusAuthority`|权限管理,允许变更相关地址|`/`|`IOlympusAuthority, OlympusAccessControlled `|
|`OlympusStaking`|每个纪元（一个时间段）触发一次价格调整（Rebase的代币都有一个目标价格，当价格高于目标价时，就会自动增发；反之会进行通缩）|`/`|`OlympusAccessControlled `|
|``||||
|``||||
|``||||
|``||||
|``||||

## 部署合约
###  依赖合约地址准备
* `DAI`
*  `sushiRouter`
*  `uniRouter`
*  `FRAX`
*  `LUSD`

### 部署步骤
* 部署`OlympusAuthority`
* 部署`OlympusTokenMigrator`,(依赖`OlympusAuthority`地址)
* 部署·`OlympusERC20Token`,(依赖`OlympusAuthority`地址)
* 部署`sOlympus`
* 部署`gOHM`,(依赖`OlympusTokenMigrator`、`sOlympus`地址)
* 部署`OlympusTreasury`,(依赖`OlympusERC20Token`、`OlympusAuthority`地址)
* 部署`OlympusStaking`,(依赖`OlympusERC20Token`、`sOlympus`、`gOHM`、`OlympusAuthority`地址)
* 部署`Distributor`,(依赖`OlympusTreasury`、`OlympusERC20Token`、`OlympusStaking`、`OlympusAuthority`)




### 其它

* 执行价格 = RFV / 溢价 {溢价 ≥ 1}
* 溢价 = 1 +（债务比率 * BCV）
* 债务比率 = 未偿债券 / OHM 供应
* 无风险价值 = (LP / Total LP) * 2sqrt(Constant Product) 
  - 无风险价值：Risk-Free Value


* 质押：您将把您的 OHM 发送到 Staking 合约并以 1:1 的比例接收 sOHM。sOHM可以被兑换成OHM。
* 变基（rebase）：

*   Bond Control Variable ([BCV](https://docs.olympusdao.finance/references/glossary#bcv)) 