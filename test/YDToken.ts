import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { network } from "hardhat";
import { parseEther, formatEther } from "viem";

describe("YDToken", async function () {
  const { viem } = await network.connect();
  const publicClient = await viem.getPublicClient();
  const [owner, user1, user2] = await viem.getWalletClients();

  // Helper to deploy contract
  async function deployYDToken() {
    const ydToken = await viem.deployContract("YDToken");
    return ydToken;
  }

  describe("Deployment", function () {
    it("Should set the correct name and symbol", async function () {
      const ydToken = await deployYDToken();

      assert.equal(await ydToken.read.name(), "YDToken");
      assert.equal(await ydToken.read.symbol(), "YD");
    });

    it("Should mint initial supply to deployer", async function () {
      const ydToken = await deployYDToken();
      const initialSupply = parseEther("1000000"); // 1,000,000 YDToken

      assert.equal(await ydToken.read.balanceOf([owner.account.address]), initialSupply);
    });

    it("Should set correct exchange rate", async function () {
      const ydToken = await deployYDToken();

      assert.equal(await ydToken.read.EXCHANGE_RATE(), 10000n);
    });

    it("Should set correct purchase limits", async function () {
      const ydToken = await deployYDToken();

      assert.equal(await ydToken.read.minPurchaseLimit(), parseEther("0.001"));
      assert.equal(await ydToken.read.maxPurchaseLimit(), parseEther("100"));
    });
  });

  describe("Buy YDToken", function () {
    it("Should allow buying tokens with ETH", async function () {
      const ydToken = await deployYDToken();

      // Owner transfers tokens to contract for sale
      const transferAmount = parseEther("100000");
      await ydToken.write.transfer([ydToken.address, transferAmount]);

      // User1 buys tokens
      const ethAmount = parseEther("1");
      const expectedTokens = ethAmount * 10000n;

      const initialBalance = await ydToken.read.balanceOf([user1.account.address]);

      await ydToken.write.buyYDToken({ value: ethAmount, account: user1.account });

      const finalBalance = await ydToken.read.balanceOf([user1.account.address]);
      assert.equal(finalBalance - initialBalance, expectedTokens);
    });

    it("Should emit YDTokenPurchased event", async function () {
      const ydToken = await deployYDToken();

      await ydToken.write.transfer([ydToken.address, parseEther("100000")]);

      const ethAmount = parseEther("1");

      await viem.assertions.emit(
        ydToken.write.buyYDToken({ value: ethAmount, account: user1.account }),
        ydToken,
        "YDTokenPurchased"
      );
    });

    it("Should fail if ETH amount is 0", async function () {
      const ydToken = await deployYDToken();

      await assert.rejects(
        ydToken.write.buyYDToken({ value: 0n, account: user1.account }),
        /ETH amount must be greater than 0/
      );
    });

    it("Should fail if below minimum purchase limit", async function () {
      const ydToken = await deployYDToken();

      await assert.rejects(
        ydToken.write.buyYDToken({ value: parseEther("0.0001"), account: user1.account }),
        /Below minimum purchase limit/
      );
    });

    it("Should fail if exceeds maximum purchase limit", async function () {
      const ydToken = await deployYDToken();

      await assert.rejects(
        ydToken.write.buyYDToken({ value: parseEther("101"), account: user1.account }),
        /Exceeds maximum purchase limit/
      );
    });

    it("Should fail if contract has insufficient tokens", async function () {
      const ydToken = await deployYDToken();

      // Don't transfer tokens to contract
      await assert.rejects(
        ydToken.write.buyYDToken({ value: parseEther("1"), account: user1.account }),
        /Not enough YDToken in contract/
      );
    });
  });

  describe("Sell YDToken", function () {
    it("Should allow selling tokens for ETH", async function () {
      const ydToken = await deployYDToken();

      // Setup: transfer tokens to contract and add ETH
      await ydToken.write.transfer([ydToken.address, parseEther("100000")]);
      await owner.sendTransaction({ to: ydToken.address, value: parseEther("10") });

      // User1 buys tokens first
      await ydToken.write.buyYDToken({ value: parseEther("1"), account: user1.account });

      // User1 sells tokens
      const tokensToSell = parseEther("5000"); // 5000 YDT = 0.5 ETH

      const initialTokenBalance = await ydToken.read.balanceOf([user1.account.address]);
      await ydToken.write.sellYDToken([tokensToSell], { account: user1.account });
      const finalTokenBalance = await ydToken.read.balanceOf([user1.account.address]);

      assert.equal(initialTokenBalance - finalTokenBalance, tokensToSell);
    });

    it("Should emit YDTokenSold event", async function () {
      const ydToken = await deployYDToken();

      await ydToken.write.transfer([ydToken.address, parseEther("100000")]);
      await owner.sendTransaction({ to: ydToken.address, value: parseEther("10") });
      await ydToken.write.buyYDToken({ value: parseEther("1"), account: user1.account });

      const tokensToSell = parseEther("5000");

      await viem.assertions.emit(
        ydToken.write.sellYDToken([tokensToSell], { account: user1.account }),
        ydToken,
        "YDTokenSold"
      );
    });

    it("Should fail if token amount is 0", async function () {
      const ydToken = await deployYDToken();

      await assert.rejects(
        ydToken.write.sellYDToken([0n], { account: user1.account }),
        /YDToken amount must be greater than 0/
      );
    });

    it("Should fail if user has insufficient tokens", async function () {
      const ydToken = await deployYDToken();

      await assert.rejects(
        ydToken.write.sellYDToken([parseEther("1000")], { account: user1.account }),
        /Not enough YDToken to sell/
      );
    });

    it("Should fail if contract has insufficient ETH", async function () {
      const ydToken = await deployYDToken();

      // Transfer tokens directly to user1 (not through buying)
      await ydToken.write.transfer([user1.account.address, parseEther("10000")]);

      // Contract has no ETH
      await assert.rejects(
        ydToken.write.sellYDToken([parseEther("10000")], { account: user1.account }),
        /Not enough ETH in contract/
      );
    });
  });

  describe("Owner Functions", function () {
    it("Should allow owner to withdraw ETH", async function () {
      const ydToken = await deployYDToken();

      // Send ETH to contract
      await owner.sendTransaction({ to: ydToken.address, value: parseEther("5") });

      const initialContractBalance = await publicClient.getBalance({ address: ydToken.address });
      assert.equal(initialContractBalance, parseEther("5"));

      await ydToken.write.withdrawETH();

      const finalContractBalance = await publicClient.getBalance({ address: ydToken.address });
      assert.equal(finalContractBalance, 0n);
    });

    it("Should not allow non-owner to withdraw ETH", async function () {
      const ydToken = await deployYDToken();

      await owner.sendTransaction({ to: ydToken.address, value: parseEther("5") });

      await assert.rejects(
        ydToken.write.withdrawETH({ account: user1.account }),
        /OwnableUnauthorizedAccount/
      );
    });

    it("Should allow owner to set purchase limits", async function () {
      const ydToken = await deployYDToken();

      const newMin = parseEther("0.01");
      const newMax = parseEther("50");

      await ydToken.write.setPurchaseLimits([newMin, newMax]);

      assert.equal(await ydToken.read.minPurchaseLimit(), newMin);
      assert.equal(await ydToken.read.maxPurchaseLimit(), newMax);
    });

    it("Should emit PurchaseLimitUpdated event", async function () {
      const ydToken = await deployYDToken();

      const newMin = parseEther("0.01");
      const newMax = parseEther("50");

      await viem.assertions.emitWithArgs(
        ydToken.write.setPurchaseLimits([newMin, newMax]),
        ydToken,
        "PurchaseLimitUpdated",
        [newMin, newMax]
      );
    });

    it("Should fail if min >= max", async function () {
      const ydToken = await deployYDToken();

      await assert.rejects(
        ydToken.write.setPurchaseLimits([parseEther("10"), parseEther("5")]),
        /Min must be less than max/
      );
    });

    it("Should not allow non-owner to set purchase limits", async function () {
      const ydToken = await deployYDToken();

      await assert.rejects(
        ydToken.write.setPurchaseLimits([parseEther("0.01"), parseEther("50")], { account: user1.account }),
        /OwnableUnauthorizedAccount/
      );
    });
  });

  describe("Pause/Unpause", function () {
    it("Should allow owner to pause", async function () {
      const ydToken = await deployYDToken();

      await ydToken.write.pause();
      assert.equal(await ydToken.read.paused(), true);
    });

    it("Should allow owner to unpause", async function () {
      const ydToken = await deployYDToken();

      await ydToken.write.pause();
      await ydToken.write.unpause();
      assert.equal(await ydToken.read.paused(), false);
    });

    it("Should prevent buying when paused", async function () {
      const ydToken = await deployYDToken();

      await ydToken.write.transfer([ydToken.address, parseEther("100000")]);
      await ydToken.write.pause();

      await assert.rejects(
        ydToken.write.buyYDToken({ value: parseEther("1"), account: user1.account }),
        /EnforcedPause/
      );
    });

    it("Should prevent selling when paused", async function () {
      const ydToken = await deployYDToken();

      await ydToken.write.transfer([user1.account.address, parseEther("10000")]);
      await owner.sendTransaction({ to: ydToken.address, value: parseEther("10") });
      await ydToken.write.pause();

      await assert.rejects(
        ydToken.write.sellYDToken([parseEther("1000")], { account: user1.account }),
        /EnforcedPause/
      );
    });

    it("Should not allow non-owner to pause", async function () {
      const ydToken = await deployYDToken();

      await assert.rejects(
        ydToken.write.pause({ account: user1.account }),
        /OwnableUnauthorizedAccount/
      );
    });
  });

  describe("Helper Functions", function () {
    it("Should calculate correct token amount for ETH", async function () {
      const ydToken = await deployYDToken();

      const ethAmount = parseEther("1");
      const expectedTokens = ethAmount * 10000n;

      assert.equal(await ydToken.read.getTokenAmount([ethAmount]), expectedTokens);
    });

    it("Should calculate correct ETH amount for tokens", async function () {
      const ydToken = await deployYDToken();

      const tokenAmount = parseEther("10000");
      const expectedEth = tokenAmount / 10000n;

      assert.equal(await ydToken.read.getETHAmount([tokenAmount]), expectedEth);
    });
  });

  describe("Receive ETH", function () {
    it("Should accept ETH via receive function", async function () {
      const ydToken = await deployYDToken();

      const initialBalance = await publicClient.getBalance({ address: ydToken.address });

      await owner.sendTransaction({ to: ydToken.address, value: parseEther("1") });

      const finalBalance = await publicClient.getBalance({ address: ydToken.address });
      assert.equal(finalBalance - initialBalance, parseEther("1"));
    });
  });
});
