const sdk = require("@defillama/sdk");
const { getBlock } = require("../helper/getBlock");
const ADDRESSES = require("./addresses");
const scionVaultAbi = require("./abis/scionVaultAbi");

async function getVaultBalance(timestamp, chainBlocks, chain) {
  const block = await getBlock(timestamp, chain, chainBlocks);
  const balances = {};

  const vaults = ADDRESSES[chain];

  for (const vault of vaults) {
    const { ADDRESS, UNDERLYING } = vault;

    const totalHoldings = await sdk.api.abi.call({
      abi: scionVaultAbi.totalHoldings,
      chain,
      target: ADDRESS,
      block,
    });

    await sdk.util.sumSingleBalance(balances, UNDERLYING, totalHoldings.output);
  }

  return balances;
}

async function moonriver(timestamp, block, chainBlocks) {
  return getVaultBalance(timestamp, chainBlocks, "moonriver");
}

module.exports = {
  timetravel: true,
  misrepresentedTokens: false,
  methodology: "Measures the total value deposited in Scion vault contracts",
  moonriver: {
    tvl: moonriver,
  },
};
