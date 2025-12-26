"use client";

import { useEffect } from "react";
import { useAccount, useBalance } from "wagmi";
import { formatEther } from "viem";
import Link from "next/link";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import {
  useYDTBalance,
  useStudentCourses,
  useInstructorCourses,
  useUserCertificates,
  useSubscription,
  useReferralRewards,
  useIsCertifiedInstructor,
  usePlatformConfig,
  usePurchaseMonthlySubscription,
  usePurchaseYearlySubscription,
  useApproveYDT,
  useYDTAllowance,
  useContracts,
} from "@/hooks";
import { formatPrice, truncateAddress, formatDate } from "@/lib/utils";

export default function ProfilePage() {
  const { address, isConnected } = useAccount();
  const { data: ethBalance } = useBalance({ address });
  const { course: courseContract } = useContracts();

  // 用户数据
  const { balance: ydtBalance, formatted: ydtFormatted, refetch: refetchYDT } = useYDTBalance(address);
  const { courses: purchasedCourses } = useStudentCourses(address);
  const { courses: createdCourses } = useInstructorCourses(address);
  const { certificates } = useUserCertificates(address);
  const { subscription, isActive: hasActiveSubscription, refetch: refetchSub } = useSubscription(address);
  const { rewards } = useReferralRewards(address);
  const { isCertified } = useIsCertifiedInstructor(address);

  // 平台配置
  const config = usePlatformConfig();

  // 订阅操作
  const { allowance, refetch: refetchAllowance } = useYDTAllowance(address, courseContract.address);
  const { approve, isPending: approving, isSuccess: approveSuccess } = useApproveYDT();
  const { purchaseMonthly, isPending: buyingMonthly, isSuccess: monthlySuccess } = usePurchaseMonthlySubscription();
  const { purchaseYearly, isPending: buyingYearly, isSuccess: yearlySuccess } = usePurchaseYearlySubscription();

  // 刷新数据
  useEffect(() => {
    if (approveSuccess) {
      refetchAllowance();
    }
  }, [approveSuccess, refetchAllowance]);

  useEffect(() => {
    if (monthlySuccess || yearlySuccess) {
      refetchSub();
      refetchYDT();
    }
  }, [monthlySuccess, yearlySuccess, refetchSub, refetchYDT]);

  // 未连接钱包
  if (!isConnected) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <div className="max-w-md mx-auto">
          <div className="text-6xl mb-6">👤</div>
          <h1 className="text-2xl font-bold mb-4">用户中心</h1>
          <p className="text-muted-foreground mb-6">
            连接钱包查看你的账户信息
          </p>
          <ConnectButton />
        </div>
      </div>
    );
  }

  const monthlyPrice = config.monthlySubscriptionPrice || 0n;
  const yearlyPrice = config.yearlySubscriptionPrice || 0n;
  const needsApprovalMonthly = monthlyPrice > (allowance || 0n);
  const needsApprovalYearly = yearlyPrice > (allowance || 0n);

  // 计算订阅剩余时间
  const getSubscriptionRemaining = () => {
    if (!subscription || !hasActiveSubscription) return null;
    const now = BigInt(Math.floor(Date.now() / 1000));
    const remaining = Number(subscription.endTime - now);
    const days = Math.floor(remaining / 86400);
    const hours = Math.floor((remaining % 86400) / 3600);
    return `${days} 天 ${hours} 小时`;
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* 页面标题 */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">用户中心</h1>
        <p className="text-muted-foreground">
          管理你的账户、订阅和资产
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* 左侧：主要内容 */}
        <div className="lg:col-span-2 space-y-6">
          {/* 账户信息 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">账户信息</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                {/* 头像 */}
                <div className="w-16 h-16 rounded-full bg-linear-to-br from-primary to-secondary flex items-center justify-center text-white text-2xl font-bold">
                  {address?.slice(2, 4).toUpperCase()}
                </div>
                <div className="flex-1">
                  <p className="font-mono text-sm">{address}</p>
                  <div className="flex items-center gap-2 mt-1">
                    {isCertified && (
                      <span className="text-xs px-2 py-0.5 bg-green-500/10 text-green-600 rounded-full">
                        认证讲师
                      </span>
                    )}
                    {hasActiveSubscription && (
                      <span className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded-full">
                        订阅会员
                      </span>
                    )}
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    navigator.clipboard.writeText(address || "");
                    alert("地址已复制！");
                  }}
                >
                  复制地址
                </Button>
              </div>

              {/* 余额 */}
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
                <div>
                  <p className="text-sm text-muted-foreground">ETH 余额</p>
                  <p className="text-xl font-bold">
                    {ethBalance ? parseFloat(formatEther(ethBalance.value)).toFixed(4) : "0"} ETH
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">YDT 余额</p>
                  <p className="text-xl font-bold text-primary">
                    {parseFloat(ydtFormatted).toLocaleString()} YDT
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 统计概览 */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-primary">{purchasedCourses.length}</p>
                <p className="text-sm text-muted-foreground">已购课程</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-primary">{certificates.length}</p>
                <p className="text-sm text-muted-foreground">获得证书</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-primary">{createdCourses.length}</p>
                <p className="text-sm text-muted-foreground">创建课程</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-primary">{formatPrice(rewards)}</p>
                <p className="text-sm text-muted-foreground">推荐奖励</p>
              </CardContent>
            </Card>
          </div>

          {/* 订阅管理 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">订阅管理</CardTitle>
            </CardHeader>
            <CardContent>
              {hasActiveSubscription ? (
                <div className="space-y-4">
                  <div className="p-4 bg-primary/10 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-primary">订阅会员</span>
                      <span className="text-xs bg-primary text-white px-2 py-1 rounded-full">
                        活跃中
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      剩余时间: {getSubscriptionRemaining()}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      到期时间: {subscription ? formatDate(subscription.endTime) : "-"}
                    </p>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    订阅期间可免费学习所有课程
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-muted-foreground">
                    订阅后可免费学习平台所有课程
                  </p>

                  {/* 月度订阅 */}
                  <div className="p-4 border border-border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="font-medium">月度订阅</p>
                        <p className="text-sm text-muted-foreground">30 天有效期</p>
                      </div>
                      <p className="text-xl font-bold text-primary">
                        {formatPrice(monthlyPrice)} YDT
                      </p>
                    </div>
                    {needsApprovalMonthly ? (
                      <Button
                        className="w-full"
                        onClick={() => approve(courseContract.address, monthlyPrice)}
                        isLoading={approving}
                      >
                        授权 YDT
                      </Button>
                    ) : (
                      <Button
                        className="w-full"
                        onClick={purchaseMonthly}
                        isLoading={buyingMonthly}
                        disabled={(ydtBalance || 0n) < monthlyPrice}
                      >
                        {(ydtBalance || 0n) < monthlyPrice ? "余额不足" : "订阅"}
                      </Button>
                    )}
                  </div>

                  {/* 年度订阅 */}
                  <div className="p-4 border-2 border-primary rounded-lg relative">
                    <div className="absolute -top-3 left-4 bg-primary text-white text-xs px-2 py-1 rounded">
                      推荐
                    </div>
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="font-medium">年度订阅</p>
                        <p className="text-sm text-muted-foreground">365 天有效期</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold text-primary">
                          {formatPrice(yearlyPrice)} YDT
                        </p>
                        <p className="text-xs text-green-600">省 17%</p>
                      </div>
                    </div>
                    {needsApprovalYearly ? (
                      <Button
                        className="w-full"
                        onClick={() => approve(courseContract.address, yearlyPrice)}
                        isLoading={approving}
                      >
                        授权 YDT
                      </Button>
                    ) : (
                      <Button
                        className="w-full"
                        onClick={purchaseYearly}
                        isLoading={buyingYearly}
                        disabled={(ydtBalance || 0n) < yearlyPrice}
                      >
                        {(ydtBalance || 0n) < yearlyPrice ? "余额不足" : "订阅"}
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 推荐计划 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">推荐计划</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                分享你的推荐链接，好友购买课程时你将获得 {config.referralRewardPercent?.toString() || "5"}% 的奖励
              </p>

              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground mb-2">你的推荐链接</p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    readOnly
                    value={`${typeof window !== "undefined" ? window.location.origin : ""}/courses?ref=${address}`}
                    className="flex-1 px-3 py-2 text-sm border border-border rounded-lg bg-background truncate"
                  />
                  <Button
                    size="sm"
                    onClick={() => {
                      navigator.clipboard.writeText(
                        `${window.location.origin}/courses?ref=${address}`
                      );
                      alert("链接已复制！");
                    }}
                  >
                    复制
                  </Button>
                </div>
              </div>

              <div className="flex justify-between items-center p-4 bg-primary/5 rounded-lg">
                <div>
                  <p className="text-sm text-muted-foreground">累计推荐奖励</p>
                  <p className="text-2xl font-bold text-primary">
                    {formatPrice(rewards)} YDT
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 右侧：快捷入口 */}
        <div className="space-y-6">
          {/* 快捷操作 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">快捷操作</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link href="/my-courses" className="block">
                <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors">
                  <span className="text-2xl">📚</span>
                  <div>
                    <p className="font-medium">我的学习</p>
                    <p className="text-xs text-muted-foreground">{purchasedCourses.length} 门课程</p>
                  </div>
                </div>
              </Link>

              <Link href="/certificates" className="block">
                <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors">
                  <span className="text-2xl">🏆</span>
                  <div>
                    <p className="font-medium">我的证书</p>
                    <p className="text-xs text-muted-foreground">{certificates.length} 个证书</p>
                  </div>
                </div>
              </Link>

              <Link href="/instructor" className="block">
                <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors">
                  <span className="text-2xl">👨‍🏫</span>
                  <div>
                    <p className="font-medium">讲师中心</p>
                    <p className="text-xs text-muted-foreground">{createdCourses.length} 门课程</p>
                  </div>
                </div>
              </Link>

              <Link href="/token" className="block">
                <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors">
                  <span className="text-2xl">💰</span>
                  <div>
                    <p className="font-medium">代币兑换</p>
                    <p className="text-xs text-muted-foreground">购买或出售 YDT</p>
                  </div>
                </div>
              </Link>

              <Link href="/courses" className="block">
                <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors">
                  <span className="text-2xl">🔍</span>
                  <div>
                    <p className="font-medium">浏览课程</p>
                    <p className="text-xs text-muted-foreground">发现新课程</p>
                  </div>
                </div>
              </Link>
            </CardContent>
          </Card>

          {/* 账户安全 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">账户安全</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center gap-2 text-green-600">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>钱包已连接</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <span>资产由智能合约保护</span>
              </div>
              <p className="text-xs text-muted-foreground mt-4">
                请妥善保管你的钱包私钥，切勿向任何人透露。
              </p>
            </CardContent>
          </Card>

          {/* 帮助 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">需要帮助？</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>如有问题，请联系我们：</p>
              <a href="mailto:support@web3university.com" className="text-primary hover:underline block">
                support@web3university.com
              </a>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
