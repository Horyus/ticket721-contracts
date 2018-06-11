const Ticket721Hub = artifacts.require("./Ticket721HUB.sol");

module.exports = function(deployer) {
    deployer.deploy(Ticket721Hub, {gas: 10000000});
};
