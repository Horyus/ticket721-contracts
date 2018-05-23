const Web3 = require("web3");
const TruffleContracts = require("truffle-contract");
const RandomString = require("randomstring");

let output = "";

let Ticket721;
let Ticket721Train;
let Ticket721TestReceiver;
let coinbase;
let accounts;
let init;
let summary;
let total;

let approvals = {};
let transfers = {};

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
                const _Ticket721TestReceiver = TruffleContracts(require("../../build/contracts/Ticket721TestReceiver"));
                _Ticket721TestReceiver.setProvider(provider);
                _Ticket721TestReceiver.deployed().then(d_Ticket721TestReceiver => {
                    Ticket721TestReceiver = d_Ticket721TestReceiver;
                    const _Web3 = new Web3(provider);
                    _Web3.eth.getAccounts().then(_accounts => {
                        coinbase = _accounts[0];
                        accounts = _accounts;
                        const populate = require("./populate");
                        populate(Ticket721, Ticket721Train, _Web3, accounts).then(res => {
                            summary = res.summary;
                            summary[Ticket721TestReceiver.address] = {
                                amount: 0,
                                ids: []
                            };
                            init = res.init;
                            total = res.total;
                            done();
                        });
                    });
                })
            });
        });

    }, 300000);

    afterAll(() => {

        process.stdout.write("Initial State =>\n");
        process.stdout.write(init);
        let verbose = "+--------------------------------------------+--------------------------------+\n";
        for (let account_idx = 0; account_idx < accounts.length; ++account_idx) {
            for (let tok_idx = 0; tok_idx < summary[accounts[account_idx]].ids.length; ++ tok_idx) {
                let tmp = "| " + accounts[account_idx] + " | " + summary[accounts[account_idx]].ids[tok_idx].id + " " + summary[accounts[account_idx]].ids[tok_idx].first_name + " " + summary[accounts[account_idx]].ids[tok_idx].last_name;
                tmp += " ".repeat(78 - tmp.length) + "|\n";
                verbose += tmp;
            }
            verbose += "+--------------------------------------------+--------------------------------+\n";
        }
        const cont_address = Ticket721TestReceiver.address;
        for (let tok_idx = 0; tok_idx < summary[cont_address].ids.length; ++ tok_idx) {
            let tmp = "| " + cont_address + " | " + summary[cont_address].ids[tok_idx].id + " " + summary[cont_address].ids[tok_idx].first_name + " " + summary[cont_address].ids[tok_idx].last_name;
            tmp += " ".repeat(78 - tmp.length) + "|\n";
            verbose += tmp;
        }
        verbose += "+--------------------------------------------+--------------------------------+\n";
        process.stdout.write("End State =>\n");
        process.stdout.write(verbose);
        process.stdout.write("Actions List =>\n");
        process.stdout.write(output);

    });

    describe("ERC721Metadata Tests", () => {

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

    describe("ERC721Basic Tests", () => {

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

            const random_test = async (done) => {

                const account_idx = Math.floor(Math.random() * 10);
                const account = Object.keys(summary)[account_idx];
                const id = summary[account].ids[Math.floor(Math.random() * summary[account].ids.length)].id;
                output += ("ownerOf(" + id + ") \t=== " + account + " ");
                if ((await Ticket721.ownerOf(id, {from: account})).toLowerCase() !== account.toLowerCase()) {
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
                    await Ticket721.ownerOf(rand_id, {from: coinbase});
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
                    await Ticket721.ownerOf(id, {from: coinbase});
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
                if (!(await Ticket721.exists(id, {from: account}))) {
                    output += "✗\n";
                    done(new Error("Invalid OnChain exist value for " + id));
                } else {
                    output += "✓\n";
                    done();
                }

            };

            for (let test_idx = 0; test_idx < 25; ++test_idx) {
                test("Random Exist Check #" + (test_idx + 1), random_test);
            }

            test("Check with Invalid ID", async (done) => {

                const rand_id = Math.floor(Math.random() * 1000000) + 333;
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

            const random_test = async (done) => {

                let combination_found = false;
                while (!combination_found) {
                    const account_idx = Math.floor(Math.random() * 10);
                    let to_idx = Math.floor(Math.random() * 10);
                    while (to_idx === account_idx)
                        to_idx = Math.floor(Math.random() * 10);
                    const account = Object.keys(summary)[account_idx];
                    const to = Object.keys(summary)[to_idx];
                    const id = summary[account].ids[Math.floor(Math.random() * summary[account].ids.length)].id;
                    if (approvals[id]) {
                        continue;
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

            for (let test_idx = 0; test_idx < 25; ++test_idx) {
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

                const account_idx = Math.floor(Math.random() * 10);
                const account = Object.keys(summary)[account_idx];

                let to_idx = Math.floor(Math.random() * 10);
                while (to_idx === account_idx)
                    to_idx = Math.floor(Math.random() * 10);
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

            test("Test automatic revert", async (done) => {

                try {
                    await Ticket721.setApprovalForAll(accounts[0], true, {from: coinbase});
                    done(new Error("Should revert: it didn't"));
                } catch (e) {
                    done();
                }

            });

        });

        describe("isApprovedForAll(address, address)", () => {

            test("Test automatic revert", async (done) => {

                try {
                    await Ticket721.isApprovedForAll(accounts[0], accounts[1], {from: coinbase});
                    done(new Error("Should revert: it didn't"));
                } catch (e) {
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
                        output += ("transferFrom(" + account + ", " + to + ", " + id + ") \tshouldn't revert ");
                        const call_gas = await Ticket721.transferFrom.estimateGas(account, to, id, {
                            from: account
                        });
                        await Ticket721.transferFrom(account, to, id, {from: account, gas: call_gas * 2});
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

            test("Transfer all previously approved tokens", async (done) => {

                for (let approval_idx = 0; approval_idx < Object.keys(approvals).length; ++approval_idx) {
                    const id = Object.keys(approvals)[approval_idx];
                    const {from, to} = approvals[id];
                    let id_idx = -1;
                    for (let search_idx = 0; search_idx < summary[from].ids.length; ++search_idx) {
                        if (summary[from].ids[search_idx].id.toNumber() === parseInt(id)) {
                            id_idx = search_idx;
                            break;
                        }
                    }
                    try {
                        output += ("transferFrom(" + from + ", " + to + ", " + id + ") \tshouldn't revert ");
                        const call_gas = await Ticket721.transferFrom.estimateGas(from, to, id, {
                            from: to
                        });
                        await Ticket721.transferFrom(from, to, id, {from: to, gas: call_gas * 2});
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

            for (let test_idx = 0; test_idx < 25; ++test_idx) {
                test("Random Transfer #" + (test_idx + 1), random_transfer);
            }

        });

        describe("safeTransferFrom(address, address, uint256)", () => {

            const random_transfer_to_receiver = async (done) => {

                let found = false;
                while (!found) {
                    const account_idx = Math.floor(Math.random() * 10);
                    const account = Object.keys(summary)[account_idx];

                    const to = Ticket721TestReceiver.address;

                    if (!summary[account].ids.length) {
                        continue;
                    }
                    found = true;
                    let id_idx = Math.floor(Math.random() * (summary[account].ids.length));
                    const id = summary[account].ids[id_idx].id;
                    try {
                        output += ("safeTransferFrom(" + account + ", " + to + ", " + id + ") \tshouldn't revert ");
                        const call_gas = await Ticket721.safeTransferFrom.estimateGas(account, to, id, {
                            from: account
                        });
                        await Ticket721.safeTransferFrom(account, to, id, {from: account, gas: call_gas * 2});
                        if ((await Ticket721TestReceiver.last_id({from: account})).toNumber() !== parseInt(id))
                            done(new Error("Invalid receiver informations for last id"));
                        if ((await Ticket721TestReceiver.last_sender({from: account})).toLowerCase() !== account.toLowerCase())
                            done(new Error("Invalid receiver informations for last sender"));
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
                        output += ("safeTransferFrom(" + account + ", " + to + ", " + id + ") \tshouldn't revert ");
                        const call_gas = await Ticket721.safeTransferFrom.estimateGas(account, to, id, {
                            from: account
                        });
                        await Ticket721.safeTransferFrom(account, to, id, {from: account, gas: call_gas * 2});
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

            for (let test_idx = 0; test_idx < 25; ++test_idx) {
                test("Random Safe Transfer to User #" + (test_idx + 1), random_transfer_to_users);
            }

            for (let test_idx = 0; test_idx < 25; ++test_idx) {
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
                        output += ("safeTransferFrom(" + to + ", " + account + ", " + id + ") \tshould revert ");
                        const call_gas = await Ticket721.safeTransferFrom.estimateGas(to, account, id, {
                            from: account
                        });
                        await Ticket721.safeTransferFrom(to, account, id, {from: account, gas: call_gas * 2});
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
                    if (summary[from].ids[search_idx].id.toNumber() === parseInt(id)) {
                        id_idx = search_idx;
                        break;
                    }
                }
                try {
                    output += ("safeTransferFrom(" + from + ", " + to + ", " + id + ") \tshouldn't revert ");
                    const call_gas = await Ticket721.safeTransferFrom.estimateGas(from, to, id, {
                        from: to
                    });
                    await Ticket721.safeTransferFrom(from, to, id, {from: to, gas: call_gas * 2});
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

                    const to = Ticket721TestReceiver.address;
                    const data = "0x" + RandomString.generate({length: 8, charset: 'hex'});

                    if (!summary[account].ids.length) {
                        continue;
                    }
                    found = true;
                    let id_idx = Math.floor(Math.random() * (summary[account].ids.length));
                    const id = summary[account].ids[id_idx].id;
                    try {
                        output += ("safeTransferFrom(" + account + ", " + to + ", " + id + ", " + data + ") \tshouldn't revert ");
                        const call_gas = await Ticket721.safeTransferFrom.estimateGas(account, to, id, {
                            from: account
                        });
                        Ticket721.contract.safeTransferFrom['address,address,uint256,bytes'](account, to, id, data, {
                            from: account,
                            gas: call_gas * 2
                        }, async () => {
                            if ((await Ticket721TestReceiver.last_id({from: account})).toNumber() !== parseInt(id))
                                done(new Error("Invalid receiver informations for last id"));
                            if ((await Ticket721TestReceiver.last_sender({from: account})).toLowerCase() !== account.toLowerCase())
                                done(new Error("Invalid receiver informations for last sender"));
                            if ((await Ticket721TestReceiver.last()) !== data)
                                done(new Error("Invalid receiver informations for last data"));
                            summary[to].ids.push({...summary[account].ids[id_idx]});
                            summary[account].ids = summary[account].ids.filter((elem, idx) => idx !== id_idx);
                            ++summary[to].amount;
                            --summary[account].amount;
                            transfers[id] = to;
                            output += "✓\n";
                            done();
                        });
                    } catch (e) {
                        output += "✗\n";
                        done(e);
                    }
                }
            };

            for (let test_idx = 0; test_idx < 25; ++test_idx) {
                test("Random Safe Transfer to Contract #" + (test_idx + 1), random_transfer_to_receiver);
            }

        });

        describe("End Checks", () => {

            test("Check if differences between local informations and remote informations", async (done) => {

                for (let account_idx = 0; account_idx < accounts.length; ++account_idx) {
                    for (let id_idx = 0; id_idx < summary[accounts[account_idx]].ids.length; ++id_idx) {
                        if ((await Ticket721.ownerOf(summary[accounts[account_idx]].ids[id_idx].id, {from: accounts[account_idx]})).toLowerCase() !== accounts[account_idx].toLowerCase())
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

                const remote_amount = (await Ticket721.totalSupply({from: coinbase})).toNumber();
                if (remote_amount !== total)
                    done(new Error("Invalid remote total amount"));
                else
                    done();

            });

        });

        describe("tokenByIndex(uint256)", () => {

            test("Check if return is coherent", async (done) => {

                if ((await Ticket721.tokenByIndex(0, {from: coinbase})).toNumber() !== 1)
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
                        const res = (await Ticket721.tokenOfOwnerByIndex(account, id_idx, {from: account})).toNumber();
                        if (res !== parseInt(summary[account].ids[id_idx].id)) {
                            console.log(res, parseInt(summary[account].ids[id_idx].id));
                            done(new Error("Invalid value for required index"));
                            return;
                        }
                    }
                }
                done();

            }, 60000);

        });

    });

});
