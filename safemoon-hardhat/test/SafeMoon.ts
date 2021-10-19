const { expect } = require("chai");
const { ethers, upgrades } = require("hardhat");




describe("SafeMoon Test", function () {
    const decimalUsdt = 18;
    const decimalEth = 18;

    let usdtAddr: any, wbnbAddr, uniswapV2FactoryAddr, uniswapV2Router02Addr, safeMoonAddr;
    let deployer: any, user0, user1, user2, user3, user4;

    it("init params", async function () {
        [deployer, user0, user1, user2, user3, user4] = await ethers.getSigners();
    });

    it("deploy all contract", async function () {
        const ftryUsdt = await ethers.getContractFactory("BEP20USDT");
        const usdt = await ftryUsdt.deploy();
        await usdt.deployed();
        usdtAddr = usdt.address;

        const ftryWBNB = await ethers.getContractFactory("WBNB");
        const wbnb = await ftryWBNB.deploy();
        await wbnb.deployed();
        wbnbAddr = wbnb.address;

        const ftryUniswapV2Factory = await ethers.getContractFactory("UniswapV2Factory");
        const uniswapV2Factory = await ftryUniswapV2Factory.deploy(wbnb.address);
        await uniswapV2Factory.deployed();
        uniswapV2FactoryAddr = uniswapV2Factory.address;

        const ftryUniswapV2Router02 = await ethers.getContractFactory("UniswapV2Router02");
        const uniswapV2Router02 = await ftryUniswapV2Router02.deploy(uniswapV2Factory.address, wbnb.address);
        await uniswapV2Router02.deployed();
        uniswapV2Router02Addr = uniswapV2Router02.address;

        const SafeMoon = await ethers.getContractFactory("SafeMoon");
        const safeMoon = await SafeMoon.deploy(uniswapV2Router02Addr);
        await safeMoon.deployed();
        safeMoonAddr = safeMoon.address;

        //log
        console.log("deployer:%s", deployer.address);
        console.log("usdtAddr:%s", usdtAddr);
        console.log("wbnbAddr:%s", wbnbAddr);
        console.log("uniswapV2FactoryAddr:%s", uniswapV2FactoryAddr);
        console.log("uniswapV2Router02Addr:%s", uniswapV2Router02Addr);
        console.log("safeMoonAddr:%s", safeMoonAddr);
    });



});