pragma solidity ^0.7.0;
contract A{
    uint a;
    function set(uint _value)public{
        a=_value;
    }

    function get()view public returns(uint){
        return a;
    }
}

contract B is A{

}