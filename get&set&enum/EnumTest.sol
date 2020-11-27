pragma solidity ^0.7.0;

contract EnumTest{
    enum MyEnum{One,Tow,Tree,Four}
    function get()pure public returns(uint value){
        return uint(MyEnum.Tree);
    }
}