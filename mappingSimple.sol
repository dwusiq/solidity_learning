pragma solidity ^0.4.25;

contract mappingSimple{
    mapping (int8 => string) private map;
    
    function get(int8 key)view public returns(string memory value){
        return map[key];
    }
    
    function set(int8 key,string memory value) public{
        map[key] = value;
    }
}