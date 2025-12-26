import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { http } from "wagmi";
import { mainnet, sepolia, hardhat } from "wagmi/chains";

export const config = getDefaultConfig({
  appName: "Web3 University",
  projectId: process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID || "YOUR_PROJECT_ID",
  chains: [
    // 开发环境使用 hardhat 本地网络
    hardhat,
    // 测试网
    sepolia,
    // 主网（生产环境）
    mainnet,
  ],
  transports: {
    [hardhat.id]: http("http://127.0.0.1:8545"),
    [sepolia.id]: http(process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL),
    [mainnet.id]: http(process.env.NEXT_PUBLIC_MAINNET_RPC_URL),
  },
  ssr: true,
});
