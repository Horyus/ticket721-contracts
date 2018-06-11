pragma solidity ^0.4.21;

import './Ticket721Controller.sol';
import './zeppelin/ownership/Ownable.sol';
import './Ticket721VerifiedAccounts.sol';

contract Ticket721Hub is Ownable {

    event Sale(address indexed sale_address, address indexed sale_owner);

    Ticket721VerifiedAccounts public account_manager;
    mapping (address => Ticket721Controller[]) public sale_ownership;
    mapping (address => bool) public controller_registered;
    address[] public public_ticket_registries;
    address[] public verified_ticket_registries;

    constructor() public Ownable() {
        account_manager = new Ticket721VerifiedAccounts();
    }

    function addPublicRegistry(address _public) public onlyOwner {
        public_ticket_registries.push(_public);
    }

    function addVerifiedRegistry(address _verified) public onlyOwner {
        verified_ticket_registries.push(_verified);
    }

    modifier onlyVerified() {
        require(account_manager.isValid(msg.sender));
        _;
    }

    function registerController(Ticket721Controller _controller) public onlyVerified {
        require(!controller_registered[_controller]);
        require(_controller.owner() == msg.sender);
        sale_ownership[msg.sender].push(_controller);
        controller_registered[address(_controller)] = true;
    }

    function eraseController(uint256 idx) public onlyVerified {
        require(sale_ownership[msg.sender].length > idx);
        require(sale_ownership[msg.sender][idx] != Ticket721Controller(0));
        controller_registered[sale_ownership[msg.sender][idx]] = false;
        sale_ownership[msg.sender][idx] = Ticket721Controller(0);
    }

}
