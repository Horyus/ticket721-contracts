pragma solidity ^0.4.0;

import './Ticket721.sol';
import './Ticket721DelegateMinter.sol';

contract Ticket721Train is Ticket721DelegateMinter {

    Ticket721 _ticket;

    struct Infos {
        string first_name;
        string last_name;
    }
    mapping(uint256 => Infos) private _infos;

    function Ticket721Train(address ticket, string metadata) public {
        _metadata = metadata;
        _ticket = Ticket721(ticket);
    }

    function buy(string first_name, string last_name) public payable {
        require(msg.value >= _ticket.getDefaultTicketPrice());
        uint new_ticket = _ticket.mint.value(msg.value)(address(this), msg.sender);
        _infos[new_ticket] = Infos({first_name: first_name, last_name: last_name});
    }

    function get(uint256 ticket_id) public view returns (string, string) {
        require(ticket_id > 0);
        return (_infos[ticket_id].first_name, _infos[ticket_id].last_name);
    }

    string private _metadata;

    function setDelegateMinterMetadata(string metadata) public {
        _metadata = metadata;
    }

    function getDelegateMinterMetadata() public view returns (string) {
        return (_metadata);
    }
}
