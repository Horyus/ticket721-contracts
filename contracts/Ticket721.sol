pragma solidity ^0.4.21;

import './ERC165/ERC165.sol';
import './zeppelin/token/ERC721/ERC721.sol';
import './zeppelin/token/ERC721/ERC721Receiver.sol';
import './zeppelin/math/SafeMath.sol';
import './zeppelin/ownership/Ownable.sol';
import './zeppelin/AddressUtils.sol';
import './Ticket721VerifiedAccounts.sol';
import './Ticket721Controller.sol';
import './Ticket721Hub.sol';

// _____ _      _        _  _____ ____  _
//|_   _(_) ___| | _____| ||___  |___ \/ |
//  | | | |/ __| |/ / _ \ __| / /  __) | |
//  | | | | (__|   <  __/ |_ / /  / __/| |
//  |_| |_|\___|_|\_\___|\__/_/  |_____|_|

contract Ticket721 is Ownable, ERC165, ERC721Basic, ERC721Enumerable, ERC721Metadata {

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
    bytes4(keccak256('setHub(address)')) ^
    bytes4(keccak256('setTokenURI(string)')) ^
    bytes4(keccak256('register(uint256)')) ^
    bytes4(keccak256('editCap(uint256)')) ^
    bytes4(keccak256('mint(address)')) ^
    bytes4(keccak256('openSale(uint256)')) ^
    bytes4(keccak256('closeSale(uint256)')) ^
    bytes4(keccak256('buy(uint256)'));

    event Sale(address indexed _owner, uint256 _token_id);
    event Buy(address indexed _buyer, uint256 _token_id);
    event Register(address indexed _controller);

    /**
    * @param _name Name of registry.
    * @param _symbol Symbol of registry.
    * @param _verified True if only verified accounts can create events.
    */
    constructor(string _name, string _symbol, bool _verified) public {
        should_verify = _verified;
        internal_name = _name;
        internal_symbol = _symbol;
        controller_idx = 1;
        tickets.push(Ticket({plugged: address(0), active: false}));
    }

    struct Ticket {
        address plugged;
        bool    active;
    }

    struct ControllerInfos {
        uint256 controller_id;
        uint256 ticket_cap;
        string event_uri;
        uint256 current_ticket_count;
    }

    uint256 internal controller_idx;
    bool internal should_verify;
    string internal internal_name;
    string internal internal_symbol;
    string internal internal_token_uri;

    Ticket[] internal tickets;
    Ticket721Hub internal hub;

    mapping(uint256 => uint256) internal index_by_ticket;
    mapping(uint256 => address) internal owner_by_ticket;
    mapping(uint256 => address) internal event_by_ticket;
    mapping(uint256 => bool) internal open_by_ticket;
    mapping(uint256 => address) internal approved_by_ticket;
    mapping(address => uint256[]) internal ticket_list_by_owner;
    mapping(address => ControllerInfos) internal ticket_counts;
    mapping(address => mapping(address => bool)) internal approval_for_all_by_owner;

    // _____ _      _        _  _____ ____  _
    //|_   _(_) ___| | _____| ||___  |___ \/ |
    //  | | | |/ __| |/ / _ \ __| / /  __) | |
    //  | | | | (__|   <  __/ |_ / /  / __/| |
    //  |_| |_|\___|_|\_\___|\__/_/  |_____|_|
    // METHODS

    modifier verifiedOnly() {
        require(!should_verify || (should_verify && address(hub) != address(0) && hub.controller_registered(msg.sender)));
        _;
    }

    modifier onlyEvent {
        require(ticket_counts[msg.sender].ticket_cap != 0);
        _;
    }

    /**
    * @param _hub Address of the Hub to use.
    */
    function setHub(address _hub) public onlyOwner {
        hub = Ticket721Hub(_hub);
    }

    /**
    * @param _amount Amount of tickets the sale if going to cap at.
    */
    function register(uint256 _amount, string _event_uri) public verifiedOnly {
        require(ticket_counts[msg.sender].ticket_cap == 0);
        require(AddressUtils.isContract(msg.sender));
        require(Ticket721Controller(msg.sender).supportsInterface(INTERFACE_SIGNATURE_Ticket721Controller));

        ticket_counts[msg.sender].ticket_cap = _amount;
        ticket_counts[msg.sender].controller_id = controller_idx;
        ticket_counts[msg.sender].event_uri = _event_uri;
        ++controller_idx;

        emit Register(msg.sender);
    }

    function editCap(uint256 _amount) public verifiedOnly onlyEvent {
        require(ticket_counts[msg.sender].ticket_cap != _amount);
        require(_amount >= ticket_counts[msg.sender].current_ticket_count);

        ticket_counts[msg.sender].ticket_cap = _amount;
    }

    function mint(address _owner) public verifiedOnly onlyEvent returns (uint256) {
        require(_owner != address(0));
        require(ticket_counts[msg.sender].current_ticket_count + 1 < ticket_counts[msg.sender].ticket_cap);
        require(block.timestamp < Ticket721Controller(msg.sender).getSaleEnd());

        uint tick_idx = tickets.push(Ticket({plugged: msg.sender, active: true})) - 1;
        owner_by_ticket[tick_idx] = _owner;
        event_by_ticket[tick_idx] = msg.sender;
        index_by_ticket[tick_idx] = ticket_list_by_owner[_owner].push(tick_idx) - 1;

        return (tick_idx);
    }

    function openSale(uint256 _token_id) public {
        require(exists(_token_id));
        require(msg.sender == ownerOf(_token_id) || approval_for_all_by_owner[ownerOf(_token_id)][msg.sender]);

        open_by_ticket[_token_id] = true;

        emit Sale(msg.sender, _token_id);
    }

    function closeSale(uint256 _token_id) public {
        require(exists(_token_id));
        require(msg.sender == ownerOf(_token_id) || approval_for_all_by_owner[ownerOf(_token_id)][msg.sender]);

        open_by_ticket[_token_id] = false;
    }

    function buy(uint256 _token_id) public payable {
        require(exists(_token_id));
        require(open_by_ticket[_token_id]);
        require(msg.sender != ownerOf(_token_id));
        require(msg.value >= Ticket721Controller(tickets[_token_id].plugged).getTicketPrice(_token_id));
        require(block.timestamp < Ticket721Controller(tickets[_token_id].plugged).getEventBegin());

        approved_by_ticket[_token_id] = msg.sender;
        safeTransferFrom(ownerOf(_token_id), msg.sender, _token_id);
        open_by_ticket[_token_id] = false;
        if (msg.value > Ticket721Controller(tickets[_token_id].plugged).getTicketPrice(_token_id))
            msg.sender.transfer(SafeMath.sub(msg.value, Ticket721Controller(tickets[_token_id].plugged).getTicketPrice(_token_id)));

        emit Buy(msg.sender, _token_id);
    }

    function fromEvent(uint256 _token_id) public view returns (address) {
        return (event_by_ticket[_token_id]);
    }

    // _____ ____   ____ _  __  ____
    //| ____|  _ \ / ___/ |/ /_| ___|
    //|  _| | |_) | |   | | '_ \___ \
    //| |___|  _ <| |___| | (_) |__) |
    //|_____|_| \_\\____|_|\___/____/

    function supportsInterface(bytes4 _interface_id) external view returns (bool) {
        return ((_interface_id == INTERFACE_SIGNATURE_ERC165)
        || (_interface_id == INTERFACE_SIGNATURE_ERC721Basic)
        || (_interface_id == INTERFACE_SIGNATURE_ERC721Enumerable)
        || (_interface_id == INTERFACE_SIGNATURE_ERC721Metadata)
        || (_interface_id == INTERFACE_SIGNATURE_Ticket721));
    }

    // _____ ____   ____ _____ ____  _
    //| ____|  _ \ / ___|___  |___ \/ |
    //|  _| | |_) | |      / /  __) | |
    //| |___|  _ <| |___  / /  / __/| |
    //|_____|_| \_\\____|/_/  |_____|_|
    // METADATA

    function name() public view returns (string) {
        return (internal_name);
    }

    function symbol() public view returns (string) {
        return (internal_symbol);
    }

    function tokenURI(uint256 _token_id) public view returns (string) {
        return (ticket_counts[event_by_ticket[_token_id]].event_uri);
    }

    // _____ ____   ____ _____ ____  _
    //| ____|  _ \ / ___|___  |___ \/ |
    //|  _| | |_) | |      / /  __) | |
    //| |___|  _ <| |___  / /  / __/| |
    //|_____|_| \_\\____|/_/  |_____|_|
    // ENUMERABLE

    function totalSupply() public view returns (uint256) {
        return (tickets.length - 1);
    }

    function tokenOfOwnerByIndex(address _owner, uint256 _index) public view returns (uint256) {
        require(_owner != address(0));
        require(ticket_list_by_owner[_owner].length > _index);

        uint256 walk_idx = 0;
        for (uint256 idx = 0; idx < ticket_list_by_owner[_owner].length; idx++) {
            if (ticket_list_by_owner[_owner][idx] != 0 && tickets[ticket_list_by_owner[_owner][idx]].active) {
                if (walk_idx == _index)
                    return (ticket_list_by_owner[_owner][idx]);
                ++walk_idx;
            }
        }
        revert();
    }

    function tokenByIndex(uint256 _index) public view returns (uint256) {
        require(_index < totalSupply());

        return (_index + 1);
    }

    // _____ ____   ____ _____ ____  _
    //| ____|  _ \ / ___|___  |___ \/ |
    //|  _| | |_) | |      / /  __) | |
    //| |___|  _ <| |___  / /  / __/| |
    //|_____|_| \_\\____|/_/  |_____|_|
    // BASIC

    function balanceOf(address _owner) public view returns (uint256) {
        uint256 ret = 0;
        for (uint256 idx = 0; idx < ticket_list_by_owner[_owner].length; ++idx) {
            if (ticket_list_by_owner[_owner][idx] != 0 && tickets[ticket_list_by_owner[_owner][idx]].active)
                ++ret;
        }
        return ret;
    }

    function ownerOf(uint256 _token_id) public view returns (address _owner) {
        require(exists(_token_id));

        return (owner_by_ticket[_token_id]);
    }

    function exists(uint256 _token_id) public view returns (bool _exists) {
        require(_token_id != 0);

        return (owner_by_ticket[_token_id] != address(0) && tickets[_token_id].active);
    }

    function approve(address _to, uint256 _token_id) public {
        require(exists(_token_id));
        require(_to != msg.sender);
        require(msg.sender == ownerOf(_token_id) || approval_for_all_by_owner[ownerOf(_token_id)][msg.sender]);

        approved_by_ticket[_token_id] = _to;

        emit ERC721Basic.Approval(msg.sender, _to, _token_id);
    }

    function getApproved(uint256 _token_id) public view returns (address) {
        require(exists(_token_id));

        return (approved_by_ticket[_token_id]);
    }

    function setApprovalForAll(address _operator, bool _approved) public {
        require(approval_for_all_by_owner[msg.sender][_operator] != _approved);

        approval_for_all_by_owner[msg.sender][_operator] = _approved;

        emit ERC721Basic.ApprovalForAll(msg.sender, _operator, _approved);
    }

    function isApprovedForAll(address _owner, address _operator) public view returns (bool) {
        return (approval_for_all_by_owner[_owner][_operator]);
    }

    function transferFrom(address _from, address _to, uint256 _token_id) public {
        require(exists(_token_id));
        require(_from == msg.sender || approved_by_ticket[_token_id] == msg.sender || approval_for_all_by_owner[ownerOf(_token_id)][msg.sender]);
        require(owner_by_ticket[_token_id] == _from);
        require(_to != address(0));
        require(_to != _from);

        if (approved_by_ticket[_token_id] != address(0))
            approved_by_ticket[_token_id] = address(0);

        if (open_by_ticket[_token_id] == true)
            open_by_ticket[_token_id] = false;

        owner_by_ticket[_token_id] = _to;
        ticket_list_by_owner[_from][index_by_ticket[_token_id]] = 0;
        index_by_ticket[_token_id] = ticket_list_by_owner[_to].push(_token_id) - 1;

        emit ERC721Basic.Transfer(_from, _to, _token_id);
    }

    function safeTransferFrom(address _from, address _to, uint256 _token_id) public {
        transferFrom(_from, _to, _token_id);
        require(!(AddressUtils.isContract(_to) && (ERC721Receiver(_to).onERC721Received(_from, _token_id, "") != ERC721Receiver(0).onERC721Received.selector)));
    }

    function safeTransferFrom(address _from, address _to, uint256 _token_id, bytes _data) public {
        transferFrom(_from, _to, _token_id);
        require(!(AddressUtils.isContract(_to) && (ERC721Receiver(_to).onERC721Received(_from, _token_id, _data) != ERC721Receiver(0).onERC721Received.selector)));
    }

}
