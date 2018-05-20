const Web3 = require("web3");
const TruffleContracts = require("truffle-contract");
const RandomString = require("randomstring");

let output = "";

let Ticket721;
let Ticket721Train;
let coinbase;
let accounts;
let summary;

let approvals = {};

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
                    accounts = _accounts;
                    const populate = require("./populate");
                    populate(Ticket721, Ticket721Train, _Web3, accounts).then(res => {
                        summary = res;
                        done();
                    });
                });
            });
        });
    }, 300000);

    afterAll(() => {
        process.stdout.write(output);
    });

    describe("balanceOf(address)", () => {

        test("Check balance of accounts", async (done) => {
            for (let account_idx = 0; account_idx < Object.keys(summary).length; ++account_idx) {
                const account = Object.keys(summary)[account_idx];
                if ((await Ticket721.balanceOf(account, {from: account})).toNumber() !== summary[account].amount)
                    done(new Error("Invalid OnChain amount of Ticket721 for " + account));
            }
            done();
        });

        test("Check balance of random account", async (done) => {
            const account = "0x" + RandomString.generate({length: 40, charset: 'hex'});
            if ((await Ticket721.balanceOf(account, {from: account})).toNumber() !== 0)
                done(new Error("Invalid OnChain amount of Ticket721 for " + account));
            done();
        });

    });

    describe("ownerOf(uint256)", () => {

        const random_test = async (done)  => {
            const account_idx = Math.floor(Math.random() * 9);
            const account = Object.keys(summary)[account_idx];
            const id = summary[account].ids[Math.floor(Math.random() * summary[account].ids.length)].id;
            output += ("ownerOf(" + id + ") \t=== " + account + " ");
            if ((await Ticket721.ownerOf(id, {from : account})).toLowerCase() !== account.toLowerCase()) {
                output += "✗\n";
                done(new Error("Invalid OnChain owner for Ticket721 #" + id));
            } else {
                output +="✓\n";
                done();
            }
        };

        for(let test_idx = 0; test_idx < 25; ++test_idx) {
            test("Random Owner Check #" + (test_idx + 1), random_test);
        }

        test("Check with Invalid ID", async (done) => {
            try {
                const rand_id = Math.floor(Math.random() * 900000) + 333;
                output += ("ownerOf(" + rand_id + ") \tshould revert ");
                await Ticket721.ownerOf(rand_id, {from: coinbase});
                output += "✗\n";
                done(new Error("Unknown ID should revert: it didn't"));
            } catch (e) {
                output +="✓\n";
                done();
            }
        });

        test("Check with Invalid ID 0", async (done) => {
            try {
                const id = 0;
                output += ("ownerOf(0) \tshould revert ");
                await Ticket721.ownerOf(id, {from: coinbase});
                output += "✗\n";
                done(new Error("ID 0 should revert: it didn't"));
            } catch (e) {
                output +="✓\n";
                done();
            }
        });

    });

    describe("exists(uint256)", () => {

        const random_test = async (done)  => {
            const account_idx = Math.floor(Math.random() * 9);
            const account = Object.keys(summary)[account_idx];
            const id = summary[account].ids[Math.floor(Math.random() * summary[account].ids.length)].id;
            output += ("exists(" + id + ") \t=== true ");
            if (!(await Ticket721.exists(id, {from : account}))) {
                output += "✗\n";
                done(new Error("Invalid OnChain exist value for " + id));
            } else {
                output += "✓\n";
                done();
            }
        };

        for(let test_idx = 0; test_idx < 25; ++test_idx) {
            test("Random Exist Check #" + (test_idx + 1), random_test);
        }

        test("Check with Invalid ID", async (done) => {
            const rand_id = Math.floor(Math.random() * 900000) + 333;
            output += ("exists(" + rand_id + ") \t=== false ");
            if (await Ticket721.exists(rand_id, {from: coinbase})) {
                output += "✗\n";
                done(new Error("Unknown ID shouldn't 'exists': it did"));
            } else {
                output += "✓\n";
                done();
            }
        });

        test("Check with Invalid ID 0", async (done) => {
            try {
                const id = 0;
                output += ("exists(" + id + ") \tshould revert ");
                await Ticket721.ownerOf(id, {from: coinbase});
                output += "✗\n";
                done(new Error("ID 0 should revert: it didn't"));
            } catch (e) {
                output += "✓\n";
                done();
            }
        });

    });

    describe("approve(address, uint256)", () => {

        const random_test = async (done)  => {
            let combination_found = false;
            let count = 0;
            while (!combination_found && count < 25) {
                const account_idx = Math.floor(Math.random() * 9);
                let to_idx = Math.floor(Math.random() * 9);
                while (to_idx === account_idx)
                    to_idx = Math.floor(Math.random() * 9);
                const account = Object.keys(summary)[account_idx];
                const to = Object.keys(summary)[to_idx];
                const id = summary[account].ids[Math.floor(Math.random() * summary[account].ids.length)].id;
                if (approvals[id]) {
                    ++count;
                    continue ;
                }
                combination_found = true;
                output += ("approves(" + to + ", " + id + ", {from: " + account + "}" + ") \tshouldn't revert ");
                try {
                    await Ticket721.approve(to, id, {from: account});
                    approvals[id] = {from: account, to: to};
                    output += "✓\n";
                    done()
                } catch (e) {
                    output += "✗\n";
                    done(e);
                }
            }
        };

        for(let test_idx = 0; test_idx < 25; ++test_idx) {
            test("Random Approvals #" + (test_idx + 1), random_test);
        }

        test("Invalid Approval #1: Self Approval", async (done) => {
            let combination_found = false;
            let count = 0;
            while (!combination_found && count < 25) {
                const account_idx = Math.floor(Math.random() * 9);
                const account = Object.keys(summary)[account_idx];
                const to = account;
                const id = summary[account].ids[Math.floor(Math.random() * summary[account].ids.length)].id;
                if (approvals[id]) {
                    ++count;
                    continue ;
                }
                combination_found = true;
                output += ("approves(" + to + ", " + id + ", {from: " + account + "}" + ") \tshould revert ");
                try {
                    await Ticket721.approve(to, id, {from: account});
                    output += "✗\n";
                    done(new Error("Should not be possible to give approval to self"))
                } catch (e) {
                    output += "✓\n";
                    done();
                }
            }
        });

        test("Invalid Approval #2: Not mine", async (done) => {
            let combination_found = false;
            let count = 0;
            while (!combination_found && count < 25) {
                const account_idx = Math.floor(Math.random() * 9);
                const account = Object.keys(summary)[account_idx];

                let to_idx = Math.floor(Math.random() * 9);
                while (to_idx === account_idx)
                    to_idx = Math.floor(Math.random() * 9);
                const to = Object.keys(summary)[to_idx];

                let steal_idx = Math.floor(Math.random() * 9);
                while (steal_idx === account_idx || steal_idx === to_idx)
                    to_idx = Math.floor(Math.random() * 9);
                const steal = Object.keys(summary)[steal_idx];

                const id = summary[steal].ids[Math.floor(Math.random() * summary[steal].ids.length)].id;
                if (approvals[id]) {
                    ++count;
                    continue ;
                }
                combination_found = true;
                output += ("approves(" + to + ", " + id + ", {from: " + account + "}" + ") \tshould revert ");
                try {
                    await Ticket721.approve(to, id, {from: account});
                    output += "✗\n";
                    done(new Error("Should not be possible to approve not owned token"))
                } catch (e) {
                    output += "✓\n";
                    done();
                }
            }
        });

        test("Invalid Approval #3: Approving ID 0", async (done) => {
            const account_idx = Math.floor(Math.random() * 9);
            const account = Object.keys(summary)[account_idx];

            let to_idx = Math.floor(Math.random() * 9);
            while (to_idx === account_idx)
                to_idx = Math.floor(Math.random() * 9);
            const to = Object.keys(summary)[to_idx];

            const id = 0;
            output += ("approves(" + to + ", " + id + ", {from: " + account + "}" + ") \tshould revert ");
            try {
                await Ticket721.approve(to, id, {from: account});
                output += "✗\n";
                done(new Error("Should not be possible to approve ID 0"))
            } catch (e) {
                output += "✓\n";
                done();
            }
        });

        test("Remove Approval by Approving 0", async (done) => {
            const id_count = Object.keys(approvals).length;
            const id = Object.keys(approvals)[Math.floor(Math.random() * id_count)];
            output += ("approves(0x" + "0".repeat(40) + ", " + id + ", {from: " + approvals[id].from + "}" + ") \tshouldn't revert ");
            try {
                await Ticket721.approve("0x" + "0".repeat(40), id, {from: approvals[id].from});
                delete approvals[id];
                output += "✓\n";
                done();
            } catch (e) {
                output += "✗\n";
                done(new Error("Should be possible to cancel approval by approving address(0)"))
            }
        });

    });

    describe("getApproved(uint256)", () => {

        test("Checking previous approvals", async (done) => {
            for (let approval_idx = 0; approval_idx < Object.keys(approvals).length; ++approval_idx) {
                const id = Object.keys(approvals)[approval_idx];

                output += ("getApproved(" + id + ") \t=== " + approvals[id].to + " ");
                if ((await Ticket721.getApproved(id, {from: coinbase})).toLowerCase() !== approvals[id].to.toLowerCase()) {
                    output += "✗\n";
                    done(new Error("Registered Approval Identity is wrong"));
                    return ;
                } else {
                    output += "✓\n";
                }
            }
            done();
        });

        test("Checking unapproved ID", async (done) => {
            let combination_found = false;
            let count = 0;
            while (!combination_found && count < 25) {
                const account_idx = Math.floor(Math.random() * 9);
                const account = Object.keys(summary)[account_idx];
                const id = summary[account].ids[Math.floor(Math.random() * summary[account].ids.length)].id;
                if (approvals[id]) {
                    ++count;
                    continue ;
                }
                combination_found = true;
                output += ("getApproved(" + id + ") \t=== 0x" + "0".repeat(40) + " ");
                if ((await Ticket721.getApproved(id, {from: account})) !== ("0x" + "0".repeat(40))) {
                    output += "✗\n";
                    done(new Error("Unapproved Token contain address(0)"));
                } else {
                    output += "✓\n";
                    done();
                }
            }
        });

    });

    describe("setApprovalForAll(address, bool)", () => {

        test("dummy", () => {
            expect(coinbase).not.toBe(null);
        });

    });

    describe("isApprovedForAll(address, address)", () => {

        test("dummy", () => {
            expect(coinbase).not.toBe(null);
        });

    });

    describe("transferFrom(address, address, uint256)", () => {

        test("dummy", () => {
            expect(coinbase).not.toBe(null);
        });

    });

    describe("safeTransferFrom(address, address, uint256)", () => {

        test("dummy", () => {
            expect(coinbase).not.toBe(null);
        });

    });

    describe("safeTransferFrom(address, address, uint256, bytes)", () => {

        test("dummy", () => {
            expect(coinbase).not.toBe(null);
        });

    });

});
