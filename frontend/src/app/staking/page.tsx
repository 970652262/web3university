"use client";

import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import {
  useYDTBalance,
  useStakeInfo,
  useStakingStats,
  useStake,
  useUnstake,
  useClaimRewards,
  useApproveStaking,
  useStakingAllowance,
} from "@/hooks";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { formatYDT } from "@/lib/utils";

export default function StakingPage() {
  const { address, isConnected } = useAccount();
  const [stakeAmount, setStakeAmount] = useState("");
  const [unstakeAmount, setUnstakeAmount] = useState("");
  const [activeTab, setActiveTab] = useState<"stake" | "unstake">("stake");

  // 数据获取
  const { balance, refetch: refetchBalance } = useYDTBalance(address);
  const { stakeInfo, refetch: refetchStakeInfo } = useStakeInfo(address);
  const { stats, refetch: refetchStats } = useStakingStats();
  const { allowance, refetch: refetchAllowance } = useStakingAllowance(address);

  // 操作 hooks
  const {
    approve,
    isPending: isApproving,
    isConfirming: isApproveConfirming,
    isSuccess: isApproveSuccess,
    reset: resetApprove,
  } = useApproveStaking();

  const {
    stake,
    isPending: isStaking,
    isConfirming: isStakeConfirming,
    isSuccess: isStakeSuccess,
    reset: resetStake,
  } = useStake();

  const {
    unstake,
    isPending: isUnstaking,
    isConfirming: isUnstakeConfirming,
    isSuccess: isUnstakeSuccess,
    reset: resetUnstake,
  } = useUnstake();

  const {
    claimRewards,
    isPending: isClaiming,
    isConfirming: isClaimConfirming,
    isSuccess: isClaimSuccess,
    reset: resetClaim,
  } = useClaimRewards();

  // 授权成功后自动质押
  useEffect(() => {
    if (isApproveSuccess && stakeAmount) {
      const amount = BigInt(parseFloat(stakeAmount) * 10 ** 18);
      stake(amount);
      resetApprove();
    }
  }, [isApproveSuccess, stakeAmount, stake, resetApprove]);

  // 操作成功后刷新数据
  useEffect(() => {
    if (isStakeSuccess || isUnstakeSuccess || isClaimSuccess) {
      refetchBalance();
      refetchStakeInfo();
      refetchStats();
      refetchAllowance();
      setStakeAmount("");
      setUnstakeAmount("");
      resetStake();
      resetUnstake();
      resetClaim();
    }
  }, [
    isStakeSuccess,
    isUnstakeSuccess,
    isClaimSuccess,
    refetchBalance,
    refetchStakeInfo,
    refetchStats,
    refetchAllowance,
    resetStake,
    resetUnstake,
    resetClaim,
  ]);

  const handleStake = () => {
    if (!stakeAmount) return;
    const amount = BigInt(parseFloat(stakeAmount) * 10 ** 18);

    // 检查授权
    if (!allowance || allowance < amount) {
      approve(amount);
    } else {
      stake(amount);
    }
  };

  const handleUnstake = () => {
    if (!unstakeAmount) return;
    const amount = BigInt(parseFloat(unstakeAmount) * 10 ** 18);
    unstake(amount);
  };

  const handleClaimRewards = () => {
    claimRewards();
  };

  const formatDuration = (seconds: bigint) => {
    const days = Number(seconds) / 86400;
    if (days >= 1) {
      return `${Math.floor(days)} 天`;
    }
    const hours = Number(seconds) / 3600;
    if (hours >= 1) {
      return `${Math.floor(hours)} 小时`;
    }
    const minutes = Number(seconds) / 60;
    return `${Math.floor(minutes)} 分钟`;
  };

  const calculateAPY = () => {
    if (!stats) return "0";
    return (Number(stats.annualRewardRate) / 100).toFixed(2);
  };

  if (!isConnected) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-20">
          <h2 className="text-2xl font-bold mb-4">YDT 质押</h2>
          <p className="text-muted-foreground mb-8">请先连接钱包以使用质押功能</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">YDT 质押</h1>

      {/* 统计概览 */}
      <div className="grid md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              总质押量
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {stats ? formatYDT(stats.totalStaked) : "0"} YDT
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              奖励池
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {stats ? formatYDT(stats.rewardPool) : "0"} YDT
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              年化收益率
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-500">{calculateAPY()}%</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              最短锁定期
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {stats ? formatDuration(stats.minStakeDuration) : "7 天"}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* 我的质押 */}
        <Card>
          <CardHeader>
            <CardTitle>我的质押</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">钱包余额</p>
                <p className="text-xl font-semibold">
                  {balance ? formatYDT(balance) : "0"} YDT
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">已质押</p>
                <p className="text-xl font-semibold">
                  {stakeInfo ? formatYDT(stakeInfo.amount) : "0"} YDT
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">质押时长</p>
                <p className="text-xl font-semibold">
                  {stakeInfo && stakeInfo.stakeDuration > BigInt(0)
                    ? formatDuration(stakeInfo.stakeDuration)
                    : "-"}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">待领取奖励</p>
                <p className="text-xl font-semibold text-green-500">
                  {stakeInfo ? formatYDT(stakeInfo.pendingRewards) : "0"} YDT
                </p>
              </div>
            </div>

            {stakeInfo && stakeInfo.pendingRewards > BigInt(0) && (
              <Button
                onClick={handleClaimRewards}
                disabled={isClaiming || isClaimConfirming}
                className="w-full"
              >
                {isClaiming || isClaimConfirming ? "处理中..." : "领取奖励"}
              </Button>
            )}

            {stakeInfo && stakeInfo.amount > BigInt(0) && !stakeInfo.canUnstake && (
              <p className="text-sm text-yellow-500 text-center">
                锁定期未满，暂不能解除质押
              </p>
            )}
          </CardContent>
        </Card>

        {/* 质押操作 */}
        <Card>
          <CardHeader>
            <div className="flex gap-4 border-b">
              <button
                className={`pb-2 px-1 text-sm font-medium transition-colors ${activeTab === "stake"
                  ? "border-b-2 border-primary text-foreground"
                  : "text-muted-foreground hover:text-foreground"
                  }`}
                onClick={() => setActiveTab("stake")}
              >
                质押
              </button>
              <button
                className={`pb-2 px-1 text-sm font-medium transition-colors ${activeTab === "unstake"
                  ? "border-b-2 border-primary text-foreground"
                  : "text-muted-foreground hover:text-foreground"
                  }`}
                onClick={() => setActiveTab("unstake")}
              >
                解除质押
              </button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {activeTab === "stake" ? (
              <>
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    质押数量
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={stakeAmount}
                      onChange={(e) => setStakeAmount(e.target.value)}
                      placeholder={`最小 ${stats ? formatYDT(stats.minStakeAmount) : "100"} YDT`}
                      className="flex-1 px-3 py-2 border rounded-md bg-background"
                    />
                    <Button
                      variant="outline"
                      onClick={() =>
                        setStakeAmount(
                          balance ? (Number(balance) / 10 ** 18).toString() : "0"
                        )
                      }
                    >
                      最大
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    可用余额: {balance ? formatYDT(balance) : "0"} YDT
                  </p>
                </div>

                <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">最小质押</span>
                    <span>{stats ? formatYDT(stats.minStakeAmount) : "100"} YDT</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">最大质押</span>
                    <span>
                      {stats ? formatYDT(stats.maxStakeAmount) : "1,000,000"} YDT
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">锁定期</span>
                    <span>
                      {stats ? formatDuration(stats.minStakeDuration) : "7 天"}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">预估年收益</span>
                    <span className="text-green-500">{calculateAPY()}%</span>
                  </div>
                </div>

                <Button
                  onClick={handleStake}
                  disabled={
                    !stakeAmount ||
                    isApproving ||
                    isApproveConfirming ||
                    isStaking ||
                    isStakeConfirming
                  }
                  className="w-full"
                >
                  {isApproving || isApproveConfirming
                    ? "授权中..."
                    : isStaking || isStakeConfirming
                      ? "质押中..."
                      : "质押 YDT"}
                </Button>
              </>
            ) : (
              <>
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    解除质押数量
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={unstakeAmount}
                      onChange={(e) => setUnstakeAmount(e.target.value)}
                      placeholder="输入数量"
                      className="flex-1 px-3 py-2 border rounded-md bg-background"
                    />
                    <Button
                      variant="outline"
                      onClick={() =>
                        setUnstakeAmount(
                          stakeInfo
                            ? (Number(stakeInfo.amount) / 10 ** 18).toString()
                            : "0"
                        )
                      }
                    >
                      最大
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    已质押: {stakeInfo ? formatYDT(stakeInfo.amount) : "0"} YDT
                  </p>
                </div>

                <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">解除质押数量</span>
                    <span>{unstakeAmount || "0"} YDT</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">待领取奖励</span>
                    <span className="text-green-500">
                      +{stakeInfo ? formatYDT(stakeInfo.pendingRewards) : "0"} YDT
                    </span>
                  </div>
                  <div className="border-t pt-2 flex justify-between text-sm font-medium">
                    <span>总计到账</span>
                    <span>
                      {stakeInfo
                        ? formatYDT(
                          BigInt(
                            Math.floor(parseFloat(unstakeAmount || "0") * 10 ** 18)
                          ) + stakeInfo.pendingRewards
                        )
                        : "0"}{" "}
                      YDT
                    </span>
                  </div>
                </div>

                <Button
                  onClick={handleUnstake}
                  disabled={
                    !unstakeAmount ||
                    isUnstaking ||
                    isUnstakeConfirming ||
                    (stakeInfo && !stakeInfo.canUnstake)
                  }
                  className="w-full"
                >
                  {isUnstaking || isUnstakeConfirming
                    ? "处理中..."
                    : stakeInfo && !stakeInfo.canUnstake
                      ? "锁定期未满"
                      : "解除质押"}
                </Button>

                {stakeInfo && !stakeInfo.canUnstake && (
                  <p className="text-xs text-yellow-500 text-center">
                    质押锁定期未满，暂时无法解除质押
                  </p>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 质押说明 */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>质押说明</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>1. 质押 YDT 代币可以获得年化收益，收益按秒计算</li>
            <li>2. 质押有最短锁定期，锁定期内无法解除质押</li>
            <li>3. 可以随时领取已产生的奖励，无需解除质押</li>
            <li>4. 解除质押时会自动发放所有待领取的奖励</li>
            <li>5. 奖励从奖励池发放，如果奖励池余额不足，可能无法获得全部奖励</li>
            <li>
              6. 每个地址最小质押 {stats ? formatYDT(stats.minStakeAmount) : "100"}{" "}
              YDT，最大质押 {stats ? formatYDT(stats.maxStakeAmount) : "1,000,000"}{" "}
              YDT
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
