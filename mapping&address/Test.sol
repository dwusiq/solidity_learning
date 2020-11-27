pragma solidity ^0.7.5;
contract A{
    mapping(address => uint8) public balances;
    function set(uint8 amount) public{
        balances[msg.sender]=amount;
    }
}

contract B{
    function update() public returns(uint8 amount){
        A a = new A();
        a.set(45);
        return a.balances(address(this));
    }

}