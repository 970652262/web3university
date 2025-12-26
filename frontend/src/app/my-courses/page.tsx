"use client";

import { useAccount } from "wagmi";
import Link from "next/link";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { CourseCard } from "@/components/course/CourseCard";
import { CourseCardSkeleton } from "@/components/course/CourseCardSkeleton";
import { useStudentCourses, useYDTBalance } from "@/hooks";
import { formatPrice } from "@/lib/utils";

export default function MyCoursesPage() {
  const { address, isConnected } = useAccount();
  const { courses, isLoading } = useStudentCourses(address);
  const { formatted: ydtBalance } = useYDTBalance(address);

  // 未连接钱包
  if (!isConnected) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <div className="max-w-md mx-auto">
          <div className="text-6xl mb-6">📚</div>
          <h1 className="text-2xl font-bold mb-4">我的学习</h1>
          <p className="text-muted-foreground mb-6">
            连接钱包查看你已购买的课程
          </p>
          <ConnectButton />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* 页面标题 */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">我的学习</h1>
          <p className="text-muted-foreground">
            管理你已购买的课程
          </p>
        </div>

        {/* 余额卡片 */}
        <Card className="md:min-w-[200px]">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-lg font-bold text-primary">Y</span>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">YDT 余额</p>
              <p className="font-bold">{parseFloat(ydtBalance).toLocaleString()}</p>
            </div>
            <Link href="/token" className="ml-auto">
              <Button size="sm" variant="outline">充值</Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* 统计信息 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-primary">{courses.length}</p>
            <p className="text-sm text-muted-foreground">已购课程</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-primary">0</p>
            <p className="text-sm text-muted-foreground">学习中</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-primary">0</p>
            <p className="text-sm text-muted-foreground">已完成</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-primary">0</p>
            <p className="text-sm text-muted-foreground">证书</p>
          </CardContent>
        </Card>
      </div>

      {/* 课程列表 */}
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

        {/* 课程网格 */}
        {!isLoading && courses.length > 0 && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {courses.map((course) => (
              <div key={course.id.toString()} className="relative">
                <CourseCard course={course} />
                {/* 学习进度标签 */}
                <div className="absolute top-2 left-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                  已购买
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 空状态 */}
        {!isLoading && courses.length === 0 && (
          <Card>
            <CardContent className="py-16 text-center">
              <div className="text-6xl mb-4">🎓</div>
              <h3 className="text-xl font-semibold mb-2">还没有购买课程</h3>
              <p className="text-muted-foreground mb-6">
                浏览我们的课程库，开始你的学习之旅吧！
              </p>
              <Link href="/courses">
                <Button>浏览课程</Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>

      {/* 快捷操作 */}
      <div className="mt-12 grid md:grid-cols-3 gap-6">
        <Link href="/courses">
          <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-2xl">
                📖
              </div>
              <div>
                <h3 className="font-semibold">浏览更多课程</h3>
                <p className="text-sm text-muted-foreground">发现新的学习内容</p>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/certificates">
          <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-secondary/10 flex items-center justify-center text-2xl">
                🏆
              </div>
              <div>
                <h3 className="font-semibold">我的证书</h3>
                <p className="text-sm text-muted-foreground">查看获得的 NFT 证书</p>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/instructor">
          <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center text-2xl">
                👨‍🏫
              </div>
              <div>
                <h3 className="font-semibold">成为讲师</h3>
                <p className="text-sm text-muted-foreground">创建并发布你的课程</p>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}
