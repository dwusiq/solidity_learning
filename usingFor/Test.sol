pragma solidity ^0.4.25;

import "./Set.sol";

contract Test{
   //指令using A for B;用来把库函数(从库A)关联到类型B。这些函数将会把调用函数的实例作为第一个参数。语法类似，python中的self变量一样。例如：A库有函数 add(B b1, B b2)，则使用Using A for B指令后，如果有B b1就可以使用b1.add(b2)。
   using Set for Set.Data;
   Set.Data myLocalData;
   
   function add(address addr)public{
     myLocalData.add(addr);
   }
   
      
   function remove(address addr)public{
     myLocalData.remove(addr);
   } 


   function has(address addr)public view returns(bool){
     return myLocalData.has(addr);
   } 

}