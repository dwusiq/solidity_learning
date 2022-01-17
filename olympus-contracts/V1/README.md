# `OlympusDao`合约描述

## 一、OHM简述
**原理：** OHM代币被其它加密货币（如I）支持，但不是一对一挂钩，在OHM的价格比DAI低时，合约会回购OHM销毁，让其价格提升到1。假如OHM价格高时，合约会供应更多的OHM出售，让价格回落到1（前提是有人拿DAI来买OHM）。因此协议允许OHM对DAI的价格>=1

**目的：**  OlympusDAO 希望 OHM可以成为一个尽管市场波动性高但仍有办法把持住购买力的货币

**用户参与形式：** 

* staking(质押)：当价格上涨会触发合约铸造新的OHM,而这些新铸造的OHM中，有很大一部分会分配给质押OHM的用户，作为质押OHM的收益。
* bonding(债券)：用户用合约指定的币种(或LP)来购买`OHM`,这样用户得到`OHM`,并且用户支付的资产将归属于合约。
* selling(出售)：用户出售自己手中的OHM获利。

## 二、合约测试
* 依赖安装
```
npm install
```

## 六、合约理解的关键点

* `sOHM`合约的关注点：
  - 协议内计算份额是用`gon`,但协议外从用户的角度都是取`sOHM`的份额（即：`sOHM`对外，gon对内）
  - `sOHM`份额=`gon`份额/`_gonsPerFragment`，其中`_gonsPerFragment`跟`_totalSupply`成反比，`_gonsPerFragment`表示每单位`sOHM`价值多少`gon`
  - 每次调用`rebase`函数都会执行`_gonsPerFragment = TOTAL_GONS.div(_totalSupply);`,由`balanceOf`接口得知，则用户持有相同`gon`的前提下，`_gonsPerFragment`越小，则`sOHM`值越大
* `distributor`合约的关注点（这个合约解决了分红`OHM`的来源）
  
  - 这个合约配置在每个周期(`epoch`)给`staking`合约铸造多少`OHM`，这些`OHM`份额就是`staker`的收益来源
  
  - `await deployedDistributor.addRecipient(stakingAddress, initialRewardRate)`就是配置每周期的分红总额
  
  - 每次`staking`合约触发`rebase`都会调用`IDistributor(distributor).distribute()`产出用于分红的`OHM`
  
  - 因此每个周期都会有新的`OHM`产生
  
    
