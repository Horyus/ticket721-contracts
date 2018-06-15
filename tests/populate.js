module.exports = async (Ticket721, Ticket721Event, Web3, accounts) => {

    const ret = {};
    const price = await Ticket721Event.methods.ticket_price().call();
    let total = 0;

    let verbose = "+--------------------------------------------+-----+\n";

    for (let account_idx = 0; account_idx < accounts.length; ++account_idx) {
        ret[accounts[account_idx]] = {
            amount: Math.floor((Math.random() * 80) + 20),
            ids: []
        };
        for (let ticket_idx = 0; ticket_idx < ret[accounts[account_idx]].amount; ++ticket_idx) {
            try {
                const call_gas = await Ticket721Event.methods.buy().estimateGas({from: accounts[account_idx], value: price});
                await Ticket721Event.methods.buy().send({
                    from: accounts[account_idx],
                    value: price,
                    gas: call_gas
                });
            } catch (e) {
                throw (e);
            }
            ++total;
            const insert = {id: parseInt((await Ticket721.methods.tokenOfOwnerByIndex(accounts[account_idx], ticket_idx).call({from: accounts[account_idx]})))};
            let tmp = "| " + accounts[account_idx] + " | " + insert.id;
            tmp += " ".repeat(50 - tmp.length) + " |\n";
            verbose += tmp;
            ret[accounts[account_idx]].ids.push(insert);

        }
        verbose += "+--------------------------------------------+-----+\n";
    }

    return {summary: ret, init: verbose, total: total};
};
