pragma solidity ^0.4.25;

library Set{
    struct Data{
        mapping (address=>bool) flag;
    }

   function add(Data storage data,address addr)public{
       require(!has(data,addr),"already found data by addr");
       data.flag[addr]=true;
   }


      function remove(Data storage data,address addr)public{
       require(has(data,addr),"not found data by addr");
       data.flag[addr]=false;
   }

    function has(Data storage data,address addr)view public returns(bool){
        return data.flag[addr];
    }
}
