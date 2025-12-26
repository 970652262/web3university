"use client";

import { useReadContract, useReadContracts } from "wagmi";
import { useContracts } from "./useContracts";
import type { CourseInfo } from "@/types/course";

// 获取活跃课程列表
export function useActiveCourses(offset: number = 0, limit: number = 10) {
  const { course } = useContracts();

  const { data, isLoading, error, refetch } = useReadContract({
    address: course.address,
    abi: course.abi,
    functionName: "getActiveCourses",
    args: [BigInt(offset), BigInt(limit)],
  });

  return {
    courses: (data as CourseInfo[] | undefined) || [],
    isLoading,
    error,
    refetch,
  };
}

// 获取课程总数
export function useCourseCounter() {
  const { course } = useContracts();

  const { data, isLoading } = useReadContract({
    address: course.address,
    abi: course.abi,
    functionName: "courseCounter",
  });

  return {
    count: data as bigint | undefined,
    isLoading,
  };
}

// 获取单个课程详情
export function useCourse(courseId: bigint | undefined) {
  const { course } = useContracts();

  const { data, isLoading, error, refetch } = useReadContract({
    address: course.address,
    abi: course.abi,
    functionName: "getCourse",
    args: courseId ? [courseId] : undefined,
    query: {
      enabled: !!courseId,
    },
  });

  return {
    course: data as CourseInfo | undefined,
    isLoading,
    error,
    refetch,
  };
}

// 获取课程平均评分
export function useCourseRating(courseId: bigint | undefined) {
  const { course } = useContracts();

  const { data, isLoading } = useReadContract({
    address: course.address,
    abi: course.abi,
    functionName: "getCourseAverageRating",
    args: courseId ? [courseId] : undefined,
    query: {
      enabled: !!courseId,
    },
  });

  const result = data as [bigint, bigint] | undefined;

  return {
    average: result ? Number(result[0]) / 100 : 0,
    count: result ? Number(result[1]) : 0,
    isLoading,
  };
}

// 检查用户是否购买了课程
export function useHasPurchased(courseId: bigint | undefined, userAddress: `0x${string}` | undefined) {
  const { course } = useContracts();

  const { data, isLoading, refetch } = useReadContract({
    address: course.address,
    abi: course.abi,
    functionName: "hasUserPurchased",
    args: courseId && userAddress ? [courseId, userAddress] : undefined,
    query: {
      enabled: !!courseId && !!userAddress,
    },
  });

  return {
    hasPurchased: data as boolean | undefined,
    isLoading,
    refetch,
  };
}

// 获取学生已购课程
export function useStudentCourses(studentAddress: `0x${string}` | undefined) {
  const { course } = useContracts();

  // 先获取学生购买的课程 ID 列表
  const { data: courseIds, isLoading: idsLoading, refetch } = useReadContract({
    address: course.address,
    abi: course.abi,
    functionName: "getStudentCourses",
    args: studentAddress ? [studentAddress] : undefined,
    query: {
      enabled: !!studentAddress,
    },
  });

  const ids = (courseIds as bigint[] | undefined) || [];

  // 批量获取课程详情
  const contracts = ids.map((id) => ({
    address: course.address,
    abi: course.abi,
    functionName: "getCourse" as const,
    args: [id],
  }));

  const { data: coursesData, isLoading: coursesLoading } = useReadContracts({
    contracts,
    query: {
      enabled: ids.length > 0,
    },
  });

  const courses = coursesData
    ?.map((result) => result.result as CourseInfo | undefined)
    .filter((c): c is CourseInfo => !!c);

  return {
    courses: courses || [],
    courseIds: ids,
    isLoading: idsLoading || coursesLoading,
    refetch,
  };
}

// 获取讲师创建的课程
export function useInstructorCourses(instructorAddress: `0x${string}` | undefined) {
  const { course } = useContracts();

  // 先获取讲师创建的课程 ID 列表
  const { data: courseIds, isLoading: idsLoading, refetch } = useReadContract({
    address: course.address,
    abi: course.abi,
    functionName: "getInstructorCourses",
    args: instructorAddress ? [instructorAddress] : undefined,
    query: {
      enabled: !!instructorAddress,
    },
  });

  const ids = (courseIds as bigint[] | undefined) || [];

  // 批量获取课程详情
  const contracts = ids.map((id) => ({
    address: course.address,
    abi: course.abi,
    functionName: "getCourse" as const,
    args: [id],
  }));

  const { data: coursesData, isLoading: coursesLoading } = useReadContracts({
    contracts,
    query: {
      enabled: ids.length > 0,
    },
  });

  const courses = coursesData
    ?.map((result) => result.result as CourseInfo | undefined)
    .filter((c): c is CourseInfo => !!c);

  return {
    courses: courses || [],
    courseIds: ids,
    isLoading: idsLoading || coursesLoading,
    refetch,
  };
}

// 获取分类列表
export function useCategories(maxCategories: number = 20) {
  const { course } = useContracts();

  // 先获取分类总数
  const { data: categoryCount } = useReadContract({
    address: course.address,
    abi: course.abi,
    functionName: "categoryCounter",
  });

  const count = Math.min(Number(categoryCount || 0), maxCategories);

  // 批量获取分类
  const contracts = Array.from({ length: count }, (_, i) => ({
    address: course.address,
    abi: course.abi,
    functionName: "categories" as const,
    args: [BigInt(i + 1)],
  }));

  const { data, isLoading } = useReadContracts({
    contracts,
    query: {
      enabled: count > 0,
    },
  });

  const categories = data
    ?.map((result) => result.result as { id: bigint; name: string; isActive: boolean } | undefined)
    .filter((cat): cat is { id: bigint; name: string; isActive: boolean } => !!cat && cat.isActive);

  return {
    categories: categories || [],
    isLoading,
  };
}
