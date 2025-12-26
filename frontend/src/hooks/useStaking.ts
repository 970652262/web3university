"use client";

import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { useContracts } from "./useContracts";

export interface StakeInfo {
  amount: bigint;
  startTime: bigint;
  stakeDuration: bigint;
  pendingRewards: bigint;
  canUnstake: boolean;
}

export interface StakingStats {
  totalStaked: bigint;
  rewardPool: bigint;
  annualRewardRate: bigint;
  minStakeDuration: bigint;
  minStakeAmount: bigint;
  maxStakeAmount: bigint;
}

// 获取用户质押信息
export function useStakeInfo(userAddress: `0x${string}` | undefined) {
  const { staking } = useContracts();

  const { data, isLoading, refetch } = useReadContract({
    address: staking.address,
    abi: staking.abi,
    functionName: "getStakeInfo",
    args: userAddress ? [userAddress] : undefined,
    query: {
      enabled: !!userAddress,
    },
  });

  const stakeInfo: StakeInfo | undefined = data
    ? {
        amount: (data as unknown as bigint[])[0],
        startTime: (data as unknown as bigint[])[1],
        stakeDuration: (data as unknown as bigint[])[2],
        pendingRewards: (data as unknown as bigint[])[3],
        canUnstake: (data as unknown as (bigint | boolean)[])[4] as boolean,
      }
    : undefined;

  return {
    stakeInfo,
    isLoading,
    refetch,
  };
}

// 获取用户待领取奖励
export function usePendingRewards(userAddress: `0x${string}` | undefined) {
  const { staking } = useContracts();

  const { data, isLoading, refetch } = useReadContract({
    address: staking.address,
    abi: staking.abi,
    functionName: "getTotalPendingRewards",
    args: userAddress ? [userAddress] : undefined,
    query: {
      enabled: !!userAddress,
    },
  });

  return {
    pendingRewards: data as bigint | undefined,
    isLoading,
    refetch,
  };
}

// 获取质押统计数据
export function useStakingStats() {
  const { staking } = useContracts();

  const { data, isLoading, refetch } = useReadContract({
    address: staking.address,
    abi: staking.abi,
    functionName: "getStakingStats",
  });

  const stats: StakingStats | undefined = data
    ? {
        totalStaked: (data as unknown as bigint[])[0],
        rewardPool: (data as unknown as bigint[])[1],
        annualRewardRate: (data as unknown as bigint[])[2],
        minStakeDuration: (data as unknown as bigint[])[3],
        minStakeAmount: (data as unknown as bigint[])[4],
        maxStakeAmount: (data as unknown as bigint[])[5],
      }
    : undefined;

  return {
    stats,
    isLoading,
    refetch,
  };
}

// 质押 YDT
export function useStake() {
  const { staking } = useContracts();
  const { writeContract, data: hash, isPending, error, reset } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const stake = (amount: bigint) => {
    writeContract({
      address: staking.address,
      abi: staking.abi,
      functionName: "stake",
      args: [amount],
    });
  };

  return {
    stake,
    isPending,
    isConfirming,
    isSuccess,
    error,
    hash,
    reset,
  };
}

// 解除质押
export function useUnstake() {
  const { staking } = useContracts();
  const { writeContract, data: hash, isPending, error, reset } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const unstake = (amount: bigint) => {
    writeContract({
      address: staking.address,
      abi: staking.abi,
      functionName: "unstake",
      args: [amount],
    });
  };

  return {
    unstake,
    isPending,
    isConfirming,
    isSuccess,
    error,
    hash,
    reset,
  };
}

// 领取奖励
export function useClaimRewards() {
  const { staking } = useContracts();
  const { writeContract, data: hash, isPending, error, reset } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const claimRewards = () => {
    writeContract({
      address: staking.address,
      abi: staking.abi,
      functionName: "claimRewards",
    });
  };

  return {
    claimRewards,
    isPending,
    isConfirming,
    isSuccess,
    error,
    hash,
    reset,
  };
}

// 授权质押合约使用 YDT
export function useApproveStaking() {
  const { ydToken, staking } = useContracts();
  const { writeContract, data: hash, isPending, error, reset } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const approve = (amount: bigint) => {
    writeContract({
      address: ydToken.address,
      abi: ydToken.abi,
      functionName: "approve",
      args: [staking.address, amount],
    });
  };

  return {
    approve,
    isPending,
    isConfirming,
    isSuccess,
    error,
    hash,
    reset,
  };
}

// 获取质押合约的授权额度
export function useStakingAllowance(userAddress: `0x${string}` | undefined) {
  const { ydToken, staking } = useContracts();

  const { data, isLoading, refetch } = useReadContract({
    address: ydToken.address,
    abi: ydToken.abi,
    functionName: "allowance",
    args: userAddress ? [userAddress, staking.address] : undefined,
    query: {
      enabled: !!userAddress,
    },
  });

  return {
    allowance: data as bigint | undefined,
    isLoading,
    refetch,
  };
}
