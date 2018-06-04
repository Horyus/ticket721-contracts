pragma solidity ^0.4.21;

// https://github.com/fulldecent/erc721-example/blob/master/XXXXOwnership.sol

// TODO Copy zeppelin contracts here to edit deprecated actions

import './ERC165/ERC165.sol';
import './zeppelin/token/ERC721/ERC721.sol';
import './zeppelin/token/ERC721/ERC721Receiver.sol';
import './zeppelin/math/SafeMath.sol';
import './zeppelin/ownership/Ownable.sol';
import './zeppelin/AddressUtils.sol';


contract Ticket721 is Ownable, ERC165, ERC721Basic, ERC721Enumerable, ERC721Metadata {

    bytes4 public constant INTERFACE_SIGNATURE_ERC165 =
    bytes4(keccak256('supportsInterface(bytes4)'));

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
    uint256 private _ticket_price;
    uint256 private _max_ticket_count;

    struct Ticket {
        address plugged;
        bool    active;
    }

    event Sale(address indexed _owner, uint256 _tokenId);
    event Buy(address indexed _buyer, uint256 _tokenId);

    Ticket[] private _tickets;
    string public infos;

    function Ticket721(string name, string symbol, uint256 ticket_price, uint256 max_ticket_count, string _infos) public {
        Ownable.transferOwnership(tx.origin);
        infos = _infos;
        _running = false;
        _name = name;
        _symbol = symbol;
        _ticket_price = ticket_price;
        _max_ticket_count = max_ticket_count;
        _delegate_minter_active = false;
        _tickets.push(Ticket({plugged: address(0), active: false}));
    }

    bool _running;
    bool _delegate_minter_active;
    address _delegate_minter;

    // Ticket721 Methods

    function setStatus(bool status) public onlyOwner {
        _running = status;
    }

    function getDefaultTicketPrice() public view returns (uint256) {
        return _ticket_price;
    }

    function getTicketPrice(uint256 _tokenId) public view returns (uint256) {
        require(exists(_tokenId));
        if (_custom_price_by_ticket[_tokenId] != 0)
            return _custom_price_by_ticket[_tokenId];
        return _ticket_price;
    }

    function setTicketPrice(uint256 _tokenId, uint256 _newPrice) public onlyDelegateMinter {
        require(exists(_tokenId));
        if (_newPrice == _ticket_price)
            _custom_price_by_ticket[_tokenId] = 0;
        else
            _custom_price_by_ticket[_tokenId] = _newPrice;
    }

    function setTokenURI(string new_uri) public onlyOwner {
        _token_uri = new_uri;
    }

    function setDelegateMinter(address _minter) public onlyOwner {
        _delegate_minter_active = true;
        _delegate_minter = _minter;
    }

    function removeDelegateMinter() public onlyOwner {
        _delegate_minter_active = false;
    }

    modifier onlyDelegateMinter() {
        require(msg.sender == owner || (_delegate_minter_active && msg.sender == _delegate_minter));
        _;
    }

    function mint(address _plugged, address _owner) public onlyDelegateMinter payable returns (uint256) {
        require(_owner != address(0));
        require(_tickets.length + 1 < _max_ticket_count);
        require(msg.value >= _ticket_price);
        uint tick_idx = _tickets.push(Ticket({plugged: _plugged, active: true})) - 1;
        _owner_by_ticket[tick_idx] = _owner;
        _index_by_ticket[tick_idx] = _ticket_list_by_owner[_owner].push(tick_idx) - 1;
        if (msg.value > _ticket_price) {
            _owner.transfer(msg.value - _ticket_price);
        }
        return (tick_idx);
    }

    function mintWithCustomPrice(address _plugged, address _owner, uint256 custom_price) public onlyDelegateMinter payable returns (uint256) {
        require(_owner != address(0));
        require(_tickets.length + 1 < _max_ticket_count);
        require(msg.value >= _ticket_price);
        uint tick_idx = _tickets.push(Ticket({plugged: _plugged, active: true})) - 1;
        _custom_price_by_ticket[tick_idx] = custom_price;
        _owner_by_ticket[tick_idx] = _owner;
        _index_by_ticket[tick_idx] = _ticket_list_by_owner[_owner].push(tick_idx) - 1;
        if (msg.value > _ticket_price) {
            _owner.transfer(msg.value - _ticket_price);
        }
        return (tick_idx);
    }

    function disableTicket(uint256 _tokenId) public onlyDelegateMinter {
        require(exists(_tokenId));
        require(_tickets[_tokenId].active == true);
        _tickets[_tokenId].active = false;
    }

    function enableTicket(uint256 _tokenId) public onlyDelegateMinter {
        require(exists(_tokenId));
        require(_tickets[_tokenId].active == false);
        _tickets[_tokenId].active = false;
    }

    function increaseMaxTicketCount(uint256 amount) public onlyOwner {
        require(amount > 0);
        _max_ticket_count = SafeMath.add(_max_ticket_count, amount);
    }

    function maxTicketCount() public view returns (uint256) {
        return _max_ticket_count;
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
        require(msg.value >= getTicketPrice(ticketId));

        _approved_by_ticket[ticketId] = msg.sender;
        safeTransferFrom(ownerOf(ticketId), msg.sender, ticketId);
        _open_by_ticket[ticketId] = false;
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
