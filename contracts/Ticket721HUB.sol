pragma solidity ^0.4.0;

import './Ticket721.sol';
import './zeppelin/ownership/Ownable.sol';
import './Ticket721VerifiedAccounts.sol';

contract Ticket721HUB is Ownable {

    event Sale(address indexed sale_address, address indexed sale_owner);

    struct SaleStruct {
        Ticket721 ticket721;
        string infos;
    }

    Ticket721VerifiedAccounts public account_manager;
    mapping (address => SaleStruct[]) public sale_ownership;

    function Ticket721HUB() public {
        account_manager = new Ticket721VerifiedAccounts();
    }

    function runSale(string name, string symbol, uint256 ticket_price, uint256 max_ticket_count, string infos) public {
        Ticket721 new_sale = new Ticket721(name, symbol, ticket_price, max_ticket_count);
        sale_ownership[msg.sender].push(SaleStruct(new_sale, infos));

        emit Sale(new_sale, msg.sender);
    }

}
