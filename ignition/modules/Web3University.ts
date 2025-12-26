import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import { parseEther } from "viem";

export default buildModule("Web3UniversityModule", (m) => {
  // 1. Deploy YDToken
  const ydToken = m.contract("YDToken");

  // 2. Deploy Course contract with YDToken address
  const course = m.contract("Course", [ydToken]);

  // 3. Deploy CourseCertificate contract with Course address
  const certificate = m.contract("CourseCertificate", [course]);

  // 4. Deploy YDTStaking contract with YDToken address
  const staking = m.contract("YDTStaking", [ydToken]);

  // 4. Transfer initial YDToken supply to Course contract for sales
  // Transfer 500,000 YDT (50% of initial supply) to contract for token sales
  const initialTokensForSale = parseEther("500000");
  m.call(ydToken, "transfer", [course, initialTokensForSale], {
    id: "transfer_tokens_to_course",
  });

  // 5. Create default categories
  const category1 = m.call(course, "createCategory", ["Blockchain"], {
    id: "create_category_blockchain",
  });
  const category2 = m.call(course, "createCategory", ["Web Development"], {
    id: "create_category_web",
    after: [category1],
  });
  const category3 = m.call(course, "createCategory", ["Smart Contracts"], {
    id: "create_category_smart_contracts",
    after: [category2],
  });

  return { ydToken, course, certificate, staking };
});
