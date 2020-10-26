# truffle-init-default

Default project for Truffle: example contracts, migrations and tests

## Usage

This simulation requires a connection to godemode-ganache-cli listening on localhost://9545 (https://github.com/xGodMode/godmode-ganache-cli)
install and run with

(Run godmode test network)
```
git clone https://github.com/xGodMode/godmode-ganache-cli
cd godmode-ganache-cli
npm install
./cli.js -p 9545 -i 1 --fork {ETHEREUM NODE TO FORK STATE FROM} 
```

(Run proposal test)
```
npm install
truffle compile
mv contracts/solidityV5 tempContracts
mv tempContracts/solidityV6 contracts/solidityV6
```
CHANGE SOLIDITY COMPILER VERSION TO 0.6.10 IN truffle-config.js (the comment in the file)
```
truffle compile
```
See the [Truffle documentation](http://truffleframework.com/docs/) for more info.
