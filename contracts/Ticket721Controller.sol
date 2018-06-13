pragma solidity ^0.4.21;

import './ERC165/ERC165.sol';
import './zeppelin/ownership/Ownable.sol';

contract Ticket721Controller is ERC165, Ownable {

    function getMintPrice() public view returns (uint256);

    function getTicketPrice(uint256 _id) public view returns (uint256);

    function getLinkedSale() public view returns (address);

    function name() public view returns (string);

    function getData() public view returns (string);

    function getSaleEnd() public view returns (uint256);

    function getEventBegin() public view returns (uint256);

    function getEventEnd() public view returns (uint256);

    function register() public;

}
