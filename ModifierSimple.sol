pragma solidity >=0.4.22 <0.6.0;
contract ModifierSimple{
    int8 private int_value;
    bytes8 private bytes8_value;
    address public owner;
    
    constructor()public{
        owner=msg.sender;
    }
    
    modifier requireOwner(){
        require(owner==msg.sender,"only set by owner");
        _;
    }
    
    modifier notSupportA(bytes8 letter){
        require(letter !="A","not support 'A'");
        _;
    }
    
    function setInt(int8 _value) requireOwner public{
        int_value=_value;
    }
    
    function setByte(bytes8 _value) notSupportA(_value) public{
        bytes8_value=_value;
    }
    
    function get() public view returns(int8,bytes8){
        return (int_value,bytes8_value);
    }
}