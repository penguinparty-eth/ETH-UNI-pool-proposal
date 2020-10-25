const Web3 = require('web3')
const net = require('net')
const GM = require('godmode-for-test')


const uniAddress = "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984"
const ethUniPoolAddress = "0xd3d2E2692501A5c9Ca623199D38826e513033a17"
const stakingRewardsFactoryAddress = "0xC722A3F999983325c611e7E1D967a3c27063F8b0"
const governorAlphaAddress = "0x5e4be8Bc9637f0EAA1A755019e06A68ce081D58F"
const crowdProposalFactoryAddress = "0xfb13251C994701b27CCFd4CCCcf5847aA29a3702"
const timelockAddress = "0x1a9C8182C09F50C8318d769245beA52c32BE35BC"
const uni = artifacts.require("Uni")
const uniMintable = artifacts.require("UniMintable")
const timelock = artifacts.require("TimelockGodMode")
const crowdProposalFactory = artifacts.require("CrowdProposalFactory")
const crowdProposal = artifacts.require("CrowdProposal")
const governorAlpha = artifacts.require("GovernorAlpha")
const governorAlphaGodMode = artifacts.require("GovernorAlphaGodMode")
const stakingRewardsFactory = artifacts.require("StakingRewardsFactory")
const stakingRewards = artifacts.require("StakingRewards")
const uniswapV2Pair = artifacts.require("UniswapV2Pair")
const uniswapV2PairGodMode = artifacts.require("UniswapV2PairGodMode")


let godmode = new GM("development", "ws://127.0.0.1:9545")
var provider = new Web3(godmode.provider, net)
var web3 = new Web3(provider)

advanceBlock = () => {
  return new Promise((resolve, reject) => {
      web3.currentProvider.send({
          jsonrpc: "2.0",
          method: "evm_mine",
          id: new Date().getTime()
      }, (err, result) => {
          if (err) { return reject(err); }
          const newBlockHash = web3.eth.getBlock('latest').hash;

          return resolve(newBlockHash)
      });
  });
}



