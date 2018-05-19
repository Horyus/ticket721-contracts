const Web3 = require("web3");
const TruffleContracts = require("truffle-contract");
const BigNumber = require("bignumber.js");

let Ticket721;
let coinbase;

describe("ERC721Metadata Tests", () => {

    beforeAll(async () => {
        const provider = new Web3.providers.HttpProvider("http://localhost:8547");
        provider.sendAsync = function () {
            return provider.send.apply(
                provider, arguments
            );
        };

        const _Ticket721 = TruffleContracts(require("../../build/contracts/Ticket721.json"));
        _Ticket721.setProvider(provider);
        Ticket721 = await _Ticket721.deployed();

        const _Web3 = new Web3(provider);
        coinbase = await _Web3.eth.getCoinbase();
    });

    describe("name()", () => {

        test("Check return value", (done) => {
            Ticket721.name({from: coinbase}).then(res => {
                if (res !== 'My Ticket')
                    done(new Error("Invalid recovered name"));
                done();
            });
        })

    });

    describe("symbol()", () => {

       test("Check return value", (done) => {
            Ticket721.symbol({from: coinbase}).then(res => {
                if (res !== 'MTK')
                    done(new Error("Invalid recovered symbol"));
                done();
            })
       });

    });

    describe("tokenURI()", () => {
        //TODO
    })

});
