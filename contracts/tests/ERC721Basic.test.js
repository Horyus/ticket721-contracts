const Web3 = require("web3");
const TruffleContracts = require("truffle-contract");

let Ticket721;
let Ticket721Train;
let coinbase;
let accounts;

describe("ERC721Basic Tests", () => {

    beforeAll(async (done) => {
        const provider = new Web3.providers.HttpProvider("http://localhost:8547");
        provider.sendAsync = function () {
            return provider.send.apply(
                provider, arguments
            );
        };
        const _Ticket721 = TruffleContracts(require("../../build/contracts/Ticket721.json"));
        _Ticket721.setProvider(provider);
        _Ticket721.deployed().then(d_Ticket721 => {
            Ticket721 = d_Ticket721;
            const _Ticket721Train = TruffleContracts(require("../../build/contracts/Ticket721Train.json"));
            _Ticket721Train.setProvider(provider);
            _Ticket721Train.deployed().then(d_Ticket721Train => {
                Ticket721Train = d_Ticket721Train;
                const _Web3 = new Web3(provider);
                _Web3.eth.getAccounts().then(_accounts => {
                    coinbase = _accounts[0];
                    accounts = _accounts.slice(1);
                    const populate = require("./populate");
                    populate(Ticket721, Ticket721Train, _Web3, accounts.concat([coinbase])).then(res => {
                        done();
                    });
                });
            });
        });
    }, 300000);

    describe("balanceOf(address)", () => {

        test("dummy", () => {
            expect(coinbase).not.toBe(null);
        }, 20000);

    });

    describe("ownerOf(uint256)", () => {

        test("dummy", () => {
            expect(coinbase).not.toBe(null);
        }, 20000);

    });

    describe("exists(uint256)", () => {

        test("dummy", () => {
            expect(coinbase).not.toBe(null);
        }, 20000);

    });

    describe("approve(address, uint256)", () => {

        test("dummy", () => {
            expect(coinbase).not.toBe(null);
        }, 20000);

    });

    describe("getApproved(uint256)", () => {

        test("dummy", () => {
            expect(coinbase).not.toBe(null);
        }, 20000);

    });

    describe("setApprovalForAll(address, bool)", () => {

        test("dummy", () => {
            expect(coinbase).not.toBe(null);
        }, 20000);

    });

    describe("isApprovedForAll(address, address)", () => {

        test("dummy", () => {
            expect(coinbase).not.toBe(null);
        }, 20000);

    });

    describe("transferFrom(address, address, uint256)", () => {

        test("dummy", () => {
            expect(coinbase).not.toBe(null);
        }, 20000);

    });

    describe("safeTransferFrom(address, address, uint256)", () => {

        test("dummy", () => {
            expect(coinbase).not.toBe(null);
        }, 20000);

    });

    describe("safeTransferFrom(address, address, uint256, bytes)", () => {

        test("dummy", () => {
            expect(coinbase).not.toBe(null);
        }, 20000);

    });

});
