const Migrations = artifacts.require("Migrations");
const TimelockGodMode = artifacts.require("TimelockGodMode");

const governorAlphaAddress = "0x5e4be8Bc9637f0EAA1A755019e06A68ce081D58F";


module.exports = function(deployer) {
  deployer.deploy(Migrations);
  //deployer.deploy(TimelockGodMode, governorAlphaAddress, 0)//deploy timelock with no delay
};