contract("Test network setup", accounts => {
  describe("Setup the test environment", async () => {
    before(async () => {
      await godmode.open();
      
    })

    after(async () => {
      await godmode.close();
    })

    it("Should do everything", async (done) => {
      const ethUniPoolContract = await uniswapV2Pair.at(ethUniPoolAddress)
      const stakingRewardsFactoryContract = await stakingRewardsFactory.at(stakingRewardsFactoryAddress)
      const governorAlphaContract = await governorAlpha.at(governorAlphaAddress)
      const uniContract = await uni.at(uniAddress)
      const crowdProposalFactoryContract = new web3.eth.Contract(crowdProposalFactory.abi, crowdProposalFactoryAddress)
      const timelockContract = await timelock.at(timelockAddress)


      const proposer = accounts[0]//the account that will propose the autonomous proposal
      const supporter = accounts[1]// the account that will support the autonomous proposal
      const voter = accounts[2]//the account that will vote yes once the autonomous proposal is submitted
      const proposerBalance = "10000000000000000000000"
      const supporterBalance = "10000000000000000000000000"
      const voterBalance = "40000000000000000000000000"
      const timelockBalance = await uniContract.balanceOf(timelockAddress)
      console.log(`###################TimlockBalance: ${timelockBalance}`)


      await godmode.executeAs(//mint UNI for test accounts
        uniContract,
        uniMintable,
        "mint", proposer, proposerBalance,
        {from: proposer}
      )

      await godmode.executeAs(
        uniContract,
        uniMintable,
        "mint", supporter, supporterBalance,
        {from: supporter}
      )

      await godmode.executeAs(
        uniContract,
        uniMintable,
        "mint", voter, voterBalance,
        {from: voter}
      )

      // await godmode.executeAs(
      //   uniContract,
      //   uniMintable,
      //   "mint", timelock.address, timelockBalance,
      //   {from: proposer}
      // )


      await godmode.executeAs(//give voter liq tokens for testing
        ethUniPoolContract,
        uniswapV2PairGodMode,
        "mint", voter,
        {from: proposer}
      )

      await uniContract.approve(crowdProposalFactoryAddress, "10000000000000000000000", {from: proposer})

      await uniContract.delegate(voter, {from: voter})

      //
      const day = 24 * 60 * 60
      const rewardsDuration = 60 * day

      //unistakeAmount:                                                                 1000000000000000000000
      //allowance of crowdProposalFactory (0xfb13251C994701b27CCFd4CCCcf5847aA29a3702): 10000000000000000000000
      //balance of proposer (0x4A9f985de3245C4DF261369FFe21aB3b0e275136):               10000000000000000000000
      const w3UniContract = new web3.eth.Contract(uniContract.abi, uniAddress)
      const w3StakingRewardsFactoryContract = new web3.eth.Contract(stakingRewardsFactory.abi, stakingRewardsFactoryAddress)
      const liqMiningAllocation = "5000000000000000000000000"

      const transferCallData = w3UniContract.methods.transfer(stakingRewardsFactoryAddress, liqMiningAllocation).encodeABI()
      const deployCallData = w3StakingRewardsFactoryContract.methods.deploy(ethUniPoolAddress, liqMiningAllocation, rewardsDuration).encodeABI()
      const notifyRewardAmountCallData = w3StakingRewardsFactoryContract.methods.notifyRewardAmount(ethUniPoolAddress).encodeABI()




      crowdProposalFactoryContract.methods.createCrowdProposal(
        [uniAddress,stakingRewardsFactoryAddress,stakingRewardsFactoryAddress],//targets
        [0,0,0],//values
        ["","",""],//signatures
        //[[stakingRewardsFactoryAddress, liqMiningAllocation], [ethUniPoolAddress, liqMiningAllocation, rewardsDuration],[ethUniPoolAddress]],
        [transferCallData, deployCallData, notifyRewardAmountCallData],//calldatas
        "ETH-UNI liquidity pool description goes here!"//description
      ).send({from: proposer, gas: 5000000})

      
      // crowdProposalFactoryContract.methods.createCrowdProposal(
      //   [uniAddress],//targets
      //   [0],//values
      //   [""],//signatures
      //   [w3UniContract.methods.transfer(stakingRewardsFactoryAddress, liqMiningAllocation).encodeABI()],//calldatas
      //   "ETH-UNI liquidity pool description goes here!"//description
      // ).send({from: proposer, gas: 5000000})
      

      
      crowdProposalFactoryContract.once("CrowdProposalCreated", async (error, event) => {

        function timeout(ms) {
          return new Promise(resolve => setTimeout(resolve,ms))
        }

        const crowdProposalAddress = event.returnValues.proposal
        await uniContract.delegate(crowdProposalAddress, {from: supporter})

        var blockNum = await web3.eth.getBlockNumber()
        console.log("block height: " + blockNum)

        priorVotes = await uniContract.getPriorVotes(crowdProposalAddress, blockNum - 1)
        console.log("prior votes: " + priorVotes)

        web3.currentProvider.send({//wait one block
          jsonrpc: "2.0",
          method: "evm_mine",
          id: 123
        })
        blockNum = await web3.eth.getBlockNumber()
        console.log("block height: " + blockNum)

        var priorVotes = await uniContract.getPriorVotes(crowdProposalAddress, blockNum - 1)
        console.log("prior votes: " + priorVotes)
        var thresholdVotes = await governorAlphaContract.proposalThreshold()
        console.log("neeed votes: " + thresholdVotes)


        await timeout(1000)
        console.log("proposalAddress: " + crowdProposalAddress)
        const crowdProposalContract = new web3.eth.Contract(crowdProposal.abi, crowdProposalAddress)
        var proposalId = await crowdProposalContract.methods.govProposalId().call()
        var terminated = await crowdProposalContract.methods.terminated().call()
        console.log("teminated: " + terminated)
        console.log("proposalId : " + proposalId)
        await crowdProposalContract.methods.propose().send({from: proposer, gas: 5000000})
        proposalId = await crowdProposalContract.methods.govProposalId().call()
        console.log("proposalId : " + proposalId)

        proposalEndBlock = await governorAlphaContract.proposals(2)
        console.log("proposal ends at: " + proposalEndBlock.endBlock.toString())

        await advanceBlock()
        await advanceBlock()

        var proposalState = await governorAlphaContract.state(proposalId)
        console.log(`$$$ProposalState: ${proposalState}`)

        await crowdProposalContract.methods.vote().call({from: proposer})

        await governorAlphaContract.castVote(proposalId, true, {from: voter})//proposal should now have 40m votes and can be queued

        console.log("mining 40480 blocks")
        for(var i = 0; i < 40480; i++){//yikes
          await advanceBlock()
          if(i % 1000 === 0){
            console.log(`${i} blocks mined`)
          }
        }

        proposalData = await governorAlphaContract.proposals(proposalId)
        const quorumVotes = await governorAlphaContract.quorumVotes()
        console.log("proposal ends at: " + proposalData.endBlock.toString())
        console.log("forVotes: " + proposalData.forVotes.toString())
        console.log("againstVotes: " + proposalData.againstVotes.toString())
        console.log("quorumVotes: " + quorumVotes)
        blockNum = await web3.eth.getBlockNumber()
        console.log("block height: " + blockNum)

        proposalState = await governorAlphaContract.state(proposalId)
        console.log(`$$$ProposalState: ${proposalState}`)

        await governorAlphaContract.queue(proposalId, {from: proposer})

        var block = await web3.eth.getBlock("latest");
        var queueTime = parseInt(block.timestamp)

        var timelockDelay = await timelockContract.delay()
        timelockDelay = parseInt(timelockDelay)
        var eta = queueTime + timelockDelay
        console.log(`queueTime: ${queueTime}`)
        console.log(`eta: ${eta}`)
        console.log(`timelockDelay: ${timelockDelay}`)

        // queueTime: 1603495104
        // eta:       16034951040
        // timelockDelay: 0
        // Time-traveling...
        // time:      16034951090010

        //time travel
        console.log("Time-traveling...")
        web3.currentProvider.send({
          jsonrpc: "2.0",
          method: "evm_increaseTime",
          params: [timelockDelay + 10],
          id: 9999999999
        })

        web3.currentProvider.send({
          jsonrpc: "2.0",
          method: "evm_mine",
          id: 9999999998
        })

        block = await web3.eth.getBlock("latest");
        time = block.timestamp

        console.log(`time: ${time}`)


        await governorAlphaContract.execute(proposalId, {from: proposer})

        console.log("Execution successful")

        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~proposal is now executed, test the liquidity pool~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~`

        const stakingRewardsInfo = await stakingRewardsFactoryContract.stakingRewardsInfoByStakingToken.call(ethUniPoolAddress)
        const stakingRewardsAddress = stakingRewardsInfo.stakingRewards

        await ethUniPoolContract.approve(stakingRewardsAddress, "99990000000000000000000000000", {from: voter})

        const stakingRewardsContract = await stakingRewards.at(stakingRewardsAddress)
        await stakingRewardsContract.stake("10000000000", {from: voter})//stake eth-uni tokens



        //speed up time
        web3.currentProvider.send({
          jsonrpc: "2.0",
          method: "evm_increaseTime",
          params: [rewardsDuration],
          id: 9999999997
        })

        web3.currentProvider.send({
          jsonrpc: "2.0",
          method: "evm_mine",
          id: 9999999996
        })



        const earnedRewards = await stakingRewardsContract.earned.call(voter)

        await stakingRewardsContract.exit({from: voter})
        await crowdProposalContract.methods.terminate().send({from: proposer})

        const getBalances = async address => {
          var balances = {}
          balances.ethUniPool = await ethUniPoolContract.balanceOf.call(address)
          balances.uni = await uniContract.balanceOf.call(address)
          balances.claimableUni = await stakingRewardsContract.earned.call(address)//uni earned in staking pool
          return balances
        }
        
        const voterBalances = await getBalances(voter)
        const proposerBalances = await getBalances(proposer)
        const rewardsContractBalances = await getBalances(stakingRewardsAddress)

        console.log(`rewardsContractBalances:`)
        console.log(rewardsContractBalances.ethUniPool.toString())
        console.log(rewardsContractBalances.uni.toString())
        console.log(rewardsContractBalances.claimableUni.toString())
        console.log(`voterBalances:`)
        console.log(voterBalances.ethUniPool.toString())
        console.log(voterBalances.uni.toString())
        console.log(voterBalances.claimableUni.toString())
        console.log(`proposerBalances:`)
        console.log(proposerBalances.ethUniPool.toString())
        console.log(proposerBalances.uni.toString())
        console.log(proposerBalances.claimableUni.toString())

        await 
        done()
      })
    })
  })
})

