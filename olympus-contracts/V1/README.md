# `OlympusDao`合约描述

## 一、OHM简述
**原理：** OHM代币被其它加密货币（如I）支持，但不是一对一挂钩，在OHM的价格比DAI低时，合约会回购OHM销毁，让其价格提升到1。假如OHM价格高时，合约会供应更多的OHM出售，让价格回落到1（前提是有人拿DAI来买OHM）。因此协议允许OHM对DAI的价格>=1

**目的：**  OlympusDAO 希望 OHM可以成为一个尽管市场波动性高但仍有办法把持住购买力的货币

**用户参与形式：** 

* staking(质押)：当价格上涨会触发合约铸造新的OHM,而这些新铸造的OHM中，有很大一部分会分配给质押OHM的用户，作为质押OHM的收益。
* bonding(债券)：用户用合约指定的币种(或LP)来购买`OHM`,这样用户得到`OHM`,并且用户支付的资产将归属于合约。
* selling(出售)：用户出售自己手中的OHM获利。

## 二、合约理解
#### 用户与核心合约交互的资产流动方向
##### `staking`合约
> 质押`OHM`赚取分红

* `stake`（质押`OHM`）
  -  `sOHM.rebase()` -> `sOHM`的`_totalSupply`增加  ->  `_gonsPerFragment`减小  ->  每份`gon`折算的`sOHM`增多
  - `distributor.distribute()` -> 确定下次分红的块高 -> 给`staking`合约在内的地址铸造`OHM`,份额为`IERC20(OHM).totalSupply().mul(_rate).div(1000000)`，但是要依赖`Treasury`合约存在多余的储备金，否则报错。
  - 计算下次分红的`OHM`份额
  - 将用户的`OHM`份额转到当前合约 -> 累加该用户质押的`OHM`份额和待释放`gon`份额 -> 将本次质押`OHM`对应的`sOHM`份额转到`StakingWarmup`合约
* `claim`(提取质押的收益`sOHM`)
  - 判断最后一次质押时所在的周期是否已结束 -> 移除质押记录 -> `StakingWarmup.retrieve()` ->  从`StakingWarmup`将应得的`sOHM`转给收益地址。
* `forfeit`(放弃收益，直接提取自己的所有`OHM`)
  - 移除质押记录 -> `StakingWarmup.retrieve()` ->  从`StakingWarmup`将应得的`sOHM`转给`staking`合约。
  - 将用户质押的`OHM`返还给用户
* `unstake`(用`sOHM`兑换`OHM`)
  - 用户可以自行选择要不要触发`rebase()`
  - 从用户账户转`sOHM`到`staking`合约
  - 从`staking`合约将`sOHM`对应的`OHM`份额转给用户
  
##### `BondDepository`合约
> 以债券的形式用`Token`折扣价购买`OHM`

* `deposit`(折扣价购买`OHM`)
  - 分别计算：用于`rebase`分红份额、该购买者应付报酬份额、手续费份额
  - 将用户本次支付的`Token`转到`BondDepositroy`合约 -> 调用`Treasury.deposit()`
  - `Treasury.deposit()` -> 将调用者的`Token`转到`Treasury`合约 -> 给发送者铸造`OHM`(用于支付购买者的报酬和支付手续费) -> 储备金值累加
* `redeem`(用户的债券报酬线性释放，可以不定期收割，可以选择是否质押这些收益)
  - 计算到目前为止需要支付给用户的报酬(`OHM`) -> `BondDepository`转`OHM`给用户，或者帮用户质押到`staking`合约

##### `Treasury`国库合约
> 支持存入储备金得到`OHM`，支持有权限的用户销毁`OHM`得到储备金

* `deposit`(被授权的地址存入储备金赚取`OHM`)
  - 将调用者的`Token`转到`Treasury`合约 -> 给发送者铸造`OHM`(用于支付购买者的报酬和支付手续费) -> 储备金值累加
* `withdraw`(被授权的地址销毁`OHM`得到`DAI`)
  - 计算销毁的`OHM`份额 -> 销毁`OHM` -> 将储备金的`Token`转给用户

## 三、合约理解的关键点

* `sOHM`合约的关注点：
  - 协议内计算份额是用`gon`,但协议外从用户的角度都是取`sOHM`的份额（即：`sOHM`对外，gon对内）
  - `sOHM`份额=`gon`份额/`_gonsPerFragment`，其中`_gonsPerFragment`跟`_totalSupply`成反比，`_gonsPerFragment`表示每单位`sOHM`价值多少`gon`
  - 每次调用`rebase`函数都会执行`_gonsPerFragment = TOTAL_GONS.div(_totalSupply);`,由`balanceOf`接口得知，则用户持有相同`gon`的前提下，`_gonsPerFragment`越小，则`sOHM`值越大
  
* `distributor`合约的关注点（这个合约解决了分红`OHM`的来源）
  - 这个合约配置在每个周期(`epoch`)给`staking`合约铸造多少`OHM`，这些`OHM`份额就是`staker`的收益来源
  - `await deployedDistributor.addRecipient(stakingAddress, initialRewardRate)`就是配置每周期的分红总额
  - 每次`staking`合约触发`rebase`都会调用`IDistributor(distributor).distribute()`产出用于分红的`OHM`
  - 因此每个周期都会有新的`OHM`产生
  
* `BondDepository`合约：
  - 用户购买债券收获到的`OHM`份额=无风险价值/价格=支付的资产份额折算回`OHM`的份额/价格
  

## 四、环境部署关注点
##### `staking`合约
* `_epochLength`: 每经过多少区块`rebase`一次，值跟`distributor`合约保持一致。
* `_firstEpochNumber`: 首个`epoch`周期起始区块。
* `_firstEpochBlock`：首个`epoch`周期结束区块。

##### `StakingDistributor`合约
* `_rewardRate`：  奖励比率是于每次的变基 (rebase) 时分配给每个质押者相对于总供应量的配置百分比 ,计算公式是`IERC20(OHM).totalSupply().mul(_rate).div(1000000)`
