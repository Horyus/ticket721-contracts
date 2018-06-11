pragma solidity ^0.4.0;

import './Ticket721.sol';
import './Ticket721Controller.sol';
import './zeppelin/ownership/Ownable.sol';
import './Ticket721VerifiedAccounts.sol';

contract Ticket721HUB is Ownable {

    event Sale(address indexed sale_address, address indexed sale_owner);

    Ticket721VerifiedAccounts public account_manager;
    mapping (address => Ticket721Controller[]) public sale_ownership;
    mapping (address => bool) public controller_registered;
    Ticket721[] public public_ticket_registries;
    uint public public_registry_idx;
    Ticket721[] public verified_ticket_registries;
    uint public verified_registry_idx;

    function Ticket721HUB() public {
        account_manager = new Ticket721VerifiedAccounts();
    }

    function deployPublicRegistry(string _name, string _symbol) public onlyOwner {
        public_ticket_registries.push(new Ticket721(_name, _symbol, false));
    }

    function deployVerifiedRegistry(string _name, string _symbol) public onlyOwner {
        verified_ticket_registries.push(new Ticket721(_name, _symbol, true));
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
