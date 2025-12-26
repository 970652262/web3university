import { createPublicClient, createWalletClient, http, parseEther, formatEther } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { sepolia } from "viem/chains";
import "dotenv/config";

const YDTokenABI = [
  { type: "function", name: "balanceOf", inputs: [{ name: "account", type: "address" }], outputs: [{ type: "uint256" }], stateMutability: "view" },
  { type: "function", name: "transfer", inputs: [{ name: "to", type: "address" }, { name: "value", type: "uint256" }], outputs: [{ type: "bool" }], stateMutability: "nonpayable" },
] as const;

async function main() {
  const privateKey = process.env.PRIVATE_KEY as `0x${string}`;
  const rpcUrl = process.env.SEPOLIA_RPC_URL;

  if (!privateKey || !rpcUrl) {
    throw new Error("Missing PRIVATE_KEY or SEPOLIA_RPC_URL in .env");
  }

  const account = privateKeyToAccount(privateKey);
  console.log("Using account:", account.address);

  const publicClient = createPublicClient({
    chain: sepolia,
    transport: http(rpcUrl),
  });

  const walletClient = createWalletClient({
    account,
    chain: sepolia,
    transport: http(rpcUrl),
  });

  // YDToken 合约地址 (Sepolia)
  const YDT_ADDRESS = "0x0703Adb6eB18B3A7f8D4d60D84Dd3BD04FB63373" as const;

  // 查看部署者余额
  const deployerBalance = await publicClient.readContract({
    address: YDT_ADDRESS,
    abi: YDTokenABI,
    functionName: "balanceOf",
    args: [account.address],
  });
  console.log("Deployer YDT balance:", formatEther(deployerBalance));

  // 查看合约余额
  const contractBalance = await publicClient.readContract({
    address: YDT_ADDRESS,
    abi: YDTokenABI,
    functionName: "balanceOf",
    args: [YDT_ADDRESS],
  });
  console.log("Contract YDT balance:", formatEther(contractBalance));

  // 转入 500,000 YDT 到合约 (可以调整数量)
  const amountToFund = parseEther("500000"); // 500,000 YDT

  if (deployerBalance < amountToFund) {
    console.log("Deployer doesn't have enough YDT!");
    console.log(`Need: ${formatEther(amountToFund)}, Have: ${formatEther(deployerBalance)}`);
    return;
  }

  console.log(`\nTransferring ${formatEther(amountToFund)} YDT to contract...`);

  const hash = await walletClient.writeContract({
    address: YDT_ADDRESS,
    abi: YDTokenABI,
    functionName: "transfer",
    args: [YDT_ADDRESS, amountToFund],
  });
  console.log("TX hash:", hash);

  // 等待交易确认
  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  console.log("Transfer successful! Block:", receipt.blockNumber);

  // 验证新余额
  const newContractBalance = await publicClient.readContract({
    address: YDT_ADDRESS,
    abi: YDTokenABI,
    functionName: "balanceOf",
    args: [YDT_ADDRESS],
  });
  console.log("New contract YDT balance:", formatEther(newContractBalance));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
