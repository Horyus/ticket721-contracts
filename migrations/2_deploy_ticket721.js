const Ticket721 = artifacts.require("./Ticket721.sol");

module.exports = function(deployer) {
    const sale_name = "My Ticket";
    const sale_symbol = "MTK";
    const ticket_count = 100;
    const ticket_price = web3.toWei('0.005', 'ether');
    deployer.deploy(Ticket721, sale_name, sale_symbol, ticket_price, ticket_count);
};
