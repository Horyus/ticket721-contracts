const Ticket721Hub = artifacts.require("./Ticket721Hub.sol");

module.exports = function(deployer) {
    deployer.then(async () => {
        await deployer.deploy(Ticket721Hub, {gas: 15000000, gasPrice: 1});
    });
};
