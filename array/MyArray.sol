pragma solidity ^0.7.5;
contract MyArray{
    string[2][3] theArray;

    constructor (uint indexFirst,uint indexLast,string memory fiirstValue)public{
       theArray[indexFirst][indexLast]= fiirstValue;
    }
    
    function getByArrayIndex(uint indexFirst,uint indexLast)public view returns(string memory resultData){
        string memory resultData = theArray[indexFirst][indexLast];
        return resultData;
    }
    
    function setValueByIndex(uint indexFirst,uint indexLast,string memory newValue)public{
        theArray[indexFirst][indexLast]=newValue;
    }
}