var Web3 = require("web3")
var governorAlpha = require("./governorAlpha.js")
var web3 = new Web3()

var governor = new web3.eth.Contract(governorAlpha.abi, governorAlpha.address)
const day = 24 * 60 * 60
const rewardsDuration = 60 * day
const UNIAddress = "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984"
const ETHUNIPoolAddress = "0xd3d2E2692501A5c9Ca623199D38826e513033a17"
const stakingRewardsFactoryAddress = "0xC722A3F999983325c611e7E1D967a3c27063F8b0"
const transferSignature = web3.eth.abi.encodeFunctionSignature("transfer(address,uint256)")
const deploySignature = web3.eth.abi.encodeFunctionSignature("deploy(address,uint256,uint256)")
const notifyRewardAmountSignature = web3.eth.abi.encodeFunctionSignature("notifyRewardAmount(address)")
const liqMiningAllocation = "5000000000000000000000000"
governor.methods.createCrowdProposal(
  [UNIAddress,stakingRewardsFactoryAddress,stakingRewardsFactoryAddress],//targets
  [0,0,0],//values
  [transferSignature,deploySignature,notifyRewardAmountSignature],//signatures
  [[stakingRewardsFactoryAddress, liqMiningAllocation], [ETHUNIPoolAddress, liqMiningAllocation, rewardsDuration], [ETHUNIPoolAddress]],//calldatas
  "ETH-UNI liquidity pool description goes here!"//description
).send()

