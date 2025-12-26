"use client";

import { useReadContract, useReadContracts, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { useContracts } from "./useContracts";

export interface CertificateInfo {
  courseId: bigint;
  student: `0x${string}`;
  issueDate: bigint;
  courseName: string;
  instructorName: string;
}

// 获取用户的所有证书
export function useUserCertificates(userAddress: `0x${string}` | undefined) {
  const { certificate } = useContracts();

  // 获取证书 token IDs
  const { data: tokenIds, isLoading: idsLoading, refetch } = useReadContract({
    address: certificate.address,
    abi: certificate.abi,
    functionName: "getCertificatesOf",
    args: userAddress ? [userAddress] : undefined,
    query: {
      enabled: !!userAddress,
    },
  });

  const ids = (tokenIds as bigint[] | undefined) || [];

  // 批量获取证书详情
  const contracts = ids.map((id) => ({
    address: certificate.address,
    abi: certificate.abi,
    functionName: "getCertificate" as const,
    args: [id],
  }));

  const { data: certificatesData, isLoading: certsLoading } = useReadContracts({
    contracts,
    query: {
      enabled: ids.length > 0,
    },
  });

  const certificates = certificatesData
    ?.map((result, index) => ({
      tokenId: ids[index],
      ...(result.result as CertificateInfo | undefined),
    }))
    .filter((c): c is { tokenId: bigint } & CertificateInfo => !!c.courseId);

  return {
    certificates: certificates || [],
    tokenIds: ids,
    isLoading: idsLoading || certsLoading,
    refetch,
  };
}

// 获取单个证书详情
export function useCertificate(tokenId: bigint | undefined) {
  const { certificate } = useContracts();

  const { data, isLoading } = useReadContract({
    address: certificate.address,
    abi: certificate.abi,
    functionName: "getCertificate",
    args: tokenId ? [tokenId] : undefined,
    query: {
      enabled: !!tokenId,
    },
  });

  return {
    certificate: data as CertificateInfo | undefined,
    isLoading,
  };
}

// 检查用户是否有某课程的证书
export function useHasCertificate(courseId: bigint | undefined, userAddress: `0x${string}` | undefined) {
  const { certificate } = useContracts();

  const { data, isLoading, refetch } = useReadContract({
    address: certificate.address,
    abi: certificate.abi,
    functionName: "hasCertificate",
    args: courseId && userAddress ? [courseId, userAddress] : undefined,
    query: {
      enabled: !!courseId && !!userAddress,
    },
  });

  return {
    hasCertificate: data as boolean | undefined,
    isLoading,
    refetch,
  };
}

// 检查课程是否启用了证书
export function useCertificatesEnabled(courseId: bigint | undefined) {
  const { certificate } = useContracts();

  const { data, isLoading } = useReadContract({
    address: certificate.address,
    abi: certificate.abi,
    functionName: "certificatesEnabled",
    args: courseId ? [courseId] : undefined,
    query: {
      enabled: !!courseId,
    },
  });

  return {
    enabled: data as boolean | undefined,
    isLoading,
  };
}

// 领取证书
export function useClaimCertificate() {
  const { certificate } = useContracts();
  const { writeContract, data: hash, isPending, error, reset } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const claimCertificate = (courseId: bigint, instructorName: string) => {
    writeContract({
      address: certificate.address,
      abi: certificate.abi,
      functionName: "claimCertificate",
      args: [courseId, instructorName],
    });
  };

  return {
    claimCertificate,
    isPending,
    isConfirming,
    isSuccess,
    error,
    hash,
    reset,
  };
}

// 启用课程证书（讲师）
export function useEnableCertificates() {
  const { certificate } = useContracts();
  const { writeContract, data: hash, isPending, error, reset } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const enableCertificates = (courseId: bigint, metadataURI: string) => {
    writeContract({
      address: certificate.address,
      abi: certificate.abi,
      functionName: "enableCertificates",
      args: [courseId, metadataURI],
    });
  };

  return {
    enableCertificates,
    isPending,
    isConfirming,
    isSuccess,
    error,
    hash,
    reset,
  };
}

// 颁发证书给学生（讲师）
export function useIssueCertificate() {
  const { certificate } = useContracts();
  const { writeContract, data: hash, isPending, error, reset } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const issueCertificate = (courseId: bigint, student: `0x${string}`, instructorName: string) => {
    writeContract({
      address: certificate.address,
      abi: certificate.abi,
      functionName: "issueCertificate",
      args: [courseId, student, instructorName],
    });
  };

  return {
    issueCertificate,
    isPending,
    isConfirming,
    isSuccess,
    error,
    hash,
    reset,
  };
}
