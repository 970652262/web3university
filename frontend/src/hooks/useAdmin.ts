"use client";

import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { parseEther } from "viem";
import { useContracts } from "./useContracts";

// 检查是否为合约 owner
export function useIsOwner(address: `0x${string}` | undefined) {
  const { course } = useContracts();

  const { data: owner, isLoading } = useReadContract({
    address: course.address,
    abi: course.abi,
    functionName: "owner",
  });

  return {
    isOwner: address && owner ? address.toLowerCase() === (owner as string).toLowerCase() : false,
    owner: owner as `0x${string}` | undefined,
    isLoading,
  };
}

// 获取平台配置
export function usePlatformConfig() {
  const { course } = useContracts();

  const { data: platformFee } = useReadContract({
    address: course.address,
    abi: course.abi,
    functionName: "platformFeePercent",
  });

  const { data: refundPeriod } = useReadContract({
    address: course.address,
    abi: course.abi,
    functionName: "refundPeriod",
  });

  const { data: referralReward } = useReadContract({
    address: course.address,
    abi: course.abi,
    functionName: "referralRewardPercent",
  });

  const { data: monthlyPrice } = useReadContract({
    address: course.address,
    abi: course.abi,
    functionName: "monthlySubscriptionPrice",
  });

  const { data: yearlyPrice } = useReadContract({
    address: course.address,
    abi: course.abi,
    functionName: "yearlySubscriptionPrice",
  });

  const { data: bulkThreshold } = useReadContract({
    address: course.address,
    abi: course.abi,
    functionName: "bulkDiscountThreshold",
  });

  const { data: bulkDiscount } = useReadContract({
    address: course.address,
    abi: course.abi,
    functionName: "bulkDiscountPercent",
  });

  const { data: requireCert } = useReadContract({
    address: course.address,
    abi: course.abi,
    functionName: "requireCertification",
  });

  return {
    platformFeePercent: platformFee as bigint | undefined,
    refundPeriod: refundPeriod as bigint | undefined,
    referralRewardPercent: referralReward as bigint | undefined,
    monthlySubscriptionPrice: monthlyPrice as bigint | undefined,
    yearlySubscriptionPrice: yearlyPrice as bigint | undefined,
    bulkDiscountThreshold: bulkThreshold as bigint | undefined,
    bulkDiscountPercent: bulkDiscount as bigint | undefined,
    requireCertification: requireCert as boolean | undefined,
  };
}

// 创建分类
export function useCreateCategory() {
  const { course } = useContracts();
  const { writeContract, data: hash, isPending, error, reset } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const createCategory = (name: string) => {
    writeContract({
      address: course.address,
      abi: course.abi,
      functionName: "createCategory",
      args: [name],
    });
  };

  return {
    createCategory,
    isPending,
    isConfirming,
    isSuccess,
    error,
    hash,
    reset,
  };
}

// 更新分类
export function useUpdateCategory() {
  const { course } = useContracts();
  const { writeContract, data: hash, isPending, error, reset } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const updateCategory = (categoryId: bigint, name: string, isActive: boolean) => {
    writeContract({
      address: course.address,
      abi: course.abi,
      functionName: "updateCategory",
      args: [categoryId, name, isActive],
    });
  };

  return {
    updateCategory,
    isPending,
    isConfirming,
    isSuccess,
    error,
    hash,
    reset,
  };
}

// 认证讲师
export function useCertifyInstructor() {
  const { course } = useContracts();
  const { writeContract, data: hash, isPending, error, reset } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const certifyInstructor = (instructor: `0x${string}`) => {
    writeContract({
      address: course.address,
      abi: course.abi,
      functionName: "certifyInstructor",
      args: [instructor],
    });
  };

  return {
    certifyInstructor,
    isPending,
    isConfirming,
    isSuccess,
    error,
    hash,
    reset,
  };
}

// 取消讲师认证
export function useDecertifyInstructor() {
  const { course } = useContracts();
  const { writeContract, data: hash, isPending, error, reset } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const decertifyInstructor = (instructor: `0x${string}`) => {
    writeContract({
      address: course.address,
      abi: course.abi,
      functionName: "decertifyInstructor",
      args: [instructor],
    });
  };

  return {
    decertifyInstructor,
    isPending,
    isConfirming,
    isSuccess,
    error,
    hash,
    reset,
  };
}

// 设置是否需要讲师认证
export function useSetRequireCertification() {
  const { course } = useContracts();
  const { writeContract, data: hash, isPending, error, reset } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const setRequireCertification = (required: boolean) => {
    writeContract({
      address: course.address,
      abi: course.abi,
      functionName: "setRequireCertification",
      args: [required],
    });
  };

  return {
    setRequireCertification,
    isPending,
    isConfirming,
    isSuccess,
    error,
    hash,
    reset,
  };
}

// 设置平台费率
export function useSetPlatformFee() {
  const { course } = useContracts();
  const { writeContract, data: hash, isPending, error, reset } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const setPlatformFee = (feePercent: bigint) => {
    writeContract({
      address: course.address,
      abi: course.abi,
      functionName: "setPlatformFee",
      args: [feePercent],
    });
  };

  return {
    setPlatformFee,
    isPending,
    isConfirming,
    isSuccess,
    error,
    hash,
    reset,
  };
}

// 设置退款期限
export function useSetRefundPeriod() {
  const { course } = useContracts();
  const { writeContract, data: hash, isPending, error, reset } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const setRefundPeriod = (period: bigint) => {
    writeContract({
      address: course.address,
      abi: course.abi,
      functionName: "setRefundPeriod",
      args: [period],
    });
  };

  return {
    setRefundPeriod,
    isPending,
    isConfirming,
    isSuccess,
    error,
    hash,
    reset,
  };
}

// 设置推荐奖励比例
export function useSetReferralReward() {
  const { course } = useContracts();
  const { writeContract, data: hash, isPending, error, reset } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const setReferralReward = (percent: bigint) => {
    writeContract({
      address: course.address,
      abi: course.abi,
      functionName: "setReferralRewardPercent",
      args: [percent],
    });
  };

  return {
    setReferralReward,
    isPending,
    isConfirming,
    isSuccess,
    error,
    hash,
    reset,
  };
}

// 设置订阅价格
export function useSetSubscriptionPrices() {
  const { course } = useContracts();
  const { writeContract, data: hash, isPending, error, reset } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const setSubscriptionPrices = (monthlyPrice: string, yearlyPrice: string) => {
    writeContract({
      address: course.address,
      abi: course.abi,
      functionName: "setSubscriptionPrices",
      args: [parseEther(monthlyPrice), parseEther(yearlyPrice)],
    });
  };

  return {
    setSubscriptionPrices,
    isPending,
    isConfirming,
    isSuccess,
    error,
    hash,
    reset,
  };
}
