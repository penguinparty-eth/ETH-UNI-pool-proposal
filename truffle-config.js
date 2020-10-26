module.exports = {
  networks: {
    development: {
      host: "localhost",
      port: 9545,
      network_id: "*", // Match any network id
      gas: 5000000
    }
  },
  compilers: {
    solc: {
      version: "0.5.16",//"0.6.10"
      settings: {
        optimizer: {
          enabled: true, // Default: false
          runs: 200      // Default: 200
        },
      }
    }
  },
  // Set default mocha options here, use special reporters etc.
  mocha: {
    timeout: 100000000000000000
  },
};
