"use client";

import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { useContracts } from "./useContracts";

// 购买单个课程
export function usePurchaseCourse() {
  const { course } = useContracts();
  const { writeContract, data: hash, isPending, error, reset } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const purchaseCourse = (courseId: bigint, referrer: `0x${string}` = "0x0000000000000000000000000000000000000000") => {
    writeContract({
      address: course.address,
      abi: course.abi,
      functionName: "purchaseCourse",
      args: [courseId, referrer],
    });
  };

  return {
    purchaseCourse,
    isPending,
    isConfirming,
    isSuccess,
    error,
    hash,
    reset,
  };
}

// 批量购买课程
export function usePurchaseCoursesBulk() {
  const { course } = useContracts();
  const { writeContract, data: hash, isPending, error, reset } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const purchaseCoursesBulk = (courseIds: bigint[], referrer: `0x${string}` = "0x0000000000000000000000000000000000000000") => {
    writeContract({
      address: course.address,
      abi: course.abi,
      functionName: "purchaseCoursesBulk",
      args: [courseIds, referrer],
    });
  };

  return {
    purchaseCoursesBulk,
    isPending,
    isConfirming,
    isSuccess,
    error,
    hash,
    reset,
  };
}

// 课程评分
export function useRateCourse() {
  const { course } = useContracts();
  const { writeContract, data: hash, isPending, error, reset } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const rateCourse = (courseId: bigint, score: number, comment: string) => {
    writeContract({
      address: course.address,
      abi: course.abi,
      functionName: "rateCourse",
      args: [courseId, score, comment],
    });
  };

  return {
    rateCourse,
    isPending,
    isConfirming,
    isSuccess,
    error,
    hash,
    reset,
  };
}

// 申请退款
export function useRequestRefund() {
  const { course } = useContracts();
  const { writeContract, data: hash, isPending, error, reset } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const requestRefund = (courseId: bigint) => {
    writeContract({
      address: course.address,
      abi: course.abi,
      functionName: "requestRefund",
      args: [courseId],
    });
  };

  return {
    requestRefund,
    isPending,
    isConfirming,
    isSuccess,
    error,
    hash,
    reset,
  };
}
