function toUsd(value) {
  const normalizedValue = parseInt(value * Math.pow(10, 10))
  return ethers.BigNumber.from(normalizedValue).mul(ethers.BigNumber.from(10).pow(20))
}

toNormalizedPrice = toUsd

//睡眠指定时间
function sleep(ms) {
  console.log(moment().format("YYYYMMDD HH:mm:ss"), "DEBUG", "sleep ms " + ms);
  if (!isLocalTest) {
    return new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
  }
}

module.exports = { toUsd, toNormalizedPrice, sleep }
