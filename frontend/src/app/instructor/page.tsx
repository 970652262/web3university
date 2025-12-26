"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import Link from "next/link";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { CourseCard } from "@/components/course/CourseCard";
import { CourseCardSkeleton } from "@/components/course/CourseCardSkeleton";
import {
  useInstructorCourses,
  useIsCertifiedInstructor,
  useRequireCertification,
  useReferralRewards,
  useYDTBalance,
} from "@/hooks";
import { formatPrice } from "@/lib/utils";
import { CreateCourseModal } from "@/components/instructor/CreateCourseModal";

export default function InstructorPage() {
  const { address, isConnected } = useAccount();
  const { courses, isLoading, refetch } = useInstructorCourses(address);
  const { isCertified } = useIsCertifiedInstructor(address);
  const { required: requireCertification } = useRequireCertification();
  const { rewards } = useReferralRewards(address);
  const { formatted: ydtBalance } = useYDTBalance(address);

  const [showCreateModal, setShowCreateModal] = useState(false);

  // 未连接钱包
  if (!isConnected) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <div className="max-w-md mx-auto">
          <div className="text-6xl mb-6">👨‍🏫</div>
          <h1 className="text-2xl font-bold mb-4">讲师中心</h1>
          <p className="text-muted-foreground mb-6">
            连接钱包开始创建和管理你的课程
          </p>
          <ConnectButton />
        </div>
      </div>
    );
  }

  // 需要认证但未认证
  const needsCertification = requireCertification && !isCertified;

  // 计算总收入（简单估算：学生数 * 价格 * 95%）
  const totalStudents = courses.reduce((sum, c) => sum + Number(c.totalStudents), 0);
  const activeCourses = courses.filter(c => c.isActive).length;

  return (
    <div className="container mx-auto px-4 py-8">
      {/* 页面标题 */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">讲师中心</h1>
          <p className="text-muted-foreground">
            创建和管理你的课程
          </p>
        </div>

        {/* 创建课程按钮 */}
        {!needsCertification && (
          <Button onClick={() => setShowCreateModal(true)}>
            创建新课程
          </Button>
        )}
      </div>

      {/* 需要认证提示 */}
      {needsCertification && (
        <Card className="mb-8 border-yellow-500/50 bg-yellow-500/5">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="text-4xl">⚠️</div>
              <div>
                <h3 className="font-semibold text-lg mb-2">需要讲师认证</h3>
                <p className="text-muted-foreground mb-4">
                  平台当前要求讲师通过认证才能创建课程。请联系管理员申请认证。
                </p>
                <p className="text-sm text-muted-foreground">
                  你的地址: <code className="bg-muted px-2 py-1 rounded">{address}</code>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 已认证标识 */}
      {isCertified && (
        <div className="mb-6 inline-flex items-center gap-2 px-3 py-1 bg-green-500/10 text-green-600 rounded-full text-sm">
          <span>✓</span>
          <span>已认证讲师</span>
        </div>
      )}

      {/* 统计卡片 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-primary">{courses.length}</p>
            <p className="text-sm text-muted-foreground">课程总数</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-primary">{activeCourses}</p>
            <p className="text-sm text-muted-foreground">活跃课程</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-primary">{totalStudents}</p>
            <p className="text-sm text-muted-foreground">学生总数</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-primary">
              {formatPrice(rewards)}
            </p>
            <p className="text-sm text-muted-foreground">推荐奖励 (YDT)</p>
          </CardContent>
        </Card>
      </div>

      {/* 余额显示 */}
      <Card className="mb-8">
        <CardContent className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-lg font-bold text-primary">Y</span>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">YDT 余额</p>
              <p className="font-bold">{parseFloat(ydtBalance).toLocaleString()}</p>
            </div>
          </div>
          <Link href="/token">
            <Button size="sm" variant="outline">兑换</Button>
          </Link>
        </CardContent>
      </Card>

      {/* 我的课程 */}
      <div>
        <h2 className="text-xl font-semibold mb-4">我的课程</h2>

        {/* Loading */}
        {isLoading && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <CourseCardSkeleton key={i} />
            ))}
          </div>
        )}

        {/* 课程列表 */}
        {!isLoading && courses.length > 0 && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {courses.map((course) => (
              <div key={course.id.toString()} className="relative">
                <CourseCard course={course} />
                {/* 状态标签 */}
                <div className={`absolute top-2 left-2 text-xs px-2 py-1 rounded-full ${
                  course.isActive
                    ? "bg-green-500 text-white"
                    : "bg-red-500 text-white"
                }`}>
                  {course.isActive ? "活跃" : "已下架"}
                </div>
                {/* 管理按钮 */}
                <Link
                  href={`/instructor/course/${course.id}`}
                  className="absolute top-2 right-2"
                >
                  <Button size="sm" variant="secondary">
                    管理
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        )}

        {/* 空状态 */}
        {!isLoading && courses.length === 0 && (
          <Card>
            <CardContent className="py-16 text-center">
              <div className="text-6xl mb-4">📝</div>
              <h3 className="text-xl font-semibold mb-2">还没有创建课程</h3>
              <p className="text-muted-foreground mb-6">
                {needsCertification
                  ? "获得讲师认证后即可创建课程"
                  : "点击上方按钮创建你的第一个课程"}
              </p>
              {!needsCertification && (
                <Button onClick={() => setShowCreateModal(true)}>
                  创建课程
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* 讲师指南 */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="text-lg">讲师指南</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            <strong className="text-foreground">1. 创建课程</strong> - 填写课程标题、描述、封面图和价格
          </p>
          <p>
            <strong className="text-foreground">2. 启用证书</strong> - 为课程启用 NFT 证书功能
          </p>
          <p>
            <strong className="text-foreground">3. 推广课程</strong> - 分享课程链接，学生通过你的链接购买可获得推荐奖励
          </p>
          <p>
            <strong className="text-foreground">4. 管理学生</strong> - 查看学生列表，颁发证书
          </p>
          <ul className="list-disc list-inside mt-4 space-y-1">
            <li>平台收取 5% 的手续费</li>
            <li>学生可在 7 天内申请退款</li>
            <li>课程下架后学生仍可访问已购买的内容</li>
          </ul>
        </CardContent>
      </Card>

      {/* 创建课程弹窗 */}
      {showCreateModal && (
        <CreateCourseModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            refetch();
          }}
        />
      )}
    </div>
  );
}
