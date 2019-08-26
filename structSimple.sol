pragma solidity ^0.4.25;

contract structSimple{
    struct User{
        int8 id;
        string userName;
    }
    
     User private user;
    
    constructor(int8 id,string memory userName) public{
        user = User(id,userName);
    }
    
    function getUserName() public view returns(string memory userName){
        return user.userName;
    }
    
    function getUserId() public view returns(int8 id){
        return user.id;
    }
}