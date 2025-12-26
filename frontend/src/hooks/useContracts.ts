"use client";

import { useChainId } from "wagmi";
import { getContractAddresses } from "@/config/contracts";
import { YDTokenABI } from "@/config/abis/YDToken";
import { CourseABI } from "@/config/abis/Course";
import { CourseCertificateABI } from "@/config/abis/CourseCertificate";
import { YDTStakingABI } from "@/config/abis/YDTStaking";

export function useContracts() {
  const chainId = useChainId();
  const addresses = getContractAddresses(chainId);

  return {
    ydToken: {
      address: addresses.ydToken,
      abi: YDTokenABI,
    },
    course: {
      address: addresses.course,
      abi: CourseABI,
    },
    certificate: {
      address: addresses.certificate,
      abi: CourseCertificateABI,
    },
    staking: {
      address: addresses.staking,
      abi: YDTStakingABI,
    },
  };
}
