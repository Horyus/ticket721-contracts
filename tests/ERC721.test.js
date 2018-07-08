const Web3 = require("web3");
const RandomString = require("randomstring");

let output = "";

let Ticket721;
let Ticket721Event;
let Ticket721Hub;
let Ticket721TestReceiver;
let Web3I;
let coinbase;
let accounts;
let init;
let summary;
let total;

let approvals = {};
let transfers = {};
let sale = {};
let close = {};

const _describe = () => {};

describe("ERC721 Tests", () => {

    beforeAll(async (done) => {

        const provider = new Web3.providers.HttpProvider(process.env.BC_URL || "http://localhost:8545");
        provider.sendAsync = function () {
            return provider.send.apply(
                provider, arguments
            );
        };
        const _Web3 = new Web3(provider);

        const dist_path = process.env.DIST_PATH || "../dist";

        const _Ticket721Hub = require(dist_path + "/contracts/Ticket721Hub");
        Ticket721Hub = new _Web3.eth.Contract(_Ticket721Hub.abiDefinition, _Ticket721Hub.deployedAddress);

        const _Ticket721Event = require(dist_path + "/contracts/Ticket721Event");
        Ticket721Event = new _Web3.eth.Contract(_Ticket721Event.abiDefinition, _Ticket721Event.deployedAddress);


        const _Ticket721 = require(dist_path + "/contracts/Ticket721Public");
        Ticket721 = new _Web3.eth.Contract(_Ticket721.abiDefinition, _Ticket721.deployedAddress);


        const _Ticket721TestReceiver = require(dist_path + "/contracts/Ticket721TestReceiver");
        Ticket721TestReceiver = new _Web3.eth.Contract(_Ticket721TestReceiver.abiDefinition, _Ticket721TestReceiver.deployedAddress);

        Web3I = _Web3;
        const _accounts = await _Web3.eth.getAccounts();
        coinbase = _accounts[0];
        accounts = _accounts;
        const populate = require("./populate");
        populate(Ticket721, Ticket721Event, _Web3, accounts).then(res => {
            summary = res.summary;
            summary[Ticket721TestReceiver.options.address] = {
                amount: 0,
                ids: []
            };
            init = res.init;
            total = res.total;
            done();
        });

    }, 600000);

    test("NOTHING", () => {

    });

    describe("ERC721Metadata Tests", () => {

        describe("name()", () => {

            test("Check return value", async (done) => {

                if ((await Ticket721.methods.name().call({from: coinbase})) !== 'Ticket721 Public Registry') {
                    done(new Error("Invalid recovered name"));
                }
                done();

            });

        });

        describe("symbol()", () => {

            test("Check return value", async (done) => {

                if ((await Ticket721.methods.symbol().call({from: coinbase})) !== 'T721P') {
                    done(new Error("Invalid recovered symbol"));
                }
                done();
            })

        });


        describe("tokenURI()", () => {
            //TODO
        })

    });

    describe("ERC721Basic Tests", () => {

        describe("balanceOf(address)", () => {

            test("Check balance of accounts", async (done) => {

                for (let account_idx = 0; account_idx < Object.keys(summary).length; ++account_idx) {
                    const account = Object.keys(summary)[account_idx];
                    if (parseInt(await Ticket721.methods.balanceOf(account).call({from: account})) !== summary[account].amount)
                        done(new Error("Invalid OnChain amount of Ticket721 for " + account));
                }
                done();

            }, 60000);

            test("Check balance of random account", async (done) => {

                const account = "0x" + RandomString.generate({length: 40, charset: 'hex'});
                if (parseInt(await Ticket721.methods.balanceOf(account).call({from: account})) !== 0)
                    done(new Error("Invalid OnChain amount of Ticket721 for " + account));
                done();

            });

        });

        describe("ownerOf(uint256)", () => {

            const random_test = async (done) => {

                const account_idx = Math.floor(Math.random() * 10);
                const account = Object.keys(summary)[account_idx];
                const id = summary[account].ids[Math.floor(Math.random() * summary[account].ids.length)].id;
                output += ("ownerOf(" + id + ") \t=== " + account + " ");
                if ((await Ticket721.methods.ownerOf(id).call({from: account})).toLowerCase() !== account.toLowerCase()) {
                    output += "✗\n";
                    done(new Error("Invalid OnChain owner for Ticket721 #" + id));
                } else {
                    output += "✓\n";
                    done();
                }

            };

            for (let test_idx = 0; test_idx < 25; ++test_idx) {
                test("Random Owner Check #" + (test_idx + 1), random_test);
            }

            test("Check with Invalid ID", async (done) => {

                try {
                    const rand_id = Math.floor(Math.random() * 1000000) + 333;
                    output += ("ownerOf(" + rand_id + ") \tshould revert ");
                    await Ticket721.methods.ownerOf(rand_id).call({from: coinbase});
                    output += "✗\n";
                    done(new Error("Unknown ID should revert: it didn't"));
                } catch (e) {
                    output += "✓\n";
                    done();
                }

            });

            test("Check with Invalid ID 0", async (done) => {

                try {
                    const id = 0;
                    output += ("ownerOf(0) \tshould revert ");
                    await Ticket721.methods.ownerOf(id).call({from: coinbase});
                    output += "✗\n";
                    done(new Error("ID 0 should revert: it didn't"));
                } catch (e) {
                    output += "✓\n";
                    done();
                }

            });

        });

        describe("exists(uint256)", () => {

            const random_test = async (done) => {

                const account_idx = Math.floor(Math.random() * 10);
                const account = Object.keys(summary)[account_idx];
                const id = summary[account].ids[Math.floor(Math.random() * summary[account].ids.length)].id;
                output += ("exists(" + id + ") \t=== true ");
                if (!(await Ticket721.methods.exists(id).call({from: account}))) {
                    output += "✗\n";
                    done(new Error("Invalid OnChain exist value for " + id));
                } else {
                    output += "✓\n";
                    done();
                }

            };

            for (let test_idx = 0; test_idx < 100; ++test_idx) {
                test("Random Exist Check #" + (test_idx + 1), random_test);
            }

            test("Check with Invalid ID", async (done) => {

                const rand_id = Math.floor(Math.random() * 1000000) + 333;
                output += ("exists(" + rand_id + ") \t=== false ");
                if (await Ticket721.methods.exists(rand_id).call({from: coinbase})) {
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
                    await Ticket721.methods.ownerOf(id).call({from: coinbase});
                    output += "✗\n";
                    done(new Error("ID 0 should revert: it didn't"));
                } catch (e) {
                    output += "✓\n";
                    done();
                }

            });

        });

        describe("approve(address, uint256)", () => {

            const random_test = async (done) => {

                let combination_found = false;
                while (!combination_found) {
                    const account_idx = Math.floor(Math.random() * 10);
                    let to_idx = Math.floor(Math.random() * 10);
                    while (to_idx === account_idx)
                        to_idx = Math.floor(Math.random() * 10);
                    const account = Object.keys(summary)[account_idx];
                    const to = Object.keys(summary)[to_idx];
                    const id_idx = Math.floor(Math.random() * summary[account].ids.length);
                    const id = summary[account].ids[id_idx].id;
                    if (approvals[id]) {
                        continue;
                    }
                    if (account_idx === 0 && id_idx === 0) {
                        continue ;
                    }
                    combination_found = true;
                    output += ("approves(" + to + ", " + id + ", {from: " + account + "}" + ") \tshouldn't revert ");
                    try {
                        await Ticket721.methods.approve(to, id).send({from: account});
                        approvals[id] = {from: account, to: to};
                        output += "✓\n";
                        done()
                    } catch (e) {
                        output += "✗\n";
                        done(e);
                    }
                }

            };

            for (let test_idx = 0; test_idx < 150; ++test_idx) {
                test("Random Approvals #" + (test_idx + 1), random_test);
            }

            test("Invalid Approval #1: Self Approval", async (done) => {

                let combination_found = false;
                while (!combination_found) {
                    const account_idx = Math.floor(Math.random() * 10);
                    const account = Object.keys(summary)[account_idx];
                    const to = account;
                    const id = summary[account].ids[Math.floor(Math.random() * summary[account].ids.length)].id;
                    if (approvals[id]) {
                        continue;
                    }
                    combination_found = true;
                    output += ("approves(" + to + ", " + id + ", {from: " + account + "}" + ") \tshould revert ");
                    try {
                        await Ticket721.methods.approve(to, id).send({from: account});
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
                while (!combination_found) {
                    const account_idx = Math.floor(Math.random() * 10);
                    const account = Object.keys(summary)[account_idx];

                    let to_idx = Math.floor(Math.random() * 10);
                    while (to_idx === account_idx)
                        to_idx = Math.floor(Math.random() * 10);
                    const to = Object.keys(summary)[to_idx];

                    let steal_idx = Math.floor(Math.random() * 10);
                    while (steal_idx === account_idx || steal_idx === to_idx)
                        steal_idx = Math.floor(Math.random() * 10);
                    const steal = Object.keys(summary)[steal_idx];

                    const id = summary[steal].ids[Math.floor(Math.random() * summary[steal].ids.length)].id;
                    if (approvals[id]) {
                        continue;
                    }
                    combination_found = true;
                    output += ("approves(" + to + ", " + id + ", {from: " + account + "}" + ") \tshould revert ");
                    try {
                        await Ticket721.methods.approve(to, id).send({from: account});
                        output += "✗\n";
                        done(new Error("Should not be possible to approve not owned token"))
                    } catch (e) {
                        output += "✓\n";
                        done();
                    }
                }

            });

            test("Invalid Approval #3: Approving ID 0", async (done) => {

                const account_idx = Math.floor(Math.random() * 10);
                const account = Object.keys(summary)[account_idx];

                let to_idx = Math.floor(Math.random() * 10);
                while (to_idx === account_idx)
                    to_idx = Math.floor(Math.random() * 10);
                const to = Object.keys(summary)[to_idx];

                const id = 0;
                output += ("approves(" + to + ", " + id + ", {from: " + account + "}" + ") \tshould revert ");
                try {
                    await Ticket721.methods.approve(to, id).send({from: account});
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
                    await Ticket721.methods.approve("0x" + "0".repeat(40), id).send({from: approvals[id].from});
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
                    if ((await Ticket721.methods.getApproved(id).call({from: coinbase})).toLowerCase() !== approvals[id].to.toLowerCase()) {
                        output += "✗\n";
                        done(new Error("Registered Approval Identity is wrong"));
                        return;
                    } else {
                        output += "✓\n";
                    }
                }
                done();

            });

            test("Checking unapproved ID", async (done) => {

                let combination_found = false;
                while (!combination_found) {
                    const account_idx = Math.floor(Math.random() * 10);
                    const account = Object.keys(summary)[account_idx];
                    const id = summary[account].ids[Math.floor(Math.random() * summary[account].ids.length)].id;
                    if (approvals[id]) {
                        continue;
                    }
                    combination_found = true;
                    output += ("getApproved(" + id + ") \t=== 0x" + "0".repeat(40) + " ");
                    if ((await Ticket721.methods.getApproved(id).call({from: account})) !== ("0x" + "0".repeat(40))) {
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

            test("Set approval for account #1 on account #0", async (done) => {

                try {
                    await Ticket721.methods.setApprovalForAll(accounts[1], true).send({from: coinbase});
                    done();
                } catch (e) {
                    done(new Error("Shouldn't revert: it did"));
                }

            });

        });

        describe("isApprovedForAll(address, address)", () => {

            test("Test automatic revert", async (done) => {

                if ((await Ticket721.methods.isApprovedForAll(accounts[0], accounts[1]).call({from: coinbase})) === false) {
                    done(new Error("Should return true"));
                } else {
                    done();
                }

            });

        });

        describe("transferFrom(address, address, uint256)", () => {

            const random_transfer = async (done) => {

                let found = false;
                while (!found) {
                    const account_idx = Math.floor(Math.random() * 10);
                    const account = Object.keys(summary)[account_idx];

                    let to_idx = Math.floor(Math.random() * 10);
                    while (to_idx === account_idx)
                        to_idx = Math.floor(Math.random() * 10);
                    const to = Object.keys(summary)[to_idx];

                    if (!summary[account].ids.length) {
                        continue;
                    }
                    found = true;
                    let id_idx = Math.floor(Math.random() * (summary[account].ids.length));
                    const id = summary[account].ids[id_idx].id;
                    try {
                        output += ("transferFrom(" + account + ", " + to + ", " + id + ") from " + account + " \tshouldn't revert ");
                        const call_gas = await Ticket721.methods.transferFrom(account, to, id).estimateGas({
                            from: account
                        });
                        await Ticket721.methods.transferFrom(account, to, id).send({from: account, gas: call_gas * 2});
                        summary[to].ids.push({...summary[account].ids[id_idx]});
                        summary[account].ids = summary[account].ids.filter((elem, idx) => idx !== id_idx);
                        ++summary[to].amount;
                        --summary[account].amount;
                        transfers[id] = to;
                        output += "✓\n";
                        done();
                    } catch (e) {
                        output += "✗\n";
                        done(e);
                    }
                }

            };

            test("Operator #1 transfers #0", async (done) => {

                const account = accounts[0];
                const to = accounts[1];
                if (!summary[account].ids.length) {
                    done();
                    return ;
                }
                let id_idx = 0;
                const id = summary[account].ids[id_idx].id;
                try {
                    output += ("transferFrom(" + account + ", " + to + ", " + id + ") from " + accounts[1] + " \tshouldn't revert ");
                    const call_gas = await Ticket721.methods.transferFrom(account, to, id).estimateGas({
                        from: accounts[1]
                    });
                    await Ticket721.methods.transferFrom(account, to, id).send({from: accounts[1], gas: call_gas * 2});
                    summary[to].ids.push({...summary[account].ids[id_idx]});
                    summary[account].ids = summary[account].ids.filter((elem, idx) => idx !== id_idx);
                    ++summary[to].amount;
                    --summary[account].amount;
                    transfers[id] = to;
                    output += "✓\n";
                    done();
                } catch (e) {
                    output += "✗\n";
                    done(e);
                }

            });

            test("Transfer all previously approved tokens", async (done) => {

                for (let approval_idx = 0; approval_idx < Object.keys(approvals).length; ++approval_idx) {
                    const id = Object.keys(approvals)[approval_idx];
                    const {from, to} = approvals[id];
                    let id_idx = -1;
                    for (let search_idx = 0; search_idx < summary[from].ids.length; ++search_idx) {
                        if (summary[from].ids[search_idx].id === parseInt(id)) {
                            id_idx = search_idx;
                            break;
                        }
                    }
                    try {
                        output += ("transferFrom(" + from + ", " + to + ", " + id + ") from " + to + " \tshouldn't revert ");
                        const call_gas = await Ticket721.methods.transferFrom(from, to, id).estimateGas({
                            from: to
                        });
                        await Ticket721.methods.transferFrom(from, to, id).send({from: to, gas: call_gas * 2});
                        summary[to].ids.push({...summary[from].ids[id_idx]});
                        summary[from].ids = summary[from].ids.filter((elem, idx) => idx !== id_idx);
                        ++summary[to].amount;
                        --summary[from].amount;
                        transfers[id] = to;
                        output += "✓\n";
                    } catch (e) {
                        output += "✗\n";
                        done(e);
                        return;
                    }
                }
                done();

            }, 60000);

            for (let test_idx = 0; test_idx < 250; ++test_idx) {
                test("Random Transfer #" + (test_idx + 1), random_transfer);
            }

        });

        describe("safeTransferFrom(address, address, uint256)", () => {

            const random_transfer_to_receiver = async (done) => {

                let found = false;
                while (!found) {
                    const account_idx = Math.floor(Math.random() * 10);
                    const account = Object.keys(summary)[account_idx];

                    const to = Ticket721TestReceiver.options.address;

                    if (!summary[account].ids.length) {
                        continue;
                    }
                    found = true;
                    let id_idx = Math.floor(Math.random() * (summary[account].ids.length));
                    const id = summary[account].ids[id_idx].id;
                    try {
                        output += ("safeTransferFrom(" + account + ", " + to + ", " + id + ") from " + account + " \tshouldn't revert ");
                        const call_gas = await Ticket721.methods['safeTransferFrom(address,address,uint256)'](account, to, id).estimateGas({
                            from: account
                        });
                        await Ticket721.methods['safeTransferFrom(address,address,uint256)'](account, to, id).send({from: account, gas: call_gas * 2});
                        const last_id = parseInt(await Ticket721TestReceiver.methods.last_id().call({from: account}));
                        if (last_id !== parseInt(id))
                            done(new Error("Invalid receiver informations for last id: " + last_id + " vs " + parseInt(id)));
                        const last_sender = (await Ticket721TestReceiver.methods.last_sender().call({from: account})).toLowerCase();
                        if (last_sender !== account.toLowerCase())
                            done(new Error("Invalid receiver informations for last sender: " + last_sender + " vs " + account.toLowerCase()));
                        summary[to].ids.push({...summary[account].ids[id_idx]});
                        summary[account].ids = summary[account].ids.filter((elem, idx) => idx !== id_idx);
                        ++summary[to].amount;
                        --summary[account].amount;
                        transfers[id] = to;
                        output += "✓\n";
                        done();
                    } catch (e) {
                        output += "✗\n";
                        done(e);
                    }
                }

            };

            const random_transfer_to_users = async (done) => {

                let found = false;
                while (!found) {
                    const account_idx = Math.floor(Math.random() * 10);
                    const account = Object.keys(summary)[account_idx];

                    let to_idx = Math.floor(Math.random() * 10);
                    while (to_idx === account_idx)
                        to_idx = Math.floor(Math.random() * 10);
                    const to = Object.keys(summary)[to_idx];

                    if (!summary[account].ids.length) {
                        continue;
                    }
                    found = true;
                    let id_idx = Math.floor(Math.random() * (summary[account].ids.length));
                    const id = summary[account].ids[id_idx].id;
                    try {
                        output += ("safeTransferFrom(" + account + ", " + to + ", " + id + ") from " + account + " \tshouldn't revert ");
                        const call_gas = await Ticket721.methods['safeTransferFrom(address,address,uint256)'](account, to, id).estimateGas({
                            from: account
                        });
                        await Ticket721.methods['safeTransferFrom(address,address,uint256)'](account, to, id).send({from: account, gas: call_gas * 2});
                        summary[to].ids.push({...summary[account].ids[id_idx]});
                        summary[account].ids = summary[account].ids.filter((elem, idx) => idx !== id_idx);
                        ++summary[to].amount;
                        --summary[account].amount;
                        transfers[id] = to;
                        output += "✓\n";
                        done();
                    } catch (e) {
                        output += "✗\n";
                        done(e);
                    }
                }

            };

            for (let test_idx = 0; test_idx < 250; ++test_idx) {
                test("Random Safe Transfer to User #" + (test_idx + 1), random_transfer_to_users);
            }

            for (let test_idx = 0; test_idx < 100; ++test_idx) {
                test("Random Safe Transfer to Contract #" + (test_idx + 1), random_transfer_to_receiver);
            }

            test("Invalid Transfer #1: Not mine", async (done) => {

                let found = false;
                while (!found) {
                    const account_idx = Math.floor(Math.random() * 10);
                    const account = Object.keys(summary)[account_idx];

                    let to_idx = Math.floor(Math.random() * 10);
                    while (to_idx === account_idx)
                        to_idx = Math.floor(Math.random() * 10);
                    const to = Object.keys(summary)[to_idx];

                    if (!summary[account].ids.length) {
                        continue;
                    }
                    found = true;
                    let id_idx = Math.floor(Math.random() * (summary[account].ids.length));
                    const id = summary[account].ids[id_idx].id;
                    try {
                        output += ("safeTransferFrom(" + to + ", " + account + ", " + id + ") from " + account + " \tshouldn't revert ");
                        const call_gas = await Ticket721.methods['safeTransferFrom(address,address,uint256)'](to, account, id).estimateGas({
                            from: account
                        });
                        await Ticket721.methods['safeTransferFrom(address,address,uint256)'](to, account, id).send({from: to, gas: call_gas * 2});
                        summary[to].ids.push({...summary[account].ids[id_idx]});
                        summary[account].ids = summary[account].ids.filter((elem, idx) => idx !== id_idx);
                        ++summary[to].amount;
                        --summary[account].amount;
                        transfers[id] = to;
                        output += "✗\n";
                        done(new Error("Transfer of not owner token should revert: it didn't"));
                    } catch (e) {
                        output += "✓\n";
                        done();
                    }
                }

            });

            test("Invalid Transfer #2: Approval Replay", async (done) => {

                let approval_idx = Math.floor(Math.random() * Object.keys(approvals).length);
                const id = Object.keys(approvals)[approval_idx];
                const {from, to} = approvals[id];
                let id_idx = -1;
                for (let search_idx = 0; search_idx < summary[from].ids.length; ++search_idx) {
                    if (summary[from].ids[search_idx].id === parseInt(id)) {
                        id_idx = search_idx;
                        break;
                    }
                }
                try {
                    output += ("safeTransferFrom(" + from + ", " + to + ", " + id + ") from " + to + " \tshould revert ");
                    const call_gas = await Ticket721.methods['safeTransferFrom(address,address,uint256)'](from, to, id).estimateGas({
                        from: account
                    });
                    await Ticket721.methods['safeTransferFrom(address,address,uint256)'](from, to, id).send({from: to, gas: call_gas * 2});
                    summary[to].ids.push({...summary[from].ids[id_idx]});
                    summary[from].ids = summary[from].ids.filter((elem, idx) => idx !== id_idx);
                    ++summary[to].amount;
                    --summary[from].amount;
                    transfers[id] = to;
                    output += "✗\n";
                    done(new Error("Should not have approval rights remaining"));
                } catch (e) {
                    output += "✓\n";
                    done();
                }

            });

        });

        describe("safeTransferFrom(address, address, uint256, bytes)", () => {

            const random_transfer_to_receiver = async (done) => {
                let found = false;
                while (!found) {
                    const account_idx = Math.floor(Math.random() * 10);
                    const account = Object.keys(summary)[account_idx];

                    const to = Ticket721TestReceiver.options.address;
                    const data = "0x" + RandomString.generate({length: 8, charset: 'hex'});

                    if (!summary[account].ids.length) {
                        continue;
                    }
                    found = true;
                    let id_idx = Math.floor(Math.random() * (summary[account].ids.length));
                    const id = summary[account].ids[id_idx].id;
                    try {
                        output += ("safeTransferFrom(" + account + ", " + to + ", " + id + ", " + data + ") from " + account + " \tshouldn't revert ");
                        const call_gas = await Ticket721.methods['safeTransferFrom(address,address,uint256,bytes)'](account, to, id, data).estimateGas({
                            from: account
                        });
                        await Ticket721.methods['safeTransferFrom(address,address,uint256,bytes)'](account, to, id, data).send({
                            from: account,
                            gas: call_gas * 2
                        });
                        const last_id = parseInt(await Ticket721TestReceiver.methods.last_id().call({from: account}));
                        if (last_id !== parseInt(id))
                            done(new Error("Invalid receiver informations for last id :" + last_id + " vs " + parseInt(id)));
                        const last_sender = (await Ticket721TestReceiver.methods.last_sender().call({from: account})).toLowerCase();
                        if (last_sender !== account.toLowerCase())
                            done(new Error("Invalid receiver informations for last sender :" + last_sender + " vs " + account.toLowerCase()));
                        const last_data = (await Ticket721TestReceiver.methods.last().call()).toLowerCase();
                        if (last_data !== data.toLowerCase())
                            done(new Error("Invalid receiver informations for last data :" + last_data + " vs " + data.toLowerCase()));
                        summary[to].ids.push({...summary[account].ids[id_idx]});
                        summary[account].ids = summary[account].ids.filter((elem, idx) => idx !== id_idx);
                        ++summary[to].amount;
                        --summary[account].amount;
                        transfers[id] = to;
                        output += "✓\n";
                        done();
                    } catch (e) {
                        output += "✗\n";
                        done(e);
                    }
                }
            };

            for (let test_idx = 0; test_idx < 100; ++test_idx) {
                test("Random Safe Transfer to Contract #" + (test_idx + 1), random_transfer_to_receiver);
            }

        });

        describe("End Checks", () => {

            test("Check if differences between local informations and remote informations", async (done) => {

                for (let account_idx = 0; account_idx < accounts.length; ++account_idx) {
                    for (let id_idx = 0; id_idx < summary[accounts[account_idx]].ids.length; ++id_idx) {
                        if ((await Ticket721.methods.ownerOf(summary[accounts[account_idx]].ids[id_idx].id).call({from: accounts[account_idx]})).toLowerCase() !== accounts[account_idx].toLowerCase())
                            done(new Error("Invalid local informations"));
                    }
                }
                done();

            }, 60000);

        })

    });

    describe("ERC721Enumerable Tests", () => {

        describe("totalSupply()", () => {

            test("Recover total supply and compare with local", async (done) => {

                const remote_amount = parseInt(await Ticket721.methods.totalSupply().call({from: coinbase}));
                if (remote_amount !== total)
                    done(new Error("Invalid remote total amount"));
                else
                    done();

            });

        });

        describe("tokenByIndex(uint256)", () => {

            test("Check if return is coherent", async (done) => {

                if (parseInt(await Ticket721.methods.tokenByIndex(0).call({from: coinbase})) !== 1)
                    done(new Error("Invalid Returned index"));
                else
                    done();

            });

        });

        describe("tokenOfOwnerByIndex(address, uint256)", () => {

            test("Check every single account", async (done) => {

                for (let account_idx = 0; account_idx < accounts.length; ++account_idx) {
                    const account = accounts[account_idx];
                    for (let id_idx = 0; id_idx < summary[account].ids.length; ++id_idx) {
                        const res = parseInt(await Ticket721.methods.tokenOfOwnerByIndex(account, id_idx).call({from: account}));
                        if (res !== parseInt(summary[account].ids[id_idx].id)) {
                            done(new Error("Invalid value for required index"));
                            return;
                        }
                    }
                }
                done();

            }, 600000);

        });

    });

});

describe("Ticket721 Tests", () => {

    afterAll(() => {

        process.stdout.write("Initial State =>\n");
        process.stdout.write(init);
        let verbose = "+--------------------------------------------+-----+\n";
        for (let account_idx = 0; account_idx < accounts.length; ++account_idx) {
            for (let tok_idx = 0; tok_idx < summary[accounts[account_idx]].ids.length; ++ tok_idx) {
                let tmp = "| " + accounts[account_idx] + " | " + summary[accounts[account_idx]].ids[tok_idx].id;
                tmp += " ".repeat(50 - tmp.length) + " |\n";
                verbose += tmp;
            }
            verbose += "+--------------------------------------------+-----+\n";
        }
        const cont_address = Ticket721TestReceiver.options.address;
        for (let tok_idx = 0; tok_idx < summary[cont_address].ids.length; ++ tok_idx) {
            let tmp = "| " + cont_address + " | " + summary[cont_address].ids[tok_idx].id;
            tmp += " ".repeat(50 - tmp.length) + " |\n";
            verbose += tmp;
        }
        verbose += "+--------------------------------------------+-----+\n";
        process.stdout.write("End State =>\n");
        process.stdout.write(verbose);
        process.stdout.write("Actions List =>\n");
        process.stdout.write(output);

    });

    describe("openSale(uint256)", () => {

        const sale_opener = async (done) => {

            let found = false;
            while (!found) {
                const account_idx = Math.floor(Math.random() * 10);
                const account = Object.keys(summary)[account_idx];

                if (!summary[account].ids.length) {
                    continue;
                }
                let id_idx = Math.floor(Math.random() * (summary[account].ids.length));
                const id = summary[account].ids[id_idx].id;
                if (sale[id]) {
                    continue
                }
                sale[id] = true;
                found = true;
                try {
                    output += ("openSale(" + id + ") from " + account + " \tshouldn't revert ");
                    await Ticket721.methods.openSale(id).send({from: account});
                    output += "✓\n";
                    done();
                } catch (e) {
                    output += "✗\n";
                    done(e);
                }
            }
        };

        for (let test_idx = 0; test_idx < 50; ++test_idx) {
            test("Random Sale Opening #" + (test_idx + 1), sale_opener);
        }

    });

    describe("closeSale(uint256)", () => {

        const sale_closer = async (done) => {

            let found = false;
            while (!found) {
                const id = Object.keys(sale)[Math.floor(Math.random() * Object.keys(sale).length)];
                let owner;
                loop:
                    for (let account_idx = 0; account_idx < Object.keys(summary).length; ++account_idx) {
                        for (let id_idx = 0; id_idx < summary[Object.keys(summary)[account_idx]].ids.length; ++id_idx) {
                            if (summary[Object.keys(summary)[account_idx]].ids[id_idx].id.toString() === id.toString()) {
                                owner = Object.keys(summary)[account_idx];
                                break loop;
                            }
                        }
                    }
                if (!owner || close[id]) {
                    continue ;
                }
                close[id] = true;
                sale[id] = false;
                found = true;
                try {
                    output += ("closeSale(" + id + ") from " + owner + " \tshouldn't revert ");
                    await Ticket721.methods.closeSale(id).send({from: owner});
                    output += "✓\n";
                    done();
                } catch (e) {
                    output += "✗\n";
                    done(e);
                }
            }
        };

        for (let test_idx = 0; test_idx < 24; ++test_idx) {
            test("Random Sale Closing #" + (test_idx + 1), sale_closer);
        }

    });

    describe("buy(uint256)", () => {

        test("Buy all open sales", async (done) => {

            try {
                for (let sale_idx = 0; sale_idx < Object.keys(sale).length; ++sale_idx) {
                    if (sale[Object.keys(sale)[sale_idx]]) {
                        const price = await Ticket721Event.methods.getTicketPrice(Object.keys(sale)[sale_idx]).call({from: accounts[0]});
                        let idx = 0;
                        let account = accounts[idx];
                        while ((await Ticket721.methods.ownerOf(Object.keys(sale)[sale_idx]).call({from: account})).toLowerCase() === account.toLowerCase()) {
                            ++idx;
                            account = accounts[idx];
                        }
                        const amount = parseInt(await Ticket721.methods.balanceOf(account).call());
                        output += ("buy(" + Object.keys(sale)[sale_idx] + ") from " + account + " \tshouldn't revert ");
                        const gas = await Ticket721.methods.buy(Object.keys(sale)[sale_idx]).estimateGas({from: account, value: price});
                        await Ticket721.methods.buy(Object.keys(sale)[sale_idx]).send({from: account, value: price, gas: gas * 2});
                        if (amount === parseInt(await Ticket721.methods.balanceOf(account).call()))
                            done(new Error("Invalid Balance: Should have changed => it didn't"));
                        output += "✓\n";
                    }
                }
                done();
            } catch (e) {
                output += "✗\n";
                done(e);
            }

        }, 120000);

    });

});

