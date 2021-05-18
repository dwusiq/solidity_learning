pragma solidity ^0.4.25;

//定义一个接口
interface Ibox{
    function add(string name)external;//往盒子添加物品，重复执行会覆盖旧值。 name:物品名称
    function get()external constant returns(string);//返回盒子存放的东西的名称
}