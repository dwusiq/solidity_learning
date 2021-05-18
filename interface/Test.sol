pragma solidity ^0.4.25;

//导入同目录下的Ibox.sol
import "./Ibox.sol";

//合约继承父合约或者实现接口都用“is”
contract Test is Ibox{
    string n;
    function add(string name)external{
        n=name; 
    }

    function get()external constant returns(string){
        return n;
    }
}