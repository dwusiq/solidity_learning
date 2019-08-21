pragma solidity ^0.5.0;

contract functionSimple{
    uint8 value;
    
    function set(uint8 val) public{
        value = val;
    }
    
    function get() view public returns(uint8){
        return value;
    }
}