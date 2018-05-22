const HumanNames = require("people-names");

module.exports = async (Ticket721, Ticket721Train, Web3, accounts) => {

    const ret = {};
    const price = await Ticket721.getDefaultTicketPrice();
    let total = 0;

    let verbose = "+--------------------------------------------+--------------------------------+\n";

    for (let account_idx = 0; account_idx < accounts.length; ++account_idx) {
        ret[accounts[account_idx]] = {
            amount: Math.floor((Math.random() * 40) + 5),
            ids: []
        };
        for (let ticket_idx = 0; ticket_idx < ret[accounts[account_idx]].amount; ++ticket_idx) {
            const first_name = HumanNames.maleRandomFr();
            const last_name = HumanNames.femaleRandomFr();
            try {

                const call_gas = await Ticket721Train.buy.estimateGas(first_name, last_name, {from: accounts[account_idx], value: price});
                await Ticket721Train.buy(first_name, last_name, {
                    from: accounts[account_idx],
                    value: price,
                    gas: call_gas
                });
            } catch (e) {
                throw (e);
            }
            ++total;
            const insert = {id: (await Ticket721.tokenOfOwnerByIndex(accounts[account_idx], ticket_idx, {from: accounts[account_idx]})), first_name: first_name, last_name: last_name};
            let tmp = "| " + accounts[account_idx] + " | " + insert.id + " " + insert.first_name + " " + insert.last_name;
            tmp += " ".repeat(78 - tmp.length) + "|\n";
            verbose += tmp;
            ret[accounts[account_idx]].ids.push(insert);

        }
        verbose += "+--------------------------------------------+--------------------------------+\n";
    }

    return {summary: ret, init: verbose, total: total};
};
