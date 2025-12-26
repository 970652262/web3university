import { formatEther } from "viem";

// 格式化 YDT 数量
export function formatYDT(amount: bigint | undefined): string {
  if (!amount) return "0";
  return formatEther(amount);
}

// 格式化价格显示
export function formatPrice(amount: bigint | undefined): string {
  if (!amount) return "0";
  const formatted = formatEther(amount);
  const num = parseFloat(formatted);
  if (num >= 1000000) {
    return (num / 1000000).toFixed(2) + "M";
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(2) + "K";
  }
  return num.toFixed(2);
}

// 截断地址显示
export function truncateAddress(address: string): string {
  if (!address) return "";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

// 格式化时间戳
export function formatDate(timestamp: bigint | number): string {
  const date = new Date(Number(timestamp) * 1000);
  return date.toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

// 计算平均评分
export function calculateRating(totalRating: bigint, ratingCount: bigint): number {
  if (ratingCount === BigInt(0)) return 0;
  return Number(totalRating) / Number(ratingCount);
}

// 生成星级显示
export function getStarRating(rating: number): string {
  const fullStars = Math.floor(rating);
  const hasHalf = rating - fullStars >= 0.5;
  const emptyStars = 5 - fullStars - (hasHalf ? 1 : 0);

  return "★".repeat(fullStars) + (hasHalf ? "☆" : "") + "☆".repeat(emptyStars);
}
