import ethers from "ethers";
import chalk from "chalk";
import dotenv from "dotenv";
import axios from "axios";
import Web3 from "web3";
import Log from "./log.mjs";
import { addABI, decodeMethod } from "abi-decoder";
//const abiDecoder = require('abi-decoder');

// import json uniswap ABI
import abi from "./uniswapAbi.json" assert { type: "json" };
// add uniswap v3 ABI to abiDecoder library
addABI(abi);

// load .env file
dotenv.config();

const config = {
  gasPrice: undefined,
  provider: process.env.MAINNET,
  router: process.env.ROUTER,
};

const web3 = new Web3(config.provider);
var quicknodeProvider = new ethers.providers.WebSocketProvider(config.provider);

async function processTransaction(transactionHash) {
  let transaction = await web3.eth.getTransaction(transactionHash);

  const data = decodeMethod(transaction.data);
  const paths = data.params.filter((param) => param.name === "path")[0].value;
  console.log(JSON.stringify(paths));
  const fromToken = paths[0];
  const toToken = paths.slice(-1)[0];
  const amountIn = data.params.filter((param) => param.name === "amountIn")[0]
    .value;
  const amountOutMin = data.params.filter(
    (param) => param.name === "amountOutMin"
  )[0].value;
  const fromTokenSymbol = await getTokenSymbol(fromToken);
  const toTokenSymbol = await getTokenSymbol(toToken);
  console.log(
    `Exchanged ${amountIn} of ${fromTokenSymbol} to at least ${amountOutMin} ${toTokenSymbol}`
  );
}

// subscribe to quicknode wss for pending transactions
quicknodeProvider.on("pending", (tx) => {
  quicknodeProvider.getTransaction(tx).then(async function (transaction) {

    // if dest. is not uniswap v2 router then return
    if (transaction?.to !== config.router) return;

    // convert tx amount from wei to ether
    let ethAmount = undefined;
    let gweiAmount = parseInt(Number(transaction?.value));
    if (gweiAmount !== "undefined" && gweiAmount !== null && gweiAmount > 0) {
      ethAmount = web3.utils.fromWei(gweiAmount.toString(), 'ether');
    }

    // decode transaction data using 'api-decoder' function
    let decodedTxData = decodeMethod(transaction["data"]);

    Log.Info(`decodedTxData.params[0].name: "${chalk.cyanBright(decodedTxData.params[0].name)}"`)

    // return if amount is invalid
    if (!ethAmount) return;

    Log.Ok(
      `Found pending tx
"${chalk.yellowBright("hash")}": "${chalk.cyanBright(transaction["hash"])}"
"${chalk.yellowBright("to")}": "${chalk.cyanBright(transaction["to"])}"
"${chalk.yellowBright("from")}": "${chalk.cyanBright(transaction["from"])}"
"${chalk.yellowBright("data")}": "${chalk.cyanBright(JSON.stringify(decodedTxData))}"
"${chalk.yellowBright("value")}": "${chalk.cyanBright(ethAmount)}"
      `);

      //processTransaction(transaction["hash"]);
    
  Log.Info(`Buying...`);


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
