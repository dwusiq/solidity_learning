pragma solidity ^0.7.5;
contract SimpleArray{
    string[] myArray=["a","b","c","d"];
    string[] theArray;

    constructor (uint theArrayLength)public{
         theArray=new string[](theArrayLength);
    }
    
    function getLength()public view returns(uint myArrayLength,uint theArrayLength){
        return (myArray.length,theArray.length);
    }
    
    function set(uint indexOfTheArray, string memory value)public{
        theArray[indexOfTheArray] = value;
    }

    function get(uint index) public view returns(string  memory valueOfMyArray,string memory valueOfTheArray){
        return (myArray[index],theArray[index]);
    }
}
