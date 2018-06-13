pragma solidity ^0.4.21;

import './zeppelin/ownership/Ownable.sol';

contract Ticket721VerifiedAccounts is Ownable {

    event NewProfile(address indexed _account, string _id);
    event EditProfile(address indexed _account, string _old_id, string _new_id);
    event DeleteProfile(address indexed _account, string _id);
    event ValidateProfile(address indexed _account);
    event RevokeProfile(address indexed _account);

    constructor() public Ownable() {
        Ownable.transferOwnership(tx.origin);
    }

    struct Profile {
        string id;
        bool valid;
    }

    mapping (address => Profile) public profiles;
    mapping (string => address) internal availability;

    function isValid(address _target) public view returns (bool) {
        return profiles[_target].valid;
    }

    function registerProfile(string _id) public {
        require(bytes(_id).length != 0);
        require(availability[_id] == address(0));
        require(bytes(profiles[msg.sender].id).length == 0);

        profiles[msg.sender] = Profile(_id, false);
        availability[_id] = msg.sender;

        emit NewProfile(msg.sender, _id);
    }

    function editProfile(string _id) public {
        require(bytes(_id).length != 0);
        require(availability[_id] == address(0));
        require(bytes(profiles[msg.sender].id).length != 0);

        string memory save_id = profiles[msg.sender].id;
        profiles[msg.sender].id = _id;
        profiles[msg.sender].valid = false;

        availability[save_id] = address(0);
        availability[_id] = msg.sender;

        emit EditProfile(msg.sender, save_id, _id);
    }

    function deleteProfile() public {
        require(bytes(profiles[msg.sender].id).length != 0);

        string memory save_id = profiles[msg.sender].id;
        profiles[msg.sender].id = "";
        profiles[msg.sender].valid = false;

        availability[save_id] = address(0);

        emit DeleteProfile(msg.sender, save_id);
    }

    function validateProfile(address _target_profile) public onlyOwner {
        require(profiles[_target_profile].valid == false);
        profiles[_target_profile].valid = true;

        emit ValidateProfile(_target_profile);
    }

    function revokeProfile(address _target_profile) public onlyOwner {
        require(profiles[_target_profile].valid == true);
        profiles[_target_profile].valid = false;

        emit RevokeProfile(_target_profile);
    }

}
