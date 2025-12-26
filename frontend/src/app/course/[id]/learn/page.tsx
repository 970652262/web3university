"use client";

import { use, useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import {
  useCourse,
  useHasPurchased,
  useCertificatesEnabled,
  useHasCertificate,
  useClaimCertificate,
} from "@/hooks";
import { formatDate, truncateAddress } from "@/lib/utils";

interface PageProps {
  params: Promise<{ id: string }>;
}

// 模拟课程章节数据
const mockChapters = [
  {
    id: 1,
    title: "第一章：课程介绍",
    lessons: [
      { id: 1, title: "1.1 课程概述", duration: "5:30" },
      { id: 2, title: "1.2 学习目标", duration: "3:45" },
    ],
  },
  {
    id: 2,
    title: "第二章：基础知识",
    lessons: [
      { id: 3, title: "2.1 核心概念", duration: "12:20" },
      { id: 4, title: "2.2 实践练习", duration: "15:00" },
      { id: 5, title: "2.3 小结", duration: "4:10" },
    ],
  },
  {
    id: 3,
    title: "第三章：进阶内容",
    lessons: [
      { id: 6, title: "3.1 高级技巧", duration: "18:30" },
      { id: 7, title: "3.2 最佳实践", duration: "14:25" },
    ],
  },
  {
    id: 4,
    title: "第四章：项目实战",
    lessons: [
      { id: 8, title: "4.1 项目搭建", duration: "20:00" },
      { id: 9, title: "4.2 功能开发", duration: "25:30" },
      { id: 10, title: "4.3 部署上线", duration: "10:15" },
    ],
  },
];

export default function LearnPage({ params }: PageProps) {
  const { id } = use(params);
  const courseId = BigInt(id);
  const router = useRouter();

  const { address, isConnected } = useAccount();
  const { course, isLoading } = useCourse(courseId);
  const { hasPurchased, isLoading: checkingPurchase } = useHasPurchased(courseId, address);

  // 证书相关
  const { enabled: certificatesEnabled } = useCertificatesEnabled(courseId);
  const { hasCertificate, refetch: refetchCertificate } = useHasCertificate(courseId, address);
  const {
    claimCertificate,
    isPending: claimPending,
    isConfirming: claimConfirming,
    isSuccess: claimSuccess,
    error: claimError,
  } = useClaimCertificate();

  const [currentLesson, setCurrentLesson] = useState<number | null>(null);
  const [completedLessons, setCompletedLessons] = useState<Set<number>>(new Set());
  const [showCertificateModal, setShowCertificateModal] = useState(false);

  // 领取证书成功后刷新状态
  useEffect(() => {
    if (claimSuccess) {
      refetchCertificate();
      setShowCertificateModal(true);
    }
  }, [claimSuccess, refetchCertificate]);

  // 加载中
  if (isLoading || checkingPurchase) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded w-1/3" />
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 aspect-video bg-muted rounded-xl" />
            <div className="space-y-4">
              <div className="h-6 bg-muted rounded" />
              <div className="h-4 bg-muted rounded w-3/4" />
              <div className="h-4 bg-muted rounded w-1/2" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 未连接钱包
  if (!isConnected) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <div className="text-6xl mb-4">🔒</div>
        <h1 className="text-2xl font-bold mb-4">请先连接钱包</h1>
        <p className="text-muted-foreground mb-6">连接钱包后才能访问课程内容</p>
        <Link href={`/course/${id}`}>
          <Button>返回课程详情</Button>
        </Link>
      </div>
    );
  }

  // 未购买课程
  if (!hasPurchased) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <div className="text-6xl mb-4">🚫</div>
        <h1 className="text-2xl font-bold mb-4">您还未购买此课程</h1>
        <p className="text-muted-foreground mb-6">请先购买课程后再开始学习</p>
        <Link href={`/course/${id}`}>
          <Button>去购买课程</Button>
        </Link>
      </div>
    );
  }

  // 课程不存在
  if (!course) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <div className="text-6xl mb-4">😕</div>
        <h1 className="text-2xl font-bold mb-4">课程不存在</h1>
        <Link href="/courses">
          <Button>浏览其他课程</Button>
        </Link>
      </div>
    );
  }

  const totalLessons = mockChapters.reduce((sum, ch) => sum + ch.lessons.length, 0);
  const completedCount = completedLessons.size;
  const progress = Math.round((completedCount / totalLessons) * 100);
  const isCompleted = progress === 100;

  const handleLessonComplete = (lessonId: number) => {
    setCompletedLessons((prev) => new Set([...prev, lessonId]));
  };

  const handleClaimCertificate = () => {
    const instructorName = truncateAddress(course.instructor);
    claimCertificate(courseId, instructorName);
  };

  const currentLessonData = currentLesson
    ? mockChapters.flatMap((ch) => ch.lessons).find((l) => l.id === currentLesson)
    : null;

  return (
    <div className="min-h-screen bg-background">
      {/* 顶部导航 */}
      <div className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push(`/course/${id}`)}
                className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                返回课程
              </button>
              <span className="text-muted-foreground">|</span>
              <h1 className="font-semibold truncate max-w-md">{course.title}</h1>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-sm text-muted-foreground">
                学习进度: {completedCount}/{totalLessons}
              </div>
              <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <span className="text-sm font-medium">{progress}%</span>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* 左侧：视频/内容区域 */}
          <div className="lg:col-span-2 space-y-4">
            {/* 视频播放区 */}
            <Card>
              <CardContent className="p-0">
                <div className="aspect-video bg-black rounded-t-lg flex items-center justify-center">
                  {currentLessonData ? (
                    <div className="text-center text-white">
                      <div className="text-6xl mb-4">▶️</div>
                      <p className="text-xl font-medium">{currentLessonData.title}</p>
                      <p className="text-gray-400 mt-2">时长: {currentLessonData.duration}</p>
                    </div>
                  ) : (
                    <div className="text-center text-white/70">
                      <div className="text-6xl mb-4">📚</div>
                      <p>请从右侧选择课程章节开始学习</p>
                    </div>
                  )}
                </div>
                {currentLessonData && (
                  <div className="p-4 flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">{currentLessonData.title}</h3>
                      <p className="text-sm text-muted-foreground">时长: {currentLessonData.duration}</p>
                    </div>
                    <Button
                      onClick={() => handleLessonComplete(currentLessonData.id)}
                      disabled={completedLessons.has(currentLessonData.id)}
                      variant={completedLessons.has(currentLessonData.id) ? "outline" : "primary"}
                    >
                      {completedLessons.has(currentLessonData.id) ? "✓ 已完成" : "标记完成"}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 课程说明 */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">课程说明</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  {course.description || "暂无课程说明"}
                </p>
              </CardContent>
            </Card>

            {/* 完成课程 - 领取证书 */}
            {isCompleted && (
              <Card className="border-primary">
                <CardContent className="p-6">
                  <div className="text-center space-y-4">
                    <div className="text-5xl">🎉</div>
                    <h3 className="text-xl font-bold">恭喜完成课程！</h3>
                    <p className="text-muted-foreground">
                      你已完成《{course.title}》的所有课程内容
                    </p>

                    {hasCertificate ? (
                      <div className="p-4 bg-green-500/10 rounded-lg">
                        <div className="flex items-center justify-center gap-2 text-green-600">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span className="font-medium">已获得 NFT 证书</span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-2">
                          你可以在个人中心查看你的证书
                        </p>
                        <Link href="/profile/certificates">
                          <Button variant="outline" className="mt-3">
                            查看我的证书
                          </Button>
                        </Link>
                      </div>
                    ) : certificatesEnabled ? (
                      <div className="space-y-3">
                        <p className="text-sm text-muted-foreground">
                          领取 NFT 证书，证明你的学习成果
                        </p>
                        {claimError && (
                          <p className="text-sm text-red-500">
                            领取失败: {claimError.message}
                          </p>
                        )}
                        <Button
                          onClick={handleClaimCertificate}
                          isLoading={claimPending || claimConfirming}
                          className="px-8"
                        >
                          {claimConfirming ? "确认中..." : "领取 NFT 证书"}
                        </Button>
                      </div>
                    ) : (
                      <div className="p-4 bg-muted rounded-lg">
                        <p className="text-sm text-muted-foreground">
                          该课程暂未开放证书领取
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* 右侧：章节列表 */}
          <div className="lg:col-span-1">
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle className="text-lg">课程目录</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="max-h-[600px] overflow-y-auto">
                  {mockChapters.map((chapter) => (
                    <div key={chapter.id} className="border-b border-border last:border-0">
                      <div className="px-4 py-3 bg-muted/50 font-medium text-sm">
                        {chapter.title}
                      </div>
                      <div>
                        {chapter.lessons.map((lesson) => (
                          <button
                            key={lesson.id}
                            onClick={() => setCurrentLesson(lesson.id)}
                            className={`w-full px-4 py-3 flex items-center gap-3 hover:bg-muted/50 transition-colors text-left ${currentLesson === lesson.id ? "bg-primary/10" : ""
                              }`}
                          >
                            <div
                              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${completedLessons.has(lesson.id)
                                ? "bg-green-500 text-white"
                                : currentLesson === lesson.id
                                  ? "bg-primary text-white"
                                  : "bg-muted text-muted-foreground"
                                }`}
                            >
                              {completedLessons.has(lesson.id) ? "✓" : lesson.id}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className={`text-sm truncate ${currentLesson === lesson.id ? "font-medium" : ""}`}>
                                {lesson.title}
                              </p>
                              <p className="text-xs text-muted-foreground">{lesson.duration}</p>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* 证书领取成功弹窗 */}
      {showCertificateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-md w-full">
            <CardContent className="p-6 text-center space-y-4">
              <div className="text-6xl">🏆</div>
              <h2 className="text-2xl font-bold">证书领取成功！</h2>
              <p className="text-muted-foreground">
                恭喜你获得《{course.title}》的 NFT 完课证书！
              </p>
              <div className="p-4 bg-muted rounded-lg text-sm">
                <p className="text-muted-foreground">证书信息</p>
                <p className="font-medium mt-1">课程: {course.title}</p>
                <p className="font-medium">讲师: {truncateAddress(course.instructor)}</p>
                <p className="font-medium">颁发时间: {formatDate(BigInt(Math.floor(Date.now() / 1000)))}</p>
              </div>
              <div className="flex gap-3 justify-center">
                <Button variant="outline" onClick={() => setShowCertificateModal(false)}>
                  继续学习
                </Button>
                <Link href="/profile/certificates">
                  <Button>查看证书</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}