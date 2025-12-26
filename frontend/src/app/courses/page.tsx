"use client";

import { useState } from "react";
import { useActiveCourses, useCategories, useCourseCounter } from "@/hooks";
import { CourseCard } from "@/components/course/CourseCard";
import { CourseCardSkeleton } from "@/components/course/CourseCardSkeleton";
import { Button } from "@/components/ui/Button";

const PAGE_SIZE = 12;

export default function CoursesPage() {
  const [page, setPage] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState<bigint | null>(null);

  const { count: totalCourses } = useCourseCounter();
  const { courses, isLoading, error } = useActiveCourses(page * PAGE_SIZE, PAGE_SIZE);
  const { categories } = useCategories();

  // 根据分类过滤课程
  const filteredCourses = selectedCategory
    ? courses.filter((c) => c.categoryId === selectedCategory)
    : courses;

  const totalPages = Math.ceil(Number(totalCourses || 0) / PAGE_SIZE);

  return (
    <div className="container mx-auto px-4 py-8">
      {/* 页面标题 */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">浏览课程</h1>
        <p className="text-muted-foreground">
          发现优质的 Web3 课程，开始你的学习之旅
        </p>
      </div>

      {/* 分类筛选 */}
      {categories.length > 0 && (
        <div className="mb-6 flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              selectedCategory === null
                ? "bg-primary text-white"
                : "bg-muted hover:bg-muted/80 text-foreground"
            }`}
          >
            全部
          </button>
          {categories.map((category) => (
            <button
              key={category.id.toString()}
              onClick={() => setSelectedCategory(category.id)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                selectedCategory === category.id
                  ? "bg-primary text-white"
                  : "bg-muted hover:bg-muted/80 text-foreground"
              }`}
            >
              {category.name}
            </button>
          ))}
        </div>
      )}

      {/* 错误状态 */}
      {error && (
        <div className="text-center py-12">
          <p className="text-red-500 mb-4">加载课程失败</p>
          <p className="text-sm text-muted-foreground">
            请确保已连接到正确的网络
          </p>
        </div>
      )}

      {/* 加载中 */}
      {isLoading && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: PAGE_SIZE }).map((_, i) => (
            <CourseCardSkeleton key={i} />
          ))}
        </div>
      )}

      {/* 课程列表 */}
      {!isLoading && !error && filteredCourses.length > 0 && (
        <>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredCourses.map((course) => (
              <CourseCard key={course.id.toString()} course={course} />
            ))}
          </div>

          {/* 分页 */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-4 mt-8">
              <Button
                variant="outline"
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
              >
                上一页
              </Button>
              <span className="text-sm text-muted-foreground">
                第 {page + 1} / {totalPages} 页
              </span>
              <Button
                variant="outline"
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
              >
                下一页
              </Button>
            </div>
          )}
        </>
      )}

      {/* 空状态 */}
      {!isLoading && !error && filteredCourses.length === 0 && (
        <div className="text-center py-16">
          <div className="text-6xl mb-4">📚</div>
          <h3 className="text-xl font-semibold mb-2">
            {selectedCategory ? "该分类下暂无课程" : "暂无课程"}
          </h3>
          <p className="text-muted-foreground mb-6">
            {selectedCategory
              ? "试试其他分类或查看全部课程"
              : "成为第一个创建课程的讲师吧！"}
          </p>
          {selectedCategory && (
            <Button onClick={() => setSelectedCategory(null)} variant="outline">
              查看全部课程
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
