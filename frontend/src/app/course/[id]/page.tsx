"use client";

import { use, useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import {
  useCourse,
  useCourseRating,
  useHasPurchased,
  useYDTBalance,
  useYDTAllowance,
  useApproveYDT,
  useContracts,
} from "@/hooks";
import { usePurchaseCourse, useRateCourse, useRequestRefund } from "@/hooks/usePurchaseCourse";
import { formatPrice, truncateAddress, formatDate } from "@/lib/utils";
import { RatingModal } from "@/components/course/RatingModal";
import { PurchaseRecord } from "@/types/course";
import { useReadContract } from "wagmi";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function CourseDetailPage({ params }: PageProps) {
  const { id } = use(params);
  const courseId = BigInt(id);
  const router = useRouter();

  const { address, isConnected } = useAccount();
  const { course: courseContract } = useContracts();

  // 课程数据
  const { course, isLoading: courseLoading } = useCourse(courseId);
  const { average: rating, count: ratingCount } = useCourseRating(courseId);
  const { hasPurchased, refetch: refetchPurchased } = useHasPurchased(courseId, address);

  // YDT 数据
  const { balance: ydtBalance, refetch: refetchBalance } = useYDTBalance(address);
  const { allowance, refetch: refetchAllowance } = useYDTAllowance(address, courseContract.address);

  // 购买记录
  const { data: purchaseRecord } = useReadContract({
    address: courseContract.address,
    abi: courseContract.abi,
    functionName: "getPurchaseRecord",
    args: courseId && address ? [courseId, address] : undefined,
    query: {
      enabled: !!courseId && !!address && !!hasPurchased,
    },
  }) as { data: PurchaseRecord | undefined };

  // 用户评分
  const { data: userRating } = useReadContract({
    address: courseContract.address,
    abi: courseContract.abi,
    functionName: "getUserRating",
    args: courseId && address ? [courseId, address] : undefined,
    query: {
      enabled: !!courseId && !!address && !!hasPurchased,
    },
  }) as { data: { score: number; comment: string; timestamp: bigint } | undefined };

  // 操作 hooks
  const { approve, isPending: approving, isSuccess: approveSuccess } = useApproveYDT();
  const { purchaseCourse, isPending: purchasing, isConfirming, isSuccess: purchaseSuccess } = usePurchaseCourse();
  const { requestRefund, isPending: refunding, isSuccess: refundSuccess } = useRequestRefund();

  // 状态
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [referrer, setReferrer] = useState<string>("");

  // 检查 URL 中的推荐人
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const ref = urlParams.get("ref");
    if (ref && ref.startsWith("0x")) {
      setReferrer(ref);
    }
  }, []);

  // 购买成功后刷新数据
  useEffect(() => {
    if (purchaseSuccess) {
      refetchPurchased();
      refetchBalance();
      refetchAllowance();
    }
  }, [purchaseSuccess, refetchPurchased, refetchBalance, refetchAllowance]);

  // 授权成功后刷新
  useEffect(() => {
    if (approveSuccess) {
      refetchAllowance();
    }
  }, [approveSuccess, refetchAllowance]);

  // 退款成功后刷新
  useEffect(() => {
    if (refundSuccess) {
      refetchPurchased();
      refetchBalance();
    }
  }, [refundSuccess, refetchPurchased, refetchBalance]);

  // 加载中
  if (courseLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded w-1/3" />
          <div className="aspect-video bg-muted rounded-xl" />
          <div className="h-6 bg-muted rounded w-2/3" />
          <div className="h-4 bg-muted rounded w-1/2" />
        </div>
      </div>
    );
  }

  // 课程不存在
  if (!course || !course.isActive) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <div className="text-6xl mb-4">😕</div>
        <h1 className="text-2xl font-bold mb-4">课程不存在</h1>
        <p className="text-muted-foreground mb-6">该课程可能已下架或不存在</p>
        <Link href="/courses">
          <Button>浏览其他课程</Button>
        </Link>
      </div>
    );
  }

  const needsApproval = course.priceYDT > (allowance || BigInt(0));
  const hasEnoughBalance = (ydtBalance || BigInt(0)) >= course.priceYDT;

  // 检查是否在退款期内
  const refundPeriod = 7 * 24 * 60 * 60; // 7 days in seconds
  const canRefund =
    hasPurchased &&
    purchaseRecord &&
    !purchaseRecord.refunded &&
    purchaseRecord.pricePaid > BigInt(0) &&
    Number(purchaseRecord.purchaseTime) + refundPeriod > Date.now() / 1000;

  const handleApprove = () => {
    approve(courseContract.address, course.priceYDT);
  };

  const handlePurchase = () => {
    const ref = referrer && referrer.startsWith("0x")
      ? referrer as `0x${string}`
      : "0x0000000000000000000000000000000000000000";
    purchaseCourse(courseId, ref);
  };

  const handleRefund = () => {
    if (confirm("确定要申请退款吗？退款后将无法继续学习此课程。")) {
      requestRefund(courseId);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* 返回按钮 */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        返回
      </button>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* 左侧：课程信息 */}
        <div className="lg:col-span-2 space-y-6">
          {/* 封面图 */}
          <div className="relative aspect-video rounded-xl overflow-hidden bg-muted">
            {course.coverUrl ? (
              <Image
                src={course.coverUrl}
                alt={course.title}
                fill
                className="object-cover"
                priority
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-linear-to-br from-primary/20 to-secondary/20">
                <span className="text-6xl font-bold text-primary/50">
                  {course.title.charAt(0)}
                </span>
              </div>
            )}
          </div>

          {/* 标题和评分 */}
          <div>
            <h1 className="text-3xl font-bold mb-3">{course.title}</h1>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <span className="text-yellow-500">★</span>
                <span className="font-medium text-foreground">
                  {rating > 0 ? rating.toFixed(1) : "暂无评分"}
                </span>
                {ratingCount > 0 && <span>({ratingCount} 评价)</span>}
              </div>
              <span>•</span>
              <span>{Number(course.totalStudents)} 名学生</span>
              <span>•</span>
              <span>创建于 {formatDate(course.createdAt)}</span>
            </div>
          </div>

          {/* 讲师信息 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">讲师</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-lg font-bold text-primary">
                    {course.instructor.slice(2, 4).toUpperCase()}
                  </span>
                </div>
                <div>
                  <p className="font-medium">{truncateAddress(course.instructor)}</p>
                  <a
                    href={`https://etherscan.io/address/${course.instructor}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:underline"
                  >
                    查看地址
                  </a>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 课程描述 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">课程介绍</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground whitespace-pre-wrap">
                {course.description || "暂无课程介绍"}
              </p>
            </CardContent>
          </Card>

          {/* 已购买用户的操作 */}
          {hasPurchased && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">学习管理</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* 查看购买记录 */}
                {purchaseRecord && (
                  <div className="p-4 bg-muted rounded-lg text-sm space-y-2">
                    <p>
                      <span className="text-muted-foreground">购买时间：</span>
                      {formatDate(purchaseRecord.purchaseTime)}
                    </p>
                    <p>
                      <span className="text-muted-foreground">支付金额：</span>
                      {formatPrice(purchaseRecord.pricePaid)} YDT
                    </p>
                    {purchaseRecord.refunded && (
                      <p className="text-red-500">已退款</p>
                    )}
                  </div>
                )}

                {/* 评分 */}
                {userRating && userRating.score > 0 ? (
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground mb-1">你的评价</p>
                    <div className="flex items-center gap-2">
                      <span className="text-yellow-500">
                        {"★".repeat(userRating.score)}
                        {"☆".repeat(5 - userRating.score)}
                      </span>
                      <span className="font-medium">{userRating.score}/5</span>
                    </div>
                    {userRating.comment && (
                      <p className="mt-2 text-sm">{userRating.comment}</p>
                    )}
                  </div>
                ) : (
                  <Button onClick={() => setShowRatingModal(true)} variant="outline" className="w-full">
                    评价课程
                  </Button>
                )}

                {/* 退款 */}
                {canRefund && (
                  <Button
                    onClick={handleRefund}
                    variant="outline"
                    className="w-full text-red-500 hover:text-red-600"
                    isLoading={refunding}
                  >
                    申请退款
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* 右侧：购买卡片 */}
        <div className="lg:col-span-1">
          <div className="sticky top-24">
            <Card>
              <CardContent className="p-6 space-y-6">
                {/* 价格 */}
                <div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-primary">
                      {formatPrice(course.priceYDT)}
                    </span>
                    <span className="text-muted-foreground">YDT</span>
                  </div>
                </div>

                {/* 购买按钮 */}
                {!isConnected ? (
                  <div className="space-y-3">
                    <p className="text-sm text-muted-foreground text-center">
                      请先连接钱包购买课程
                    </p>
                    <ConnectButton.Custom>
                      {({ openConnectModal }) => (
                        <Button onClick={openConnectModal} className="w-full">
                          连接钱包
                        </Button>
                      )}
                    </ConnectButton.Custom>
                  </div>
                ) : hasPurchased ? (
                  <div className="space-y-3">
                    <div className="p-3 bg-green-500/10 text-green-600 rounded-lg text-center text-sm font-medium">
                      ✓ 已购买此课程
                    </div>
                    <Button className="w-full" onClick={() => router.push(`/course/${id}/learn`)}>
                      开始学习
                    </Button>
                  </div>
                ) : course.instructor === address ? (
                  <div className="p-3 bg-muted rounded-lg text-center text-sm text-muted-foreground">
                    这是你创建的课程
                  </div>
                ) : (
                  <div className="space-y-3">
                    {/* 余额显示 */}
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">你的余额</span>
                      <span className={!hasEnoughBalance ? "text-red-500" : ""}>
                        {formatPrice(ydtBalance)} YDT
                      </span>
                    </div>

                    {!hasEnoughBalance ? (
                      <div className="space-y-3">
                        <p className="text-sm text-red-500 text-center">
                          余额不足，请先获取 YDT
                        </p>
                        <Link href="/token">
                          <Button className="w-full">获取 YDT</Button>
                        </Link>
                      </div>
                    ) : needsApproval ? (
                      <Button
                        onClick={handleApprove}
                        className="w-full"
                        isLoading={approving}
                      >
                        授权 YDT
                      </Button>
                    ) : (
                      <Button
                        onClick={handlePurchase}
                        className="w-full"
                        isLoading={purchasing || isConfirming}
                      >
                        {isConfirming ? "确认中..." : "立即购买"}
                      </Button>
                    )}

                    {/* 推荐人输入 */}
                    <div>
                      <label className="text-xs text-muted-foreground">
                        推荐人地址（可选）
                      </label>
                      <input
                        type="text"
                        value={referrer}
                        onChange={(e) => setReferrer(e.target.value)}
                        placeholder="0x..."
                        className="w-full mt-1 px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                  </div>
                )}

                {/* 课程特性 */}
                <div className="pt-4 border-t border-border space-y-3 text-sm">
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>7 天无理由退款</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>完成后获得 NFT 证书</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>推荐好友获得 5% 奖励</span>
                  </div>
                </div>

                {/* 分享链接 */}
                {isConnected && hasPurchased && (
                  <div className="pt-4 border-t border-border">
                    <p className="text-xs text-muted-foreground mb-2">分享推荐链接</p>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        readOnly
                        value={`${typeof window !== "undefined" ? window.location.origin : ""}/course/${id}?ref=${address}`}
                        className="flex-1 px-3 py-2 text-xs border border-border rounded-lg bg-muted truncate"
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          navigator.clipboard.writeText(
                            `${window.location.origin}/course/${id}?ref=${address}`
                          );
                          alert("链接已复制！");
                        }}
                      >
                        复制
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* 评分弹窗 */}
      {showRatingModal && (
        <RatingModal
          courseId={courseId}
          onClose={() => setShowRatingModal(false)}
        />
      )}
    </div>
  );
}
