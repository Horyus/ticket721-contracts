const Ganache = require("ganache-core");
const { exec } = require('child_process');

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
    global.Server = Ganache.server({
        gasLimit: 50000000
    });
    if (process.env.BC_URL) {
        if (!process.env.DIST_PATH)
            ko(new Error("Required ENV var: BC_URL, DIST_PATH"));
        // Path to contracts artifacts
        //
        console.log("# Using Ganache server: " + process.env.BC_URL);
        console.log("\n+--------------------------------------+");
        console.log("| Test Setup Successful                |");
        console.log("+--------------------------------------+\n");
        ok();

    } else {
        let intervalId = setInterval(() => {
            isPortTaken(8545, (err, status) => {
                if (status === false) {
                    Server.listen(8545, (err) => {
                        if (err)
                            ko(err);
                        console.log("# Started Ganache server on port 8545");
                        exec("./node_modules/.bin/embark build", async (err, stdout, stderr) => {
                            if (err) {
                                console.error(stderr);
                                console.error(stdout);
                                ko(err);
                            }
                            console.error(stderr);
                            console.error(stdout);
                            console.log("# Deployed Smart Contracts with Embark");
                            console.log("\n+--------------------------------------+");
                            console.log("| Test Setup Successful                |");
                            console.log("+--------------------------------------+\n");
                            ok();
                        });
                    });
                    clearInterval(intervalId);
                } else {
                    console.warn("Port 8545 is taken, waiting ...");
                }
            })
        }, 5000);
    }
});

module.exports = setup;
