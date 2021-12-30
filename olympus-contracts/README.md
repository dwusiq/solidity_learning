# 工程描述


## 合约
|合约|描述|目录|继承|
|-|-|-|-|
|`OlympusERC20Token`|`OHM`主币|`/`|`ERC20Permit, IOHM, OlympusAccessControlled` |
|`ERC20Permit`|用户线下签名`approve`函数，其它用户可以线上验证这个签名串，然后自行调用`approve`获得`owner`的`allowance`份额|`/types/ERC20Permit.sol`|`ERC20, IERC20Permit, EIP712` |
|`OlympusAccessControlled`|各权限控制的`modifier`|`/types/OlympusAccessControlled.sol`||
|`OlympusAuthority`|权限管理,允许变更相关地址|`/`|`IOlympusAuthority, OlympusAccessControlled `|
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