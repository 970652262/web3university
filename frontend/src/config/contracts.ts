// 合约地址配置
// 部署后需要更新这些地址
export const CONTRACT_ADDRESSES = {
  // Hardhat 本地网络
  31337: {
    ydToken: "0x5FbDB2315678afecb367f032d93F642f64180aa3" as `0x${string}`,
    course: "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512" as `0x${string}`,
    certificate: "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0" as `0x${string}`,
    staking: "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9" as `0x${string}`,
  },
  // Sepolia 测试网
  11155111: {
    ydToken: "0x0703Adb6eB18B3A7f8D4d60D84Dd3BD04FB63373" as `0x${string}`,
    course: "0x89918Cc63046Ea48c2E4e63171290cCF2a180d8f" as `0x${string}`,
    certificate: "0xaa1883B30d75Cb4746702EE4218BeA8FF5e2d2b8" as `0x${string}`,
    staking: "0x00aeC66a7245Cd55a6caB6AdD7474deE79041730" as `0x${string}`,
  },
  // 主网
  1: {
    ydToken: "" as `0x${string}`,
    course: "" as `0x${string}`,
    certificate: "" as `0x${string}`,
    staking: "" as `0x${string}`,
  },
} as const;

// 获取当前链的合约地址
export function getContractAddresses(chainId: number) {
  return CONTRACT_ADDRESSES[chainId as keyof typeof CONTRACT_ADDRESSES] || CONTRACT_ADDRESSES[31337];
}
