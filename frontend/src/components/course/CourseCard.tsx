"use client";

import Link from "next/link";
import Image from "next/image";
import { Card, CardContent, CardFooter } from "@/components/ui/Card";
import { formatPrice, truncateAddress, calculateRating } from "@/lib/utils";
import type { CourseInfo } from "@/types/course";

interface CourseCardProps {
  course: CourseInfo;
}

export function CourseCard({ course }: CourseCardProps) {
  const rating = calculateRating(course.totalRating, course.ratingCount);
  const ratingCount = Number(course.ratingCount);

  return (
    <Link href={`/course/${course.id}`}>
      <Card className="h-full overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group">
        {/* Cover Image */}
        <div className="relative aspect-video overflow-hidden bg-muted">
          {course.coverUrl ? (
            <Image
              src={course.coverUrl}
              alt={course.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-linear-to-br from-primary/20 to-secondary/20">
              <span className="text-4xl font-bold text-primary/50">
                {course.title.charAt(0)}
              </span>
            </div>
          )}
        </div>

        <CardContent className="p-4">
          {/* Title */}
          <h3 className="font-semibold text-lg line-clamp-2 mb-2 group-hover:text-primary transition-colors">
            {course.title}
          </h3>

          {/* Description */}
          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
            {course.description}
          </p>

          {/* Instructor */}
          <p className="text-xs text-muted-foreground">
            讲师: {truncateAddress(course.instructor)}
          </p>
        </CardContent>

        <CardFooter className="p-4 pt-0 flex items-center justify-between">
          {/* Rating */}
          <div className="flex items-center gap-1">
            <span className="text-yellow-500">★</span>
            <span className="text-sm font-medium">
              {rating > 0 ? rating.toFixed(1) : "暂无"}
            </span>
            {ratingCount > 0 && (
              <span className="text-xs text-muted-foreground">
                ({ratingCount})
              </span>
            )}
          </div>

          {/* Price */}
          <div className="flex items-center gap-1">
            <span className="font-bold text-primary">
              {formatPrice(course.priceYDT)}
            </span>
            <span className="text-xs text-muted-foreground">YDT</span>
          </div>
        </CardFooter>

        {/* Students count badge */}
        {Number(course.totalStudents) > 0 && (
          <div className="absolute top-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded-full">
            {Number(course.totalStudents)} 名学生
          </div>
        )}
      </Card>
    </Link>
  );
}
