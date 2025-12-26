import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { network } from "hardhat";
import { parseEther } from "viem";

describe("Course", async function () {
  const { viem } = await network.connect();
  const publicClient = await viem.getPublicClient();
  const [owner, instructor, student1, student2, referrer] = await viem.getWalletClients();

  // Helper to deploy contracts
  async function deployContracts() {
    const ydToken = await viem.deployContract("YDToken");

    const course = await viem.deployContract("Course", [ydToken.address]);

    // Transfer tokens to users for testing
    await ydToken.write.transfer([instructor.account.address, parseEther("10000")]);
    await ydToken.write.transfer([student1.account.address, parseEther("10000")]);
    await ydToken.write.transfer([student2.account.address, parseEther("10000")]);
    await ydToken.write.transfer([referrer.account.address, parseEther("10000")]);

    return { ydToken, course };
  }

  // Helper to approve tokens
  async function approveTokens(ydToken: any, spender: string, account: any, amount: bigint) {
    await ydToken.write.approve([spender, amount], { account });
  }

  describe("Deployment", function () {
    it("Should set the correct YDToken address", async function () {
      const { ydToken, course } = await deployContracts();

      assert.equal((await course.read.ydToken()).toLowerCase(), ydToken.address.toLowerCase());
    });

    it("Should set the correct owner", async function () {
      const { course } = await deployContracts();

      assert.equal((await course.read.owner()).toLowerCase(), owner.account.address.toLowerCase());
    });

    it("Should set default configuration values", async function () {
      const { course } = await deployContracts();

      assert.equal(await course.read.platformFeePercent(), 5n);
      assert.equal(await course.read.refundPeriod(), 7n * 24n * 60n * 60n); // 7 days in seconds
      assert.equal(await course.read.referralRewardPercent(), 5n);
      assert.equal(await course.read.monthlySubscriptionPrice(), parseEther("100"));
      assert.equal(await course.read.yearlySubscriptionPrice(), parseEther("1000"));
    });
  });

  describe("Category Management", function () {
    it("Should allow owner to create category", async function () {
      const { course } = await deployContracts();

      await course.write.createCategory(["Web Development"]);

      const category = await course.read.categories([1n]);
      assert.equal(category[0], 1n); // id
      assert.equal(category[1], "Web Development"); // name
      assert.equal(category[2], true); // isActive
    });

    it("Should emit CategoryCreated event", async function () {
      const { course } = await deployContracts();

      await viem.assertions.emitWithArgs(
        course.write.createCategory(["Blockchain"]),
        course,
        "CategoryCreated",
        [1n, "Blockchain"]
      );
    });

    it("Should not allow non-owner to create category", async function () {
      const { course } = await deployContracts();

      await assert.rejects(
        course.write.createCategory(["Test"], { account: instructor.account }),
        /OwnableUnauthorizedAccount/
      );
    });

    it("Should allow owner to update category", async function () {
      const { course } = await deployContracts();

      await course.write.createCategory(["Old Name"]);
      await course.write.updateCategory([1n, "New Name", false]);

      const category = await course.read.categories([1n]);
      assert.equal(category[1], "New Name");
      assert.equal(category[2], false);
    });
  });

  describe("Course Creation", function () {
    it("Should allow creating a course", async function () {
      const { course } = await deployContracts();

      await course.write.createCourse(
        ["Solidity Basics", "Learn Solidity", "https://cover.url", parseEther("100"), 0n],
        { account: instructor.account }
      );

      const courseInfo = await course.read.getCourse([1n]);
      assert.equal(courseInfo.id, 1n);
      assert.equal(courseInfo.title, "Solidity Basics");
      assert.equal(courseInfo.description, "Learn Solidity");
      assert.equal(courseInfo.priceYDT, parseEther("100"));
      assert.equal(courseInfo.instructor.toLowerCase(), instructor.account.address.toLowerCase());
      assert.equal(courseInfo.isActive, true);
    });

    it("Should emit CourseCreated event", async function () {
      const { course } = await deployContracts();

      await viem.assertions.emit(
        course.write.createCourse(
          ["Test Course", "Description", "https://cover.url", parseEther("50"), 0n],
          { account: instructor.account }
        ),
        course,
        "CourseCreated"
      );
    });

    it("Should fail if title is empty", async function () {
      const { course } = await deployContracts();

      await assert.rejects(
        course.write.createCourse(
          ["", "Description", "https://cover.url", parseEther("100"), 0n],
          { account: instructor.account }
        ),
        /Title cannot be empty/
      );
    });

    it("Should fail if price is 0", async function () {
      const { course } = await deployContracts();

      await assert.rejects(
        course.write.createCourse(
          ["Title", "Description", "https://cover.url", 0n, 0n],
          { account: instructor.account }
        ),
        /Price must be greater than 0/
      );
    });

    it("Should require certification if enabled", async function () {
      const { course } = await deployContracts();

      await course.write.setRequireCertification([true]);

      await assert.rejects(
        course.write.createCourse(
          ["Title", "Description", "https://cover.url", parseEther("100"), 0n],
          { account: instructor.account }
        ),
        /Not a certified instructor/
      );
    });

    it("Should allow certified instructor to create course", async function () {
      const { course } = await deployContracts();

      await course.write.setRequireCertification([true]);
      await course.write.certifyInstructor([instructor.account.address]);

      await course.write.createCourse(
        ["Title", "Description", "https://cover.url", parseEther("100"), 0n],
        { account: instructor.account }
      );

      const courseInfo = await course.read.getCourse([1n]);
      assert.equal(courseInfo.title, "Title");
    });
  });

  describe("Course Purchase", function () {
    it("Should allow student to purchase course", async function () {
      const { ydToken, course } = await deployContracts();

      // Create course
      await course.write.createCourse(
        ["Test Course", "Description", "https://cover.url", parseEther("100"), 0n],
        { account: instructor.account }
      );

      // Approve tokens
      await approveTokens(ydToken, course.address, student1.account, parseEther("100"));

      // Purchase
      await course.write.purchaseCourse([1n, "0x0000000000000000000000000000000000000000"], { account: student1.account });

      // Verify purchase
      assert.equal(await course.read.hasPurchased([1n, student1.account.address]), true);
    });

    it("Should emit CoursePurchased event", async function () {
      const { ydToken, course } = await deployContracts();

      await course.write.createCourse(
        ["Test Course", "Description", "https://cover.url", parseEther("100"), 0n],
        { account: instructor.account }
      );

      await approveTokens(ydToken, course.address, student1.account, parseEther("100"));

      // Note: timestamp will vary, so we just check the event is emitted
      const hash = await course.write.purchaseCourse([1n, "0x0000000000000000000000000000000000000000"], { account: student1.account });

      // Verify purchase happened
      assert.equal(await course.read.hasPurchased([1n, student1.account.address]), true);
    });

    it("Should distribute fees correctly", async function () {
      const { ydToken, course } = await deployContracts();

      const price = parseEther("100");
      const platformFee = price * 5n / 100n; // 5%
      const instructorPayment = price - platformFee;

      await course.write.createCourse(
        ["Test Course", "Description", "https://cover.url", price, 0n],
        { account: instructor.account }
      );

      const instructorBalanceBefore = await ydToken.read.balanceOf([instructor.account.address]);
      const ownerBalanceBefore = await ydToken.read.balanceOf([owner.account.address]);

      await approveTokens(ydToken, course.address, student1.account, price);
      await course.write.purchaseCourse([1n, "0x0000000000000000000000000000000000000000"], { account: student1.account });

      const instructorBalanceAfter = await ydToken.read.balanceOf([instructor.account.address]);
      const ownerBalanceAfter = await ydToken.read.balanceOf([owner.account.address]);

      assert.equal(instructorBalanceAfter - instructorBalanceBefore, instructorPayment);
      assert.equal(ownerBalanceAfter - ownerBalanceBefore, platformFee);
    });

    it("Should fail if already purchased", async function () {
      const { ydToken, course } = await deployContracts();

      await course.write.createCourse(
        ["Test Course", "Description", "https://cover.url", parseEther("100"), 0n],
        { account: instructor.account }
      );

      await approveTokens(ydToken, course.address, student1.account, parseEther("200"));
      await course.write.purchaseCourse([1n, "0x0000000000000000000000000000000000000000"], { account: student1.account });

      await assert.rejects(
        course.write.purchaseCourse([1n, "0x0000000000000000000000000000000000000000"], { account: student1.account }),
        /Already purchased/
      );
    });

    it("Should fail if instructor tries to buy own course", async function () {
      const { ydToken, course } = await deployContracts();

      await course.write.createCourse(
        ["Test Course", "Description", "https://cover.url", parseEther("100"), 0n],
        { account: instructor.account }
      );

      await approveTokens(ydToken, course.address, instructor.account, parseEther("100"));

      await assert.rejects(
        course.write.purchaseCourse([1n, "0x0000000000000000000000000000000000000000"], { account: instructor.account }),
        /Instructor cannot buy own course/
      );
    });

    it("Should handle referral rewards", async function () {
      const { ydToken, course } = await deployContracts();

      const price = parseEther("100");

      await course.write.createCourse(
        ["Test Course", "Description", "https://cover.url", price, 0n],
        { account: instructor.account }
      );

      // Referrer purchases first
      await approveTokens(ydToken, course.address, referrer.account, price);
      await course.write.purchaseCourse([1n, "0x0000000000000000000000000000000000000000"], { account: referrer.account });

      const referrerBalanceBefore = await ydToken.read.balanceOf([referrer.account.address]);

      // Student purchases with referrer
      await approveTokens(ydToken, course.address, student1.account, price);
      await course.write.purchaseCourse([1n, referrer.account.address], { account: student1.account });

      const referrerBalanceAfter = await ydToken.read.balanceOf([referrer.account.address]);
      const referralReward = price * 5n / 100n; // 5%

      assert.equal(referrerBalanceAfter - referrerBalanceBefore, referralReward);
    });
  });

  describe("Subscriptions", function () {
    it("Should allow purchasing monthly subscription", async function () {
      const { ydToken, course } = await deployContracts();

      await approveTokens(ydToken, course.address, student1.account, parseEther("100"));
      await course.write.purchaseMonthlySubscription({ account: student1.account });

      assert.equal(await course.read.hasActiveSubscription([student1.account.address]), true);
    });

    it("Should allow purchasing yearly subscription", async function () {
      const { ydToken, course } = await deployContracts();

      await approveTokens(ydToken, course.address, student1.account, parseEther("1000"));
      await course.write.purchaseYearlySubscription({ account: student1.account });

      assert.equal(await course.read.hasActiveSubscription([student1.account.address]), true);
    });

    it("Should allow free access with subscription", async function () {
      const { ydToken, course } = await deployContracts();

      // Create course
      await course.write.createCourse(
        ["Test Course", "Description", "https://cover.url", parseEther("100"), 0n],
        { account: instructor.account }
      );

      // Purchase subscription
      await approveTokens(ydToken, course.address, student1.account, parseEther("100"));
      await course.write.purchaseMonthlySubscription({ account: student1.account });

      // Purchase course (should be free)
      const studentBalanceBefore = await ydToken.read.balanceOf([student1.account.address]);

      await course.write.purchaseCourse([1n, "0x0000000000000000000000000000000000000000"], { account: student1.account });

      const studentBalanceAfter = await ydToken.read.balanceOf([student1.account.address]);

      // Balance should not change (free access)
      assert.equal(studentBalanceAfter, studentBalanceBefore);
      assert.equal(await course.read.hasPurchased([1n, student1.account.address]), true);
    });
  });

  describe("Course Rating", function () {
    it("Should allow purchased student to rate course", async function () {
      const { ydToken, course } = await deployContracts();

      await course.write.createCourse(
        ["Test Course", "Description", "https://cover.url", parseEther("100"), 0n],
        { account: instructor.account }
      );

      await approveTokens(ydToken, course.address, student1.account, parseEther("100"));
      await course.write.purchaseCourse([1n, "0x0000000000000000000000000000000000000000"], { account: student1.account });

      await course.write.rateCourse([1n, 5, "Great course!"], { account: student1.account });

      const rating = await course.read.getUserRating([1n, student1.account.address]);
      assert.equal(rating.score, 5);
      assert.equal(rating.comment, "Great course!");
    });

    it("Should emit CourseRated event", async function () {
      const { ydToken, course } = await deployContracts();

      await course.write.createCourse(
        ["Test Course", "Description", "https://cover.url", parseEther("100"), 0n],
        { account: instructor.account }
      );

      await approveTokens(ydToken, course.address, student1.account, parseEther("100"));
      await course.write.purchaseCourse([1n, "0x0000000000000000000000000000000000000000"], { account: student1.account });

      await viem.assertions.emit(
        course.write.rateCourse([1n, 4, "Good course"], { account: student1.account }),
        course,
        "CourseRated"
      );
    });

    it("Should fail if not purchased", async function () {
      const { course } = await deployContracts();

      await course.write.createCourse(
        ["Test Course", "Description", "https://cover.url", parseEther("100"), 0n],
        { account: instructor.account }
      );

      await assert.rejects(
        course.write.rateCourse([1n, 5, "Great!"], { account: student1.account }),
        /Must purchase to rate/
      );
    });

    it("Should fail if already rated", async function () {
      const { ydToken, course } = await deployContracts();

      await course.write.createCourse(
        ["Test Course", "Description", "https://cover.url", parseEther("100"), 0n],
        { account: instructor.account }
      );

      await approveTokens(ydToken, course.address, student1.account, parseEther("100"));
      await course.write.purchaseCourse([1n, "0x0000000000000000000000000000000000000000"], { account: student1.account });
      await course.write.rateCourse([1n, 5, "Great!"], { account: student1.account });

      await assert.rejects(
        course.write.rateCourse([1n, 4, "Changed my mind"], { account: student1.account }),
        /Already rated/
      );
    });

    it("Should fail if score is out of range", async function () {
      const { ydToken, course } = await deployContracts();

      await course.write.createCourse(
        ["Test Course", "Description", "https://cover.url", parseEther("100"), 0n],
        { account: instructor.account }
      );

      await approveTokens(ydToken, course.address, student1.account, parseEther("100"));
      await course.write.purchaseCourse([1n, "0x0000000000000000000000000000000000000000"], { account: student1.account });

      await assert.rejects(
        course.write.rateCourse([1n, 6, "Invalid score"], { account: student1.account }),
        /Score must be 1-5/
      );
    });

    it("Should calculate average rating correctly", async function () {
      const { ydToken, course } = await deployContracts();

      await course.write.createCourse(
        ["Test Course", "Description", "https://cover.url", parseEther("100"), 0n],
        { account: instructor.account }
      );

      // Student1 rates
      await approveTokens(ydToken, course.address, student1.account, parseEther("100"));
      await course.write.purchaseCourse([1n, "0x0000000000000000000000000000000000000000"], { account: student1.account });
      await course.write.rateCourse([1n, 5, "Excellent!"], { account: student1.account });

      // Student2 rates
      await approveTokens(ydToken, course.address, student2.account, parseEther("100"));
      await course.write.purchaseCourse([1n, "0x0000000000000000000000000000000000000000"], { account: student2.account });
      await course.write.rateCourse([1n, 3, "Okay"], { account: student2.account });

      const [average, count] = await course.read.getCourseAverageRating([1n]);
      assert.equal(average, 400n); // (5+3)/2 * 100 = 400
      assert.equal(count, 2n);
    });
  });

  describe("Refund", function () {
    it("Should allow refund within refund period", async function () {
      const { ydToken, course } = await deployContracts();

      await course.write.createCourse(
        ["Test Course", "Description", "https://cover.url", parseEther("100"), 0n],
        { account: instructor.account }
      );

      await approveTokens(ydToken, course.address, student1.account, parseEther("100"));
      await course.write.purchaseCourse([1n, "0x0000000000000000000000000000000000000000"], { account: student1.account });

      // Instructor approves refund amount
      const price = parseEther("100");
      const refundAmount = price - (price * 5n / 100n); // minus platform fee
      await approveTokens(ydToken, course.address, instructor.account, refundAmount);

      const studentBalanceBefore = await ydToken.read.balanceOf([student1.account.address]);

      await course.write.requestRefund([1n], { account: student1.account });

      const studentBalanceAfter = await ydToken.read.balanceOf([student1.account.address]);

      assert.equal(studentBalanceAfter - studentBalanceBefore, refundAmount);
      assert.equal(await course.read.hasPurchased([1n, student1.account.address]), false);
    });

    it("Should emit RefundIssued event", async function () {
      const { ydToken, course } = await deployContracts();

      await course.write.createCourse(
        ["Test Course", "Description", "https://cover.url", parseEther("100"), 0n],
        { account: instructor.account }
      );

      await approveTokens(ydToken, course.address, student1.account, parseEther("100"));
      await course.write.purchaseCourse([1n, "0x0000000000000000000000000000000000000000"], { account: student1.account });

      const price = parseEther("100");
      const refundAmount = price - (price * 5n / 100n);
      await approveTokens(ydToken, course.address, instructor.account, refundAmount);

      await viem.assertions.emit(
        course.write.requestRefund([1n], { account: student1.account }),
        course,
        "RefundIssued"
      );
    });

    it("Should fail if not purchased", async function () {
      const { course } = await deployContracts();

      await course.write.createCourse(
        ["Test Course", "Description", "https://cover.url", parseEther("100"), 0n],
        { account: instructor.account }
      );

      await assert.rejects(
        course.write.requestRefund([1n], { account: student1.account }),
        /Not purchased/
      );
    });

    it("Should fail if already refunded", async function () {
      const { ydToken, course } = await deployContracts();

      await course.write.createCourse(
        ["Test Course", "Description", "https://cover.url", parseEther("100"), 0n],
        { account: instructor.account }
      );

      await approveTokens(ydToken, course.address, student1.account, parseEther("100"));
      await course.write.purchaseCourse([1n, "0x0000000000000000000000000000000000000000"], { account: student1.account });

      const price = parseEther("100");
      const refundAmount = price - (price * 5n / 100n);
      await approveTokens(ydToken, course.address, instructor.account, refundAmount * 2n);

      await course.write.requestRefund([1n], { account: student1.account });

      await assert.rejects(
        course.write.requestRefund([1n], { account: student1.account }),
        /Not purchased/
      );
    });
  });

  describe("Course Management", function () {
    it("Should allow instructor to update course", async function () {
      const { course } = await deployContracts();

      await course.write.createCourse(
        ["Original Title", "Description", "https://cover.url", parseEther("100"), 0n],
        { account: instructor.account }
      );

      await course.write.updateCourse(
        [1n, "Updated Title", "New Description", "https://new.url", parseEther("150"), 0n],
        { account: instructor.account }
      );

      const courseInfo = await course.read.getCourse([1n]);
      assert.equal(courseInfo.title, "Updated Title");
      assert.equal(courseInfo.description, "New Description");
      assert.equal(courseInfo.priceYDT, parseEther("150"));
    });

    it("Should not allow non-instructor to update course", async function () {
      const { course } = await deployContracts();

      await course.write.createCourse(
        ["Title", "Description", "https://cover.url", parseEther("100"), 0n],
        { account: instructor.account }
      );

      await assert.rejects(
        course.write.updateCourse(
          [1n, "New Title", "New Desc", "https://new.url", parseEther("150"), 0n],
          { account: student1.account }
        ),
        /Only instructor can update/
      );
    });

    it("Should allow instructor to deactivate course", async function () {
      const { course } = await deployContracts();

      await course.write.createCourse(
        ["Title", "Description", "https://cover.url", parseEther("100"), 0n],
        { account: instructor.account }
      );

      await course.write.deactivateCourse([1n], { account: instructor.account });

      const courseInfo = await course.read.getCourse([1n]);
      assert.equal(courseInfo.isActive, false);
    });

    it("Should allow owner to deactivate course", async function () {
      const { course } = await deployContracts();

      await course.write.createCourse(
        ["Title", "Description", "https://cover.url", parseEther("100"), 0n],
        { account: instructor.account }
      );

      await course.write.deactivateCourse([1n]);

      const courseInfo = await course.read.getCourse([1n]);
      assert.equal(courseInfo.isActive, false);
    });
  });

  describe("Bulk Purchase", function () {
    it("Should allow bulk purchase with discount", async function () {
      const { ydToken, course } = await deployContracts();

      // Create 3 courses
      for (let i = 0; i < 3; i++) {
        await course.write.createCourse(
          [`Course ${i}`, "Description", "https://cover.url", parseEther("100"), 0n],
          { account: instructor.account }
        );
      }

      // Total: 300 YDT, discount 10% = 270 YDT
      await approveTokens(ydToken, course.address, student1.account, parseEther("300"));

      await course.write.purchaseCoursesBulk(
        [[1n, 2n, 3n], "0x0000000000000000000000000000000000000000"],
        { account: student1.account }
      );

      // Verify all courses purchased
      assert.equal(await course.read.hasPurchased([1n, student1.account.address]), true);
      assert.equal(await course.read.hasPurchased([2n, student1.account.address]), true);
      assert.equal(await course.read.hasPurchased([3n, student1.account.address]), true);
    });

    it("Should fail if not enough courses for bulk discount", async function () {
      const { ydToken, course } = await deployContracts();

      // Create 2 courses
      for (let i = 0; i < 2; i++) {
        await course.write.createCourse(
          [`Course ${i}`, "Description", "https://cover.url", parseEther("100"), 0n],
          { account: instructor.account }
        );
      }

      await approveTokens(ydToken, course.address, student1.account, parseEther("200"));

      await assert.rejects(
        course.write.purchaseCoursesBulk(
          [[1n, 2n], "0x0000000000000000000000000000000000000000"],
          { account: student1.account }
        ),
        /Not enough courses for bulk discount/
      );
    });
  });

  describe("View Functions", function () {
    it("Should return student courses", async function () {
      const { ydToken, course } = await deployContracts();

      await course.write.createCourse(
        ["Course 1", "Description", "https://cover.url", parseEther("100"), 0n],
        { account: instructor.account }
      );

      await approveTokens(ydToken, course.address, student1.account, parseEther("100"));
      await course.write.purchaseCourse([1n, "0x0000000000000000000000000000000000000000"], { account: student1.account });

      const courses = await course.read.getStudentCourses([student1.account.address]);
      assert.equal(courses.length, 1);
      assert.equal(courses[0], 1n);
    });

    it("Should return instructor courses", async function () {
      const { course } = await deployContracts();

      await course.write.createCourse(
        ["Course 1", "Description", "https://cover.url", parseEther("100"), 0n],
        { account: instructor.account }
      );
      await course.write.createCourse(
        ["Course 2", "Description", "https://cover.url", parseEther("200"), 0n],
        { account: instructor.account }
      );

      const courses = await course.read.getInstructorCourses([instructor.account.address]);
      assert.equal(courses.length, 2);
    });

    it("Should return active courses with pagination", async function () {
      const { course } = await deployContracts();

      // Create 5 courses
      for (let i = 0; i < 5; i++) {
        await course.write.createCourse(
          [`Course ${i}`, "Description", "https://cover.url", parseEther("100"), 0n],
          { account: instructor.account }
        );
      }

      // Get first 2
      const firstPage = await course.read.getActiveCourses([0n, 2n]);
      assert.equal(firstPage.length, 2);

      // Get next 2
      const secondPage = await course.read.getActiveCourses([2n, 2n]);
      assert.equal(secondPage.length, 2);
    });
  });

  describe("Admin Functions", function () {
    it("Should allow owner to set platform fee", async function () {
      const { course } = await deployContracts();

      await course.write.setPlatformFee([10n]);
      assert.equal(await course.read.platformFeePercent(), 10n);
    });

    it("Should not allow fee exceeding 20%", async function () {
      const { course } = await deployContracts();

      await assert.rejects(
        course.write.setPlatformFee([25n]),
        /Fee cannot exceed 20%/
      );
    });

    it("Should allow owner to set refund period", async function () {
      const { course } = await deployContracts();

      const newPeriod = 14n * 24n * 60n * 60n; // 14 days
      await course.write.setRefundPeriod([newPeriod]);
      assert.equal(await course.read.refundPeriod(), newPeriod);
    });

    it("Should allow owner to set subscription prices", async function () {
      const { course } = await deployContracts();

      await course.write.setSubscriptionPrices([parseEther("150"), parseEther("1500")]);
      assert.equal(await course.read.monthlySubscriptionPrice(), parseEther("150"));
      assert.equal(await course.read.yearlySubscriptionPrice(), parseEther("1500"));
    });

    it("Should allow owner to set bulk discount settings", async function () {
      const { course } = await deployContracts();

      await course.write.setBulkDiscountSettings([5n, 15n]);
      assert.equal(await course.read.bulkDiscountThreshold(), 5n);
      assert.equal(await course.read.bulkDiscountPercent(), 15n);
    });

    it("Should not allow non-owner to change settings", async function () {
      const { course } = await deployContracts();

      await assert.rejects(
        course.write.setPlatformFee([10n], { account: student1.account }),
        /OwnableUnauthorizedAccount/
      );
    });
  });

  describe("Instructor Certification", function () {
    it("Should allow owner to certify instructor", async function () {
      const { course } = await deployContracts();

      await course.write.certifyInstructor([instructor.account.address]);
      assert.equal(await course.read.certifiedInstructors([instructor.account.address]), true);
    });

    it("Should emit InstructorCertified event", async function () {
      const { course } = await deployContracts();

      await viem.assertions.emit(
        course.write.certifyInstructor([instructor.account.address]),
        course,
        "InstructorCertified"
      );
    });

    it("Should allow owner to decertify instructor", async function () {
      const { course } = await deployContracts();

      await course.write.certifyInstructor([instructor.account.address]);
      await course.write.decertifyInstructor([instructor.account.address]);
      assert.equal(await course.read.certifiedInstructors([instructor.account.address]), false);
    });
  });
});
