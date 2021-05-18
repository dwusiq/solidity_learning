pragma solidity 0.4.25;
// library表示定义一个库
library Address{
    //库的函数不能修改状态变量，所以被定义为view
    function isContract(address addr) public view returns(bool){
        uint256 size;
         assembly { size := extcodesize(addr) }
         return size >0;
    }
}