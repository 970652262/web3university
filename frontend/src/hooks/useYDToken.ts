"use client";

import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { useContracts } from "./useContracts";
import { parseEther, formatEther } from "viem";

// 获取 YDT 余额
export function useYDTBalance(address: `0x${string}` | undefined) {
  const { ydToken } = useContracts();

  const { data, isLoading, refetch } = useReadContract({
    address: ydToken.address,
    abi: ydToken.abi,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    },
  });

  return {
    balance: data as bigint | undefined,
    formatted: data ? formatEther(data as bigint) : "0",
    isLoading,
    refetch,
  };
}

// 获取 YDT 授权额度
export function useYDTAllowance(owner: `0x${string}` | undefined, spender: `0x${string}` | undefined) {
  const { ydToken } = useContracts();

  const { data, isLoading, refetch } = useReadContract({
    address: ydToken.address,
    abi: ydToken.abi,
    functionName: "allowance",
    args: owner && spender ? [owner, spender] : undefined,
    query: {
      enabled: !!owner && !!spender,
    },
  });

  return {
    allowance: data as bigint | undefined,
    isLoading,
    refetch,
  };
}

// 购买 YDT
export function useBuyYDT() {
  const { ydToken } = useContracts();
  const { writeContract, data: hash, isPending, error } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const buyYDT = (ethAmount: string) => {
    writeContract({
      address: ydToken.address,
      abi: ydToken.abi,
      functionName: "buyYDToken",
      value: parseEther(ethAmount),
    });
  };

  return {
    buyYDT,
    isPending,
    isConfirming,
    isSuccess,
    error,
    hash,
  };
}

// 出售 YDT
export function useSellYDT() {
  const { ydToken } = useContracts();
  const { writeContract, data: hash, isPending, error } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const sellYDT = (tokenAmount: bigint) => {
    writeContract({
      address: ydToken.address,
      abi: ydToken.abi,
      functionName: "sellYDToken",
      args: [tokenAmount],
    });
  };

  return {
    sellYDT,
    isPending,
    isConfirming,
    isSuccess,
    error,
    hash,
  };
}

// 授权 YDT
export function useApproveYDT() {
  const { ydToken } = useContracts();
  const { writeContract, data: hash, isPending, error } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const approve = (spender: `0x${string}`, amount: bigint) => {
    writeContract({
      address: ydToken.address,
      abi: ydToken.abi,
      functionName: "approve",
      args: [spender, amount],
    });
  };

  return {
    approve,
    isPending,
    isConfirming,
    isSuccess,
    error,
    hash,
  };
}

// 获取兑换率
export function useExchangeRate() {
  const { ydToken } = useContracts();

  const { data } = useReadContract({
    address: ydToken.address,
    abi: ydToken.abi,
    functionName: "EXCHANGE_RATE",
  });

  return {
    rate: data as bigint | undefined,
    // 1 ETH = 10000 YDT
    ethToYDT: (eth: string) => {
      const rate = Number(data || BigInt(10000));
      return (parseFloat(eth) * rate).toString();
    },
    ydtToETH: (ydt: string) => {
      const rate = Number(data || BigInt(10000));
      return (parseFloat(ydt) / rate).toString();
    },
  };
}
