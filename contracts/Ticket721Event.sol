pragma solidity ^0.4.21;

import './Ticket721.sol';
import './ERC165/ERC165.sol';
import './zeppelin/ownership/Ownable.sol';
import './Ticket721Controller.sol';
import './zeppelin/math/SafeMath.sol';

contract Ticket721Event is Ownable, Ticket721Controller {

    constructor(Ticket721 _sale,
        uint256 _amount,
        uint256 _ticket_price,
        string _event_uri,
        string _name,
        uint256 _sale_end,
        uint256 _event_begin,
        uint256 _event_end) public {
        require(_sale_end > block.timestamp);
        require(_event_begin > block.timestamp);
        require(_event_end > _event_begin);
        ticket_cap = _amount;
        linked_sale = _sale;
        ticket_price = _ticket_price;
        resale_price = _ticket_price;
        event_uri = _event_uri;
        event_name = _name;
        sale_end = _sale_end;
        event_begin = _event_begin;
        event_end = _event_end;
    }

    Ticket721 public linked_sale;
    uint256 public ticket_cap;
    uint256 public ticket_price;
    uint256 public resale_price;
    string public event_uri;
    string internal event_name;
    uint256 public sale_end;
    uint256 public event_begin;
    uint256 public event_end;
    bool internal registered;

    function setTicketCap(uint256 _new_ticket_cap) public onlyOwner {
        linked_sale.editCap(_new_ticket_cap);
    }

    function setTicketPrice(uint256 _new_ticket_price) public onlyOwner {
        ticket_price = _new_ticket_price;
    }

    function setTicketResalePrice(uint256 _new_ticket_resale_price) public onlyOwner {
        resale_price = _new_ticket_resale_price;
    }

    function setEventURI(string _new_event_uri) public onlyOwner {
        event_uri = _new_event_uri;
    }

    function setName(string _new_name) public onlyOwner {
        event_name = _new_name;
    }

    function setSaleEnd(uint256 _new_sale_end) public onlyOwner {
        require(_new_sale_end > block.timestamp);
        sale_end = _new_sale_end;
    }

    function setEventBegin(uint256 _new_event_begin) public onlyOwner {
        require(_new_event_begin > block.timestamp);
        require(_new_event_begin < event_end);
        event_begin = _new_event_begin;
    }

    function setEventEnd(uint256 _new_event_end) public onlyOwner {
        require(_new_event_end > block.timestamp);
        require(_new_event_end > event_begin);
        event_end = _new_event_end;
    }

    mapping (uint => bool) public ticket_infos;

    function buy() public payable {
        require(msg.value >= ticket_price);

        ticket_infos[linked_sale.mint(msg.sender)] = true;

        if (msg.value > ticket_price)
            msg.sender.transfer(SafeMath.sub(msg.value, ticket_price));
    }

    // Ticket721Controller
    function getMintPrice() public view returns (uint256) {
        return (ticket_price);
    }

    function getTicketPrice(uint256 _id) public view returns (uint256) {
        require(ticket_infos[_id]);
        return (resale_price);
    }

    function getLinkedSale() public view returns (address) {
        return (address(linked_sale));
    }

    function name() public view returns (string) {
        return (event_name);
    }

    function getEventURI() public view returns (string) {
        return (event_uri);
    }

    function getSaleEnd() public view returns (uint256) {
        return (sale_end);
    }

    function getEventBegin() public view returns (uint256) {
        return (event_begin);
    }

    function getEventEnd() public view returns (uint256) {
        return (event_end);
    }

    function register() public onlyOwner {
        linked_sale.register(ticket_cap, event_uri);
    }

    // ERC165
    bytes4 public constant INTERFACE_SIGNATURE_ERC165 =
    bytes4(keccak256('supportsInterface(bytes4)'));

    bytes4 public constant INTERFACE_SIGNATURE_Ticket721Controller =
    bytes4(keccak256('getMintPrice()')) ^
    bytes4(keccak256('getTicketPrice(uint256)')) ^
    bytes4(keccak256('getLinkedSale()')) ^
    bytes4(keccak256('name()')) ^
    bytes4(keccak256('getData()')) ^
    bytes4(keccak256('getSaleEnd()')) ^
    bytes4(keccak256('getEventBegin()')) ^
    bytes4(keccak256('getEventEnd()')) ^
    bytes4(keccak256('register()'));

    function supportsInterface(bytes4 _interface_id) external view returns (bool) {
        return ((_interface_id == INTERFACE_SIGNATURE_ERC165)
        || (_interface_id == INTERFACE_SIGNATURE_Ticket721Controller));
    }
}
