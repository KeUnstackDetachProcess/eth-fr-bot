import ethers from "ethers";
import chalk from "chalk";
import dotenv from "dotenv";
import axios from "axios";
import Web3 from "web3";
import Log from "./log.mjs";

dotenv.config();

const config = {
  startCoin: process.env.START_COIN,
  startAmount: process.env.START_AMOUNT,
  slippage: process.env.SLIPPAGE,
  gasPrice: undefined,
  gasLimit: process.env.GAS_LIMIT,
  tradeInterval: process.env.TRADE_INTERVAL,
  walletMin: process.env.WALLET_MIN,
  provider: process.env.MAINNET
};

const web3 = new Web3(config.provider);
var customWsProvider = new ethers.providers.WebSocketProvider(config.provider);
customWsProvider.on("pending", (tx) => {
  customWsProvider.getTransaction(tx).then(async function (transaction) {

    let ethAmount;
    let gweiAmount = parseInt(Number(transaction?.value));
    if (gweiAmount > 0)
      ethAmount = web3.utils.fromWei(gweiAmount.toString(), 'ether');

    if (!ethAmount || ethAmount < 1) return;

    Log.Ok(
      `Found pending tx
"${chalk.yellowBright("hash")}": "${chalk.cyanBright(transaction["hash"])}"
"${chalk.yellowBright("to")}": "${chalk.cyanBright(transaction["to"])}"
"${chalk.yellowBright("from")}": "${chalk.cyanBright(transaction["from"])}"
"${chalk.yellowBright("value")}": "${chalk.cyanBright(ethAmount)}"
      `
    );
  });
});

function main() {
  Log.Info(`Fetching gas fee...`);
  axios
    .get("https://api.nodereal.io/node/gasInfo")
    .then((res) => {
      if (res.status !== 200 || res.data.data.rapid === undefined) {
        Log.Warn(`Error with status code: ${chalk.cyanBright(res.statusText)}\nExiting`);
        return;
      } else {
        Log.Ok(`Gas fee: ${res.data.data.rapid}`);
        config.gasPrice = res.data.data.rapid;
      }
    })
    .catch((error) => {
      Log.Warn(error);
    });
}

main();
