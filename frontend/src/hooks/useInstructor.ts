"use client";

import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { parseEther } from "viem";
import { useContracts } from "./useContracts";

// 检查是否为认证讲师
export function useIsCertifiedInstructor(address: `0x${string}` | undefined) {
  const { course } = useContracts();

  const { data, isLoading, refetch } = useReadContract({
    address: course.address,
    abi: course.abi,
    functionName: "certifiedInstructors",
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    },
  });

  return {
    isCertified: data as boolean | undefined,
    isLoading,
    refetch,
  };
}

// 检查是否需要讲师认证
export function useRequireCertification() {
  const { course } = useContracts();

  const { data, isLoading } = useReadContract({
    address: course.address,
    abi: course.abi,
    functionName: "requireCertification",
  });

  return {
    required: data as boolean | undefined,
    isLoading,
  };
}

// 创建课程
export function useCreateCourse() {
  const { course } = useContracts();
  const { writeContract, data: hash, isPending, error, reset } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const createCourse = (
    title: string,
    description: string,
    coverUrl: string,
    priceYDT: string,
    categoryId: bigint
  ) => {
    writeContract({
      address: course.address,
      abi: course.abi,
      functionName: "createCourse",
      args: [title, description, coverUrl, parseEther(priceYDT), categoryId],
    });
  };

  return {
    createCourse,
    isPending,
    isConfirming,
    isSuccess,
    error,
    hash,
    reset,
  };
}

// 更新课程
export function useUpdateCourse() {
  const { course } = useContracts();
  const { writeContract, data: hash, isPending, error, reset } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const updateCourse = (
    courseId: bigint,
    title: string,
    description: string,
    coverUrl: string,
    priceYDT: string,
    categoryId: bigint
  ) => {
    writeContract({
      address: course.address,
      abi: course.abi,
      functionName: "updateCourse",
      args: [courseId, title, description, coverUrl, parseEther(priceYDT), categoryId],
    });
  };

  return {
    updateCourse,
    isPending,
    isConfirming,
    isSuccess,
    error,
    hash,
    reset,
  };
}

// 下架课程
export function useDeactivateCourse() {
  const { course } = useContracts();
  const { writeContract, data: hash, isPending, error, reset } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const deactivateCourse = (courseId: bigint) => {
    writeContract({
      address: course.address,
      abi: course.abi,
      functionName: "deactivateCourse",
      args: [courseId],
    });
  };

  return {
    deactivateCourse,
    isPending,
    isConfirming,
    isSuccess,
    error,
    hash,
    reset,
  };
}

// 获取讲师推荐奖励
export function useReferralRewards(address: `0x${string}` | undefined) {
  const { course } = useContracts();

  const { data, isLoading } = useReadContract({
    address: course.address,
    abi: course.abi,
    functionName: "referralRewards",
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    },
  });

  return {
    rewards: data as bigint | undefined,
    isLoading,
  };
}
