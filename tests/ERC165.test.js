const Web3 = require("web3");

let Ticket721;
let coinbase;

describe("ERC165 Tests", () => {

    beforeAll(async () => {
        const provider = new Web3.providers.HttpProvider(process.env.BC_URL || "http://localhost:8558");
        provider.sendAsync = function () {
            return provider.send.apply(
                provider, arguments
            );
        };
        const _Web3 = new Web3(provider);

        const dist_path = process.env.DIST_PATH || "../dist";

        const _Ticket721 = require(dist_path + "/contracts/Ticket721Public");
        Ticket721 = new _Web3.eth.Contract(_Ticket721.abi, _Ticket721.address);


        const _accounts = await _Web3.eth.getAccounts();
        coinbase = _accounts[0];
        const populate = require("./populate");
    });

    describe("supportsInterface(bytes4)", () => {

        test("Check Support for ERC165 Interface", (done) => {
            Ticket721.methods.supportsInterface("0x01ffc9a7").call({from: coinbase}).then(res => {
                if (!res)
                    done(new Error("Invalid ERC165 Implementation"));
                done();
            });
        });

        test("Check Support for ERC721Basic Interface", (done) => {
            Ticket721.methods.supportsInterface("0xcff9d6b4").call({from: coinbase}).then(res => {
                if (!res)
                    done(new Error("Invalid ERC165 Implementation"));
                done();
            });
        });

        test("Check Support for ERC721Enumerable Interface", (done) => {
            Ticket721.methods.supportsInterface("0x780e9d63").call({from: coinbase}).then(res => {
                if (!res)
                    done(new Error("Invalid ERC165 Implementation"));
                done();
            });
        });

        test("Check Support for ERC721Metadata Interface", (done) => {
            Ticket721.methods.supportsInterface("0x5b5e139f").call({from: coinbase}).then(res => {
                if (!res)
                    done(new Error("Invalid ERC165 Implementation"));
                done();
            });
        });

        test("Check Invalid Interface Handling #1", (done) => {
            Ticket721.methods.supportsInterface("0x5b5e139e").call({from: coinbase}).then(res => {
                if (res)
                    done(new Error("Invalid ERC165 Implementation"));
                done();
            });
        });

        test("Check Invalid Interface Handling #2", (done) => {
            Ticket721.methods.supportsInterface("0x00000000").call({from: coinbase}).then(res => {
                if (res)
                    done(new Error("Invalid ERC165 Implementation"));
                done();
            });
        });

        test("Check Invalid Interface Handling #3", (done) => {
            Ticket721.methods.supportsInterface("0xabcdefab").call({from: coinbase}).then(res => {
                if (res)
                    done(new Error("Invalid ERC165 Implementation"));
                done();
            });
        });

        test("Check Invalid Interface Handling #4", (done) => {
            Ticket721.methods.supportsInterface("0x12345678").call({from: coinbase}).then(res => {
                if (res)
                    done(new Error("Invalid ERC165 Implementation"));
                done();
            });
        });

        test("Check Invalid Interface Handling #5", (done) => {
            Ticket721.methods.supportsInterface("0xdeadbeef").call({from: coinbase}).then(res => {
                if (res)
                    done(new Error("Invalid ERC165 Implementation"));
                done();
            });
        });

    });

});
