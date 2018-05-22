const Ticket721TestReceiver = artifacts.require("./Ticket721TestReceiver.sol");

module.exports = function(deployer) {
    deployer.deploy(Ticket721TestReceiver);
};
