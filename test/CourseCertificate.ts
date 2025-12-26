import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { network } from "hardhat";
import { parseEther } from "viem";

describe("CourseCertificate", async function () {
  const { viem } = await network.connect();
  const publicClient = await viem.getPublicClient();
  const [owner, instructor, student1, student2] = await viem.getWalletClients();

  // Helper to deploy all contracts
  async function deployContracts() {
    const ydToken = await viem.deployContract("YDToken");
    const course = await viem.deployContract("Course", [ydToken.address]);
    const certificate = await viem.deployContract("CourseCertificate", [course.address]);

    // Transfer tokens to users for testing
    await ydToken.write.transfer([instructor.account.address, parseEther("10000")]);
    await ydToken.write.transfer([student1.account.address, parseEther("10000")]);
    await ydToken.write.transfer([student2.account.address, parseEther("10000")]);

    return { ydToken, course, certificate };
  }

  // Helper to approve tokens
  async function approveTokens(ydToken: any, spender: string, account: any, amount: bigint) {
    await ydToken.write.approve([spender, amount], { account });
  }

  // Helper to setup course with purchase
  async function setupCourseWithPurchase(ydToken: any, course: any) {
    // Create course
    await course.write.createCourse(
      ["Test Course", "Description", "https://cover.url", parseEther("100"), 0n],
      { account: instructor.account }
    );

    // Student purchases course
    await approveTokens(ydToken, course.address, student1.account, parseEther("100"));
    await course.write.purchaseCourse([1n, "0x0000000000000000000000000000000000000000"], { account: student1.account });
  }

  describe("Deployment", function () {
    it("Should set the correct name and symbol", async function () {
      const { certificate } = await deployContracts();

      assert.equal(await certificate.read.name(), "Course Certificate");
      assert.equal(await certificate.read.symbol(), "CERT");
    });

    it("Should set the correct course contract address", async function () {
      const { course, certificate } = await deployContracts();

      assert.equal((await certificate.read.courseContract()).toLowerCase(), course.address.toLowerCase());
    });

    it("Should set the correct owner", async function () {
      const { certificate } = await deployContracts();

      assert.equal((await certificate.read.owner()).toLowerCase(), owner.account.address.toLowerCase());
    });
  });

  describe("Enable Certificates", function () {
    it("Should allow instructor to enable certificates", async function () {
      const { ydToken, course, certificate } = await deployContracts();
      await setupCourseWithPurchase(ydToken, course);

      await certificate.write.enableCertificates([1n, "ipfs://metadata"], { account: instructor.account });

      assert.equal(await certificate.read.certificatesEnabled([1n]), true);
      assert.equal(await certificate.read.courseMetadataURI([1n]), "ipfs://metadata");
    });

    it("Should emit CertificatesEnabledForCourse event", async function () {
      const { ydToken, course, certificate } = await deployContracts();
      await setupCourseWithPurchase(ydToken, course);

      await viem.assertions.emitWithArgs(
        certificate.write.enableCertificates([1n, "ipfs://metadata"], { account: instructor.account }),
        certificate,
        "CertificatesEnabledForCourse",
        [1n, true]
      );
    });

    it("Should fail if not instructor", async function () {
      const { ydToken, course, certificate } = await deployContracts();
      await setupCourseWithPurchase(ydToken, course);

      await assert.rejects(
        certificate.write.enableCertificates([1n, "ipfs://metadata"], { account: student1.account }),
        /Only instructor can enable/
      );
    });

    it("Should allow instructor to disable certificates", async function () {
      const { ydToken, course, certificate } = await deployContracts();
      await setupCourseWithPurchase(ydToken, course);

      await certificate.write.enableCertificates([1n, "ipfs://metadata"], { account: instructor.account });
      await certificate.write.disableCertificates([1n], { account: instructor.account });

      assert.equal(await certificate.read.certificatesEnabled([1n]), false);
    });

    it("Should emit event when disabling certificates", async function () {
      const { ydToken, course, certificate } = await deployContracts();
      await setupCourseWithPurchase(ydToken, course);

      await certificate.write.enableCertificates([1n, "ipfs://metadata"], { account: instructor.account });

      await viem.assertions.emitWithArgs(
        certificate.write.disableCertificates([1n], { account: instructor.account }),
        certificate,
        "CertificatesEnabledForCourse",
        [1n, false]
      );
    });
  });

  describe("Claim Certificate", function () {
    it("Should allow student to claim certificate", async function () {
      const { ydToken, course, certificate } = await deployContracts();
      await setupCourseWithPurchase(ydToken, course);

      await certificate.write.enableCertificates([1n, "ipfs://metadata"], { account: instructor.account });

      await certificate.write.claimCertificate([1n, "John Doe"], { account: student1.account });

      // Verify certificate was minted
      assert.equal(await certificate.read.balanceOf([student1.account.address]), 1n);
      assert.equal(await certificate.read.hasCertificate([1n, student1.account.address]), true);
    });

    it("Should emit CertificateIssued event", async function () {
      const { ydToken, course, certificate } = await deployContracts();
      await setupCourseWithPurchase(ydToken, course);

      await certificate.write.enableCertificates([1n, "ipfs://metadata"], { account: instructor.account });

      // Note: timestamp will vary
      const hash = await certificate.write.claimCertificate([1n, "John Doe"], { account: student1.account });

      // Verify certificate was issued
      const tokenId = await certificate.read.getStudentCertificate([1n, student1.account.address]);
      assert.equal(tokenId, 1n);
    });

    it("Should store certificate info correctly", async function () {
      const { ydToken, course, certificate } = await deployContracts();
      await setupCourseWithPurchase(ydToken, course);

      await certificate.write.enableCertificates([1n, "ipfs://metadata"], { account: instructor.account });
      await certificate.write.claimCertificate([1n, "Instructor Name"], { account: student1.account });

      const certInfo = await certificate.read.getCertificate([1n]);
      assert.equal(certInfo.courseId, 1n);
      assert.equal(certInfo.student.toLowerCase(), student1.account.address.toLowerCase());
      assert.equal(certInfo.courseName, "Test Course");
      assert.equal(certInfo.instructorName, "Instructor Name");
    });

    it("Should fail if certificates not enabled", async function () {
      const { ydToken, course, certificate } = await deployContracts();
      await setupCourseWithPurchase(ydToken, course);

      await assert.rejects(
        certificate.write.claimCertificate([1n, "John Doe"], { account: student1.account }),
        /Certificates not enabled for this course/
      );
    });

    it("Should fail if student has not purchased course", async function () {
      const { ydToken, course, certificate } = await deployContracts();

      // Create course without purchase
      await course.write.createCourse(
        ["Test Course", "Description", "https://cover.url", parseEther("100"), 0n],
        { account: instructor.account }
      );

      await certificate.write.enableCertificates([1n, "ipfs://metadata"], { account: instructor.account });

      await assert.rejects(
        certificate.write.claimCertificate([1n, "John Doe"], { account: student1.account }),
        /Must purchase course first/
      );
    });

    it("Should fail if certificate already claimed", async function () {
      const { ydToken, course, certificate } = await deployContracts();
      await setupCourseWithPurchase(ydToken, course);

      await certificate.write.enableCertificates([1n, "ipfs://metadata"], { account: instructor.account });
      await certificate.write.claimCertificate([1n, "John Doe"], { account: student1.account });

      await assert.rejects(
        certificate.write.claimCertificate([1n, "John Doe"], { account: student1.account }),
        /Certificate already claimed/
      );
    });
  });

  describe("Issue Certificate (by Instructor)", function () {
    it("Should allow instructor to issue certificate to student", async function () {
      const { ydToken, course, certificate } = await deployContracts();
      await setupCourseWithPurchase(ydToken, course);

      await certificate.write.enableCertificates([1n, "ipfs://metadata"], { account: instructor.account });

      await certificate.write.issueCertificate(
        [1n, student1.account.address, "Instructor Name"],
        { account: instructor.account }
      );

      assert.equal(await certificate.read.balanceOf([student1.account.address]), 1n);
      assert.equal(await certificate.read.hasCertificate([1n, student1.account.address]), true);
    });

    it("Should fail if not instructor", async function () {
      const { ydToken, course, certificate } = await deployContracts();
      await setupCourseWithPurchase(ydToken, course);

      await certificate.write.enableCertificates([1n, "ipfs://metadata"], { account: instructor.account });

      await assert.rejects(
        certificate.write.issueCertificate(
          [1n, student1.account.address, "Name"],
          { account: student2.account }
        ),
        /Only instructor can issue/
      );
    });

    it("Should fail if certificates not enabled", async function () {
      const { ydToken, course, certificate } = await deployContracts();
      await setupCourseWithPurchase(ydToken, course);

      await assert.rejects(
        certificate.write.issueCertificate(
          [1n, student1.account.address, "Name"],
          { account: instructor.account }
        ),
        /Certificates not enabled/
      );
    });

    it("Should fail if student has not purchased course", async function () {
      const { ydToken, course, certificate } = await deployContracts();

      // Create course without student2 purchase
      await course.write.createCourse(
        ["Test Course", "Description", "https://cover.url", parseEther("100"), 0n],
        { account: instructor.account }
      );

      await certificate.write.enableCertificates([1n, "ipfs://metadata"], { account: instructor.account });

      await assert.rejects(
        certificate.write.issueCertificate(
          [1n, student2.account.address, "Name"],
          { account: instructor.account }
        ),
        /Student must purchase course first/
      );
    });

    it("Should fail if certificate already issued", async function () {
      const { ydToken, course, certificate } = await deployContracts();
      await setupCourseWithPurchase(ydToken, course);

      await certificate.write.enableCertificates([1n, "ipfs://metadata"], { account: instructor.account });
      await certificate.write.issueCertificate(
        [1n, student1.account.address, "Name"],
        { account: instructor.account }
      );

      await assert.rejects(
        certificate.write.issueCertificate(
          [1n, student1.account.address, "Name"],
          { account: instructor.account }
        ),
        /Certificate already issued/
      );
    });
  });

  describe("View Functions", function () {
    it("Should return certificate info", async function () {
      const { ydToken, course, certificate } = await deployContracts();
      await setupCourseWithPurchase(ydToken, course);

      await certificate.write.enableCertificates([1n, "ipfs://metadata"], { account: instructor.account });
      await certificate.write.claimCertificate([1n, "Instructor"], { account: student1.account });

      const certInfo = await certificate.read.getCertificate([1n]);
      assert.equal(certInfo.courseId, 1n);
      assert.equal(certInfo.student.toLowerCase(), student1.account.address.toLowerCase());
    });

    it("Should return student certificate token ID", async function () {
      const { ydToken, course, certificate } = await deployContracts();
      await setupCourseWithPurchase(ydToken, course);

      await certificate.write.enableCertificates([1n, "ipfs://metadata"], { account: instructor.account });
      await certificate.write.claimCertificate([1n, "Instructor"], { account: student1.account });

      const tokenId = await certificate.read.getStudentCertificate([1n, student1.account.address]);
      assert.equal(tokenId, 1n);
    });

    it("Should return 0 if no certificate", async function () {
      const { certificate } = await deployContracts();

      const tokenId = await certificate.read.getStudentCertificate([1n, student1.account.address]);
      assert.equal(tokenId, 0n);
    });

    it("Should check if student has certificate", async function () {
      const { ydToken, course, certificate } = await deployContracts();
      await setupCourseWithPurchase(ydToken, course);

      await certificate.write.enableCertificates([1n, "ipfs://metadata"], { account: instructor.account });

      assert.equal(await certificate.read.hasCertificate([1n, student1.account.address]), false);

      await certificate.write.claimCertificate([1n, "Instructor"], { account: student1.account });

      assert.equal(await certificate.read.hasCertificate([1n, student1.account.address]), true);
    });

    it("Should return all certificates owned by address", async function () {
      const { ydToken, course, certificate } = await deployContracts();

      // Create multiple courses and have student purchase them
      for (let i = 0; i < 3; i++) {
        await course.write.createCourse(
          [`Course ${i}`, "Description", "https://cover.url", parseEther("100"), 0n],
          { account: instructor.account }
        );

        await approveTokens(ydToken, course.address, student1.account, parseEther("100"));
        await course.write.purchaseCourse([BigInt(i + 1), "0x0000000000000000000000000000000000000000"], { account: student1.account });

        await certificate.write.enableCertificates([BigInt(i + 1), `ipfs://metadata${i}`], { account: instructor.account });
        await certificate.write.claimCertificate([BigInt(i + 1), "Instructor"], { account: student1.account });
      }

      const certificates = await certificate.read.getCertificatesOf([student1.account.address]);
      assert.equal(certificates.length, 3);
    });
  });

  describe("Token URI", function () {
    it("Should return correct token URI", async function () {
      const { ydToken, course, certificate } = await deployContracts();
      await setupCourseWithPurchase(ydToken, course);

      const metadataURI = "ipfs://QmTestMetadata";
      await certificate.write.enableCertificates([1n, metadataURI], { account: instructor.account });
      await certificate.write.claimCertificate([1n, "Instructor"], { account: student1.account });

      const tokenURI = await certificate.read.tokenURI([1n]);
      assert.equal(tokenURI, metadataURI);
    });
  });

  describe("ERC721 Enumerable", function () {
    it("Should return total supply", async function () {
      const { ydToken, course, certificate } = await deployContracts();
      await setupCourseWithPurchase(ydToken, course);

      await certificate.write.enableCertificates([1n, "ipfs://metadata"], { account: instructor.account });
      await certificate.write.claimCertificate([1n, "Instructor"], { account: student1.account });

      assert.equal(await certificate.read.totalSupply(), 1n);
    });

    it("Should return token by index", async function () {
      const { ydToken, course, certificate } = await deployContracts();
      await setupCourseWithPurchase(ydToken, course);

      await certificate.write.enableCertificates([1n, "ipfs://metadata"], { account: instructor.account });
      await certificate.write.claimCertificate([1n, "Instructor"], { account: student1.account });

      const tokenId = await certificate.read.tokenByIndex([0n]);
      assert.equal(tokenId, 1n);
    });

    it("Should return token of owner by index", async function () {
      const { ydToken, course, certificate } = await deployContracts();
      await setupCourseWithPurchase(ydToken, course);

      await certificate.write.enableCertificates([1n, "ipfs://metadata"], { account: instructor.account });
      await certificate.write.claimCertificate([1n, "Instructor"], { account: student1.account });

      const tokenId = await certificate.read.tokenOfOwnerByIndex([student1.account.address, 0n]);
      assert.equal(tokenId, 1n);
    });
  });

  describe("Admin Functions", function () {
    it("Should allow owner to update course contract", async function () {
      const { course, certificate } = await deployContracts();

      // Deploy a new course contract
      const ydToken2 = await viem.deployContract("YDToken");
      const newCourse = await viem.deployContract("Course", [ydToken2.address]);

      await certificate.write.setCourseContract([newCourse.address]);

      assert.equal((await certificate.read.courseContract()).toLowerCase(), newCourse.address.toLowerCase());
    });

    it("Should not allow non-owner to update course contract", async function () {
      const { course, certificate } = await deployContracts();

      const ydToken2 = await viem.deployContract("YDToken");
      const newCourse = await viem.deployContract("Course", [ydToken2.address]);

      await assert.rejects(
        certificate.write.setCourseContract([newCourse.address], { account: student1.account }),
        /OwnableUnauthorizedAccount/
      );
    });
  });

  describe("ERC721 Interface Support", function () {
    it("Should support ERC721 interface", async function () {
      const { certificate } = await deployContracts();

      // ERC721 interface ID
      const erc721InterfaceId = "0x80ac58cd";
      assert.equal(await certificate.read.supportsInterface([erc721InterfaceId]), true);
    });

    it("Should support ERC721Enumerable interface", async function () {
      const { certificate } = await deployContracts();

      // ERC721Enumerable interface ID
      const erc721EnumerableInterfaceId = "0x780e9d63";
      assert.equal(await certificate.read.supportsInterface([erc721EnumerableInterfaceId]), true);
    });

    it("Should support ERC721Metadata interface", async function () {
      const { certificate } = await deployContracts();

      // ERC721Metadata interface ID
      const erc721MetadataInterfaceId = "0x5b5e139f";
      assert.equal(await certificate.read.supportsInterface([erc721MetadataInterfaceId]), true);
    });
  });

  describe("Transfer Certificates", function () {
    it("Should allow transferring certificate NFT", async function () {
      const { ydToken, course, certificate } = await deployContracts();
      await setupCourseWithPurchase(ydToken, course);

      await certificate.write.enableCertificates([1n, "ipfs://metadata"], { account: instructor.account });
      await certificate.write.claimCertificate([1n, "Instructor"], { account: student1.account });

      // Transfer certificate to student2
      await certificate.write.transferFrom(
        [student1.account.address, student2.account.address, 1n],
        { account: student1.account }
      );

      assert.equal((await certificate.read.ownerOf([1n])).toLowerCase(), student2.account.address.toLowerCase());
      assert.equal(await certificate.read.balanceOf([student1.account.address]), 0n);
      assert.equal(await certificate.read.balanceOf([student2.account.address]), 1n);
    });

    it("Should allow safe transfer", async function () {
      const { ydToken, course, certificate } = await deployContracts();
      await setupCourseWithPurchase(ydToken, course);

      await certificate.write.enableCertificates([1n, "ipfs://metadata"], { account: instructor.account });
      await certificate.write.claimCertificate([1n, "Instructor"], { account: student1.account });

      // Safe transfer
      await certificate.write.safeTransferFrom(
        [student1.account.address, student2.account.address, 1n],
        { account: student1.account }
      );

      assert.equal((await certificate.read.ownerOf([1n])).toLowerCase(), student2.account.address.toLowerCase());
    });
  });
});
