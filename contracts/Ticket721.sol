pragma solidity ^0.4.21;

// https://github.com/fulldecent/erc721-example/blob/master/XXXXOwnership.sol

// TODO Copy zeppelin contracts here to edit deprecated actions

import './ERC165/ERC165.sol';
import './zeppelin/token/ERC721/ERC721.sol';
import './zeppelin/token/ERC721/ERC721Receiver.sol';
import './zeppelin/math/SafeMath.sol';
import './zeppelin/ownership/Ownable.sol';
import './zeppelin/AddressUtils.sol';
import './Ticket721VerifiedAccounts.sol';
import './Ticket721Controller.sol';
import './Ticket721HUB.sol';

contract Ticket721 is Ownable, ERC165, ERC721Basic, ERC721Enumerable, ERC721Metadata {

    bytes4 public constant INTERFACE_SIGNATURE_ERC165 =
    bytes4(keccak256('supportsInterface(bytes4)'));

    // REMOVE COMPUTE AND CHECK INLINE
    bytes4 public constant INTERFACE_SIGNATURE_Ticket721Controller =
    bytes4(keccak256('getTicketPrice(uint256)')) ^
    bytes4(keccak256('getLinkedSale()')) ^
    bytes4(keccak256('name()')) ^
    bytes4(keccak256('getSaleEnd()')) ^
    bytes4(keccak256('getEventBegin()')) ^
    bytes4(keccak256('register()')) ^
    bytes4(keccak256('getEventEnd()'));

    bytes4 public constant INTERFACE_SIGNATURE_ERC721Basic =
    bytes4(keccak256('balanceOf(address)')) ^
    bytes4(keccak256('ownerOf(uint256)')) ^
    bytes4(keccak256('exists(uint256)')) ^
    bytes4(keccak256('approve(address,uint256)')) ^
    bytes4(keccak256('getApproved(uint256)')) ^
    bytes4(keccak256('setApprovalForAll(address,bool)')) ^
    bytes4(keccak256('isApprovedForAll(address,address)')) ^
    bytes4(keccak256('transferFrom(address,address,uint256)')) ^
    bytes4(keccak256('safeTransferFrom(address,address,uint256)')) ^
    bytes4(keccak256('safeTransferFrom(address,address,uint256,bytes)'));

    bytes4 public constant INTERFACE_SIGNATURE_ERC721Enumerable =
    bytes4(keccak256('totalSupply()')) ^
    bytes4(keccak256('tokenOfOwnerByIndex(address,uint256)')) ^
    bytes4(keccak256('tokenByIndex(uint256)'));

    bytes4 public constant INTERFACE_SIGNATURE_ERC721Metadata =
    bytes4(keccak256('name()')) ^
    bytes4(keccak256('symbol()')) ^
    bytes4(keccak256('tokenURI(uint256)'));

    bytes4 public constant INTERFACE_SIGNATURE_Ticket721 =
    bytes4(keccak256('setStatus(bool)')) ^
    bytes4(keccak256('getDefaultTicketPrice()')) ^
    bytes4(keccak256('getTicketPrice(uint256)')) ^
    bytes4(keccak256('setTicketPrice(uint256,uint256)')) ^
    bytes4(keccak256('setTokenURI(string)')) ^
    bytes4(keccak256('setDelegateMinter(address)')) ^
    bytes4(keccak256('removeDelegateMinter()')) ^
    bytes4(keccak256('mint(address,address)')) ^
    bytes4(keccak256('mintWithCustomPrice(address,address,uint256)')) ^
    bytes4(keccak256('disableTicket(uint256)')) ^
    bytes4(keccak256('enableTicket(uint256)')) ^
    bytes4(keccak256('increaseMaxTicketAmount(uint256)')) ^
    bytes4(keccak256('maxTicketCount()')) ^
    bytes4(keccak256('openSale(uint256)')) ^
    bytes4(keccak256('closeSale(uint256)')) ^
    bytes4(keccak256('buy(uint256)'));

    string private _name;
    string private _symbol;

    struct Ticket {
        address plugged;
        bool    active;
    }

    event Sale(address indexed _owner, uint256 _tokenId);
    event Buy(address indexed _buyer, uint256 _tokenId);

    Ticket[] private _tickets;

    uint256 internal controller_idx;
    Ticket721HUB internal hub;
    bool internal should_verify;

    struct ControllerInfos {
        uint256 controller_id;
        uint256 ticket_cap;
        uint256 current_ticket_count;
    }

    mapping (address => ControllerInfos) internal ticket_counts;

    function Ticket721(string name, string symbol, bool verified) public {
        Ownable.transferOwnership(tx.origin);
        hub = Ticket721HUB(msg.sender);
        should_verify = verified;
        _name = name;
        _symbol = symbol;
        controller_idx = 1;
        _tickets.push(Ticket({plugged: address(0), active: false}));
    }

    // Ticket721 Methods



    function setTokenURI(string new_uri) public onlyOwner {
        _token_uri = new_uri;
    }

    modifier verifiedOnly() {
        require(!should_verify || (should_verify && hub.controller_registered(msg.sender)));
        _;
    }

    function register(uint256 amount) public verifiedOnly {
        require(ticket_counts[msg.sender].ticket_cap == 0);
        require(AddressUtils.isContract(msg.sender));
        require(Ticket721Controller(msg.sender).supportsInterface(INTERFACE_SIGNATURE_Ticket721Controller));
        ticket_counts[msg.sender].ticket_cap = amount;
        ticket_counts[msg.sender].controller_id = controller_idx;
        ++controller_idx;
    }

    modifier onlyEvent {
        require(ticket_counts[msg.sender].ticket_cap != 0);
        _;
    }

    function editCap(uint256 amount) public verifiedOnly onlyEvent {
        require(ticket_counts[msg.sender].ticket_cap != amount);
        require(amount >= ticket_counts[msg.sender].current_ticket_count);
        ticket_counts[msg.sender].ticket_cap = amount;
    }

    function mint(address _owner) public verifiedOnly onlyEvent returns (uint256) {
        require(_owner != address(0));
        require(ticket_counts[msg.sender].current_ticket_count + 1 < ticket_counts[msg.sender].ticket_cap);
        require(block.timestamp < Ticket721Controller(msg.sender).getSaleEnd());
        uint tick_idx = _tickets.push(Ticket({plugged: msg.sender, active: true})) - 1;
        _owner_by_ticket[tick_idx] = _owner;
        _index_by_ticket[tick_idx] = _ticket_list_by_owner[_owner].push(tick_idx) - 1;
        return (tick_idx);
    }

    function openSale(uint256 ticketId) public {
        require(exists(ticketId));
        require(msg.sender == ownerOf(ticketId) || _approval_for_all_by_owner[ownerOf(ticketId)][msg.sender]);

        _open_by_ticket[ticketId] = true;

        emit Sale(msg.sender, ticketId);
    }

    function closeSale(uint256 ticketId) public {
        require(exists(ticketId));
        require(msg.sender == ownerOf(ticketId) || _approval_for_all_by_owner[ownerOf(ticketId)][msg.sender]);

        _open_by_ticket[ticketId] = false;
    }

    function buy(uint256 ticketId) public payable {
        require(exists(ticketId));
        require(_open_by_ticket[ticketId]);
        require(msg.sender != ownerOf(ticketId));
        require(msg.value >= Ticket721Controller(_tickets[ticketId].plugged).getTicketPrice(ticketId));
        require(block.timestamp < Ticket721Controller(_tickets[ticketId].plugged).getEventBegin());

        _approved_by_ticket[ticketId] = msg.sender;
        safeTransferFrom(ownerOf(ticketId), msg.sender, ticketId);
        _open_by_ticket[ticketId] = false;
        if (msg.value > Ticket721Controller(_tickets[ticketId].plugged).getTicketPrice(ticketId))
            msg.sender.transfer(SafeMath.sub(msg.value, Ticket721Controller(_tickets[ticketId].plugged).getTicketPrice(ticketId)));
        emit Buy(msg.sender, ticketId);
    }

    // ERC165 Implementation
    function supportsInterface(bytes4 interfaceID) external view returns (bool) {
        return ((interfaceID == INTERFACE_SIGNATURE_ERC165)
        || (interfaceID == INTERFACE_SIGNATURE_ERC721Basic)
        || (interfaceID == INTERFACE_SIGNATURE_ERC721Enumerable)
        || (interfaceID == INTERFACE_SIGNATURE_ERC721Metadata)
        || (interfaceID == INTERFACE_SIGNATURE_Ticket721));
    }

    // ERC721Metadata Implementation
    function name() public view returns (string) {
        return (_name);
    }

    function symbol() public view returns (string) {
        return (_symbol);
    }

    string private _token_uri;

    function tokenURI(uint256) public view returns (string) {
        return _token_uri;
    }

    //// EC721Enumerable Implementation
    function totalSupply() public view returns (uint256) {
        return (_tickets.length - 1);
    }

    function tokenOfOwnerByIndex(address _owner, uint256 _index) public view returns (uint256) {
        require(_owner != address(0));
        require(_ticket_list_by_owner[_owner].length > _index);

        uint256 walk_idx = 0;
        for (uint256 idx = 0; idx < _ticket_list_by_owner[_owner].length; idx++) {
            if (_ticket_list_by_owner[_owner][idx] != 0 && _tickets[_ticket_list_by_owner[_owner][idx]].active) {
                if (walk_idx == _index)
                    return (_ticket_list_by_owner[_owner][idx]);
                ++walk_idx;
            }
        }
        revert();
    }

    function tokenByIndex(uint256 _index) public view returns (uint256) {
        require(_index < totalSupply());
        return (_index + 1);
    }

    address[] private _owners;
    mapping(address => uint256) private _idx_of_owners;

    mapping(address => uint256[]) private _ticket_list_by_owner;
    mapping(uint256 => address) private _owner_by_ticket;
    mapping(uint256 => uint256) private _index_by_ticket;

    mapping(uint256 => uint256) private _custom_price_by_ticket;
    mapping(uint256 => bool) private _open_by_ticket;

    mapping(uint256 => address) private _approved_by_ticket;
    mapping(address => mapping (address => bool)) private _approval_for_all_by_owner;

    // ERC721Basic Implementation
    function balanceOf(address _owner) public view returns (uint256) {
        uint256 ret = 0;
        for (uint256 idx = 0; idx < _ticket_list_by_owner[_owner].length; ++idx) {
            if (_ticket_list_by_owner[_owner][idx] != 0 && _tickets[_ticket_list_by_owner[_owner][idx]].active)
                ++ret;
        }
        return ret;
    }

    function ownerOf(uint256 _tokenId) public view returns (address _owner) {
        require(exists(_tokenId));

        return _owner_by_ticket[_tokenId];
    }

    function exists(uint256 _tokenId) public view returns (bool _exists) {
        require(_tokenId != 0);
        return (_owner_by_ticket[_tokenId] != address(0) && _tickets[_tokenId].active);
    }

    function approve(address _to, uint256 _tokenId) public {
        require(exists(_tokenId));
        require(_to != msg.sender);
        require(msg.sender == ownerOf(_tokenId) || _approval_for_all_by_owner[ownerOf(_tokenId)][msg.sender]);

        _approved_by_ticket[_tokenId] = _to;

        emit ERC721Basic.Approval(msg.sender, _to, _tokenId);
    }

    function getApproved(uint256 _tokenId) public view returns (address) {
        require(exists(_tokenId));

        return (_approved_by_ticket[_tokenId]);
    }

    function setApprovalForAll(address _operator, bool _approved) public {
        require(_approval_for_all_by_owner[msg.sender][_operator] != _approved);
        _approval_for_all_by_owner[msg.sender][_operator] = _approved;

        emit ERC721Basic.ApprovalForAll(msg.sender, _operator, _approved);
    }

    function isApprovedForAll(address _owner, address _operator) public view returns (bool) {
        return _approval_for_all_by_owner[_owner][_operator];
    }

    function transferFrom(address _from, address _to, uint256 _tokenId) public {
        require(exists(_tokenId));
        require(_from == msg.sender || _approved_by_ticket[_tokenId] == msg.sender || _approval_for_all_by_owner[ownerOf(_tokenId)][msg.sender]);
        require(_owner_by_ticket[_tokenId] == _from);
        require(_to != address(0));
        require(_to != _from);

        if (_approved_by_ticket[_tokenId] != address(0))
            _approved_by_ticket[_tokenId] = address(0);

        if (_open_by_ticket[_tokenId] == true)
            _open_by_ticket[_tokenId] = false;

        _owner_by_ticket[_tokenId] = _to;
        _ticket_list_by_owner[_from][_index_by_ticket[_tokenId]] = 0;
        _index_by_ticket[_tokenId] = _ticket_list_by_owner[_to].push(_tokenId) - 1;

        emit ERC721Basic.Transfer(_from, _to, _tokenId);
    }

    function safeTransferFrom(address _from, address _to, uint256 _tokenId) public {
        transferFrom(_from, _to, _tokenId);
        if (AddressUtils.isContract(_to) && (ERC721Receiver(_to).onERC721Received(_from, _tokenId, "") != ERC721Receiver(0).onERC721Received.selector))
            revert();
    }

    function safeTransferFrom(address _from, address _to, uint256 _tokenId, bytes _data) public {
        transferFrom(_from, _to, _tokenId);
        if (AddressUtils.isContract(_to) && (ERC721Receiver(_to).onERC721Received(_from, _tokenId, _data) != ERC721Receiver(0).onERC721Received.selector))
            revert();
    }

}
