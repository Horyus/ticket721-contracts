const Web3 = require("web3");
const TruffleContracts = require("truffle-contract");
const BigNumber = require("bignumber.js");

let Ticket721;
let coinbase;

describe("ERC165 Tests", () => {

    beforeAll(async () => {
        const provider = new Web3.providers.HttpProvider("http://localhost:8547");
        provider.sendAsync = function() {
            return provider.send.apply(
                provider, arguments
            );
        };

        const _Ticket721Hub = TruffleContracts(require("../build/contracts/Ticket721HUB.json"));
        _Ticket721Hub.setProvider(provider);
        const Ticket721Hub = await _Ticket721Hub.deployed();
        const _Ticket721 = TruffleContracts(require("../build/contracts/Ticket721.json"));
        _Ticket721.setProvider(provider);
        Ticket721 = await _Ticket721.at(await Ticket721Hub.public_ticket_registries(0));

        const _Web3 = new Web3(provider);
        coinbase = await _Web3.eth.getCoinbase();
    });

    describe("supportsInterface(bytes4)", () => {

        test("Check Support for ERC165 Interface", (done) => {
            Ticket721.supportsInterface("0x01ffc9a7", {from: coinbase}).then(res => {
                if (!res)
                    done(new Error("Invalid ERC165 Implementation"));
                done();
            });
        });

        test("Check Support for ERC721Basic Interface", (done) => {
            Ticket721.supportsInterface("0xcff9d6b4", {from: coinbase}).then(res => {
                if (!res)
                    done(new Error("Invalid ERC165 Implementation"));
                done();
            });
        });

        test("Check Support for ERC721Enumerable Interface", (done) => {
            Ticket721.supportsInterface("0x780e9d63", {from: coinbase}).then(res => {
                if (!res)
                    done(new Error("Invalid ERC165 Implementation"));
                done();
            });
        });

        test("Check Support for ERC721Metadata Interface", (done) => {
            Ticket721.supportsInterface("0x5b5e139f", {from: coinbase}).then(res => {
                if (!res)
                    done(new Error("Invalid ERC165 Implementation"));
                done();
            });
        });

        test("Check Invalid Interface Handling #1", (done) => {
            Ticket721.supportsInterface("0x5b5e139e", {from: coinbase}).then(res => {
                if (res)
                    done(new Error("Invalid ERC165 Implementation"));
                done();
            });
        });

        test("Check Invalid Interface Handling #2", (done) => {
            Ticket721.supportsInterface("0x00000000", {from: coinbase}).then(res => {
                if (res)
                    done(new Error("Invalid ERC165 Implementation"));
                done();
            });
        });

        test("Check Invalid Interface Handling #3", (done) => {
            Ticket721.supportsInterface("0xabcdefab", {from: coinbase}).then(res => {
                if (res)
                    done(new Error("Invalid ERC165 Implementation"));
                done();
            });
        });

        test("Check Invalid Interface Handling #4", (done) => {
            Ticket721.supportsInterface("0x12345678", {from: coinbase}).then(res => {
                if (res)
                    done(new Error("Invalid ERC165 Implementation"));
                done();
            });
        });

        test("Check Invalid Interface Handling #5", (done) => {
            Ticket721.supportsInterface("0xdeadbeef", {from: coinbase}).then(res => {
                if (res)
                    done(new Error("Invalid ERC165 Implementation"));
                done();
            });
        });

    });

});
