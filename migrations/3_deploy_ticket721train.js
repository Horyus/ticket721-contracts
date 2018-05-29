const Ticket721Train = artifacts.require("./Ticket721Train.sol");
const Ticket721 = artifacts.require("./Ticket721.sol");

module.exports = function(deployer) {
    let t721;
    let t721t;
    const metadata = JSON.stringify({
        "first_name": {
            "type": "string",
            "description": "User First Name"
        },
        "last_name": {
            "type": "string",
            "description": "User Last Name"
        }
    });
    console.log(metadata);
    deployer
        .then(async () => {
            t721 = await Ticket721.deployed();
        })
        .then(async () => {
            await deployer.deploy(Ticket721Train, t721.address, metadata);
        })
        .then(async () => {
            t721t = await Ticket721Train.deployed();
        })
        .then(async () => {
            await t721.setDelegateMinter(t721t.address);
        });
};
