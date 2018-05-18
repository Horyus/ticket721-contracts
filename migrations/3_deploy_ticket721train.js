const Ticket721Train = artifacts.require("./Ticket721Train.sol");
const Ticket721 = artifacts.require("./Ticket721.sol");

module.exports = function(deployer) {
    let t721;
    let t721t;
    deployer
        .then(async () => {
            t721 = await Ticket721.deployed();
        })
        .then(async () => {
            await deployer.deploy(Ticket721Train, t721.address);
        })
        .then(async () => {
            t721t = await Ticket721Train.deployed();
        })
        .then(async () => {
            await t721.setDelegateMinter(t721t.address);
        });
};
