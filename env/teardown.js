const Fs = require("fs-extra");

const teardown = async () => {
    console.log("\n+--------------------------------------+");
    console.log("| Starting Test Teardown               |");
    console.log("+--------------------------------------+\n");
    global.Server.close();
    console.log("# Closing Ganache server");
    if (!process.env.DIST_PATH) {
        Fs.removeSync("./dist");
        Fs.removeSync("./.embark");
        Fs.removeSync("./chains.json");
    }
    console.log("# Removing Contract Artifacts");
    console.log("\n+--------------------------------------+");
    console.log("| Test Teardown Successful             |");
    console.log("+--------------------------------------+\n");
};

module.exports = teardown;
