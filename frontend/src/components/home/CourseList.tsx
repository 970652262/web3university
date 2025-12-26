"use client";

import Link from "next/link";
import { useActiveCourses } from "@/hooks/useCourses";
import { CourseCard } from "@/components/course/CourseCard";
import { CourseCardSkeleton } from "@/components/course/CourseCardSkeleton";
import { Button } from "@/components/ui/Button";

export function CourseList() {
  const { courses, isLoading, error } = useActiveCourses(0, 6);

  return (
    <section className="py-16 bg-muted/30">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold">热门课程</h2>
            <p className="text-muted-foreground mt-1">发现最受欢迎的 Web3 课程</p>
          </div>
          <Link href="/courses">
            <Button variant="outline">查看全部</Button>
          </Link>
        </div>

        {/* Error State */}
        {error && (
          <div className="text-center py-12">
            <p className="text-red-500 mb-4">加载课程失败</p>
            <p className="text-sm text-muted-foreground">
              请确保已连接到正确的网络，并且合约已部署
            </p>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <CourseCardSkeleton key={i} />
            ))}
          </div>
        )}

        {/* Course Grid */}
        {!isLoading && !error && courses.length > 0 && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course) => (
              <CourseCard key={course.id.toString()} course={course} />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && courses.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📚</div>
            <h3 className="text-xl font-semibold mb-2">暂无课程</h3>
            <p className="text-muted-foreground mb-6">
              还没有课程上架，成为第一个创建课程的讲师吧！
            </p>
            <Link href="/instructor">
              <Button>创建课程</Button>
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
