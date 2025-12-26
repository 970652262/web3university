"use client";

import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { useContracts } from "./useContracts";

export interface SubscriptionInfo {
  startTime: bigint;
  endTime: bigint;
  isActive: boolean;
}

// 获取用户订阅信息
export function useSubscription(userAddress: `0x${string}` | undefined) {
  const { course } = useContracts();

  const { data, isLoading, refetch } = useReadContract({
    address: course.address,
    abi: course.abi,
    functionName: "subscriptions",
    args: userAddress ? [userAddress] : undefined,
    query: {
      enabled: !!userAddress,
    },
  });

  const subscription = data as SubscriptionInfo | undefined;
  const now = BigInt(Math.floor(Date.now() / 1000));
  const isActive = subscription?.isActive && subscription.endTime > now;

  return {
    subscription,
    isActive,
    isLoading,
    refetch,
  };
}

// 检查用户是否有活跃订阅
export function useHasActiveSubscription(userAddress: `0x${string}` | undefined) {
  const { course } = useContracts();

  const { data, isLoading, refetch } = useReadContract({
    address: course.address,
    abi: course.abi,
    functionName: "hasActiveSubscription",
    args: userAddress ? [userAddress] : undefined,
    query: {
      enabled: !!userAddress,
    },
  });

  return {
    hasSubscription: data as boolean | undefined,
    isLoading,
    refetch,
  };
}

// 购买月度订阅
export function usePurchaseMonthlySubscription() {
  const { course } = useContracts();
  const { writeContract, data: hash, isPending, error, reset } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const purchaseMonthly = () => {
    writeContract({
      address: course.address,
      abi: course.abi,
      functionName: "purchaseMonthlySubscription",
    });
  };

  return {
    purchaseMonthly,
    isPending,
    isConfirming,
    isSuccess,
    error,
    hash,
    reset,
  };
}

// 购买年度订阅
export function usePurchaseYearlySubscription() {
  const { course } = useContracts();
  const { writeContract, data: hash, isPending, error, reset } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const purchaseYearly = () => {
    writeContract({
      address: course.address,
      abi: course.abi,
      functionName: "purchaseYearlySubscription",
    });
  };

  return {
    purchaseYearly,
    isPending,
    isConfirming,
    isSuccess,
    error,
    hash,
    reset,
  };
}
