pragma solidity ^0.4.25;

//导入库文件
import "./Address.sol";

contract AddressTest{

   function isContractAddress(address addr)public view returns(bool){
       //调用库的函数
      return Address.isContract(addr);
   } 

}