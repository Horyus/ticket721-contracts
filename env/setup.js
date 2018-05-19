const Ganache = require("ganache-core");
const { exec } = require('child_process');
const contract = require("truffle-contract");
const Web3 = require("web3");


const isPortTaken = function(port, fn) {
    const net = require('net');
    const tester = net.createServer()
        .once('error', function (err) {
            if (err.code !== 'EADDRINUSE') return fn(err);
            fn(null, true)
        })
        .once('listening', function() {
            tester.once('close', function() { fn(null, false) })
                .close()
        })
        .listen(port)
};


const setup = async () => new Promise((ok, ko) => {
    console.log("\n+--------------------------------------+");
    console.log("| Starting Test Setup                  |");
    console.log("+--------------------------------------+\n");
    global.Server = Ganache.server();
    let intervalId = setInterval(() => {
        isPortTaken(8547, (err, status) => {
            if (status === false) {
                Server.listen(8547, (err) => {
                    if (err)
                        ko(err);
                    console.log("# Started Ganache server on port 8547");
                    exec("./node_modules/.bin/truffle migrate --reset", async (err, stdout, stderr) => {
                        if (err)
                            ko(err);
                        console.log("# Deployed Smart Contracts with Truffle");
                        if (stdout)
                            console.error(stdout);
                        if (stderr)
                            console.error(stderr);
                        const provider = new Web3.providers.HttpProvider("http://localhost:8547");
                        provider.sendAsync = function() {
                            return provider.send.apply(
                                provider, arguments
                            );
                        };
                        const Ticket721 = contract(require("../build/contracts/Ticket721.json"));
                        Ticket721.setProvider(provider);
                        global.Ticket721 = await Ticket721.deployed();
                        const Ticket721Train = contract(require("../build/contracts/Ticket721Train.json"));
                        Ticket721Train.setProvider(provider);
                        global.Ticket721Train = await Ticket721Train.deployed();
                        console.log("\n+--------------------------------------+");
                        console.log("| Test Setup Successful                |");
                        console.log("+--------------------------------------+\n");
                        ok();
                    });
                });
                clearInterval(intervalId);
            } else {
                console.warn("Port 8547 is taken, waiting ...");
            }
        })
    }, 5000);

});

module.exports = setup;
