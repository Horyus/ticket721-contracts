pragma solidity ^0.4.0;

import './Ticket721.sol';

contract Ticket721Train {

    Ticket721 _ticket;

    struct Infos {
        string first_name;
        string last_name;
    }
    mapping(uint256 => Infos) private _infos;

    function Ticket721Train(address ticket) public {
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
}
