const Ticket721Hub = artifacts.require("./Ticket721Hub.sol");

module.exports = function(deployer) {
    deployer.deploy(Ticket721Hub, {gas: 8000000});
};
