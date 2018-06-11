const Ticket721Hub = artifacts.require("./Ticket721HUB.sol");
const Ticket721Event = artifacts.require("./Ticket721Event.sol");
const Ticket721VerifiedAccounts = artifacts.require("./Ticket721VerifiedAccounts");

module.exports = function(deployer, network, accounts) {
    let t721h;
    let coinbase = accounts[0];
    let account_manager;
    //let name = "Ticket721 | Alpha";
    //let symbol = "T721A";
    let name_public = "Public Ticket721 | Alpha";
    let symbol_public = "PT721A";
    let sale_address;
    let verified_sale_address;
    const end_sale = new Date(Date.now());
    end_sale.setDate(end_sale.getDate() + 10);
    const event_begin = new Date(Date.now());
    event_begin.setDate(event_begin.getDate() + 12);
    const event_end = new Date(Date.now());
    event_end.setDate(event_end.getDate() + 13);

    deployer
        .then(async () => {
            t721h = await Ticket721Hub.deployed();
        })
        .then(async () => {
            await t721h.deployPublicRegistry(name_public, symbol_public);
        })
        .then(async () => {
            sale_address = await t721h.public_ticket_registries(0);
        })
        .then(async () => {
            await deployer.deploy(Ticket721Event, sale_address, 100000, 12345, "DATA", "NAME", end_sale.getTime(), event_begin.getTime(), event_end.getTime(), {gas: 8000000});
            await (await Ticket721Event.deployed()).register();
        })
        //.then(async () => {
        //    await t721h.deployVerifiedRegistry(name, symbol);
        //})
        //.then(async () => {
        //    verified_sale_address = await t721h.verified_ticket_registries(0);
        //    console.log("Verified SALE", verified_sale_address);
        //})
        //.then(async () => {
        //})
};
