const ipfsAPI = require('ipfs-api');

const ipfs = ipfsAPI('ipfs.infura.io', '5001', {protocol: 'https'});

const fs = require('fs');

const content = fs.readFileSync(process.argv[2]);

ipfs.files.add(content).then(res => {
    console.log(res[0].hash);
});
