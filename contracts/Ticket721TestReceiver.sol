pragma solidity ^0.4.21;

import './zeppelin/token/ERC721/ERC721Receiver.sol';
import './zeppelin/math/SafeMath.sol';
import './zeppelin/AddressUtils.sol';

contract Ticket721TestReceiver is ERC721Receiver {

    bytes public last;
    address public last_sender;
    uint256 public last_id;

    function onERC721Received(address _from, uint256 _id, bytes _data) public returns (bytes4) {
        last = _data;
        last_sender = _from;
        last_id = _id;
        return ERC721Receiver.ERC721_RECEIVED;
    }

}
