"use client";

import { use, useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import {
  useCourse,
  useCourseRating,
  useUpdateCourse,
  useDeactivateCourse,
  useCategories,
  useCertificatesEnabled,
  useEnableCertificates,
} from "@/hooks";
import { formatPrice, formatDate } from "@/lib/utils";
import { formatEther } from "viem";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function ManageCoursePage({ params }: PageProps) {
  const { id } = use(params);
  const courseId = BigInt(id);
  const router = useRouter();

  const { address } = useAccount();
  const { course, isLoading, refetch } = useCourse(courseId);
  const { average: rating, count: ratingCount } = useCourseRating(courseId);
  const { categories } = useCategories();
  const { enabled: certificatesEnabled, isLoading: certLoading } = useCertificatesEnabled(courseId);

  // 编辑状态
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [coverUrl, setCoverUrl] = useState("");
  const [price, setPrice] = useState("");
  const [categoryId, setCategoryId] = useState<bigint>(BigInt(0));

  // 证书设置
  const [metadataURI, setMetadataURI] = useState("");

  // Hooks
  const { updateCourse, isPending: updating, isSuccess: updateSuccess } = useUpdateCourse();
  const { deactivateCourse, isPending: deactivating, isSuccess: deactivateSuccess } = useDeactivateCourse();
  const { enableCertificates, isPending: enablingCert, isSuccess: enableCertSuccess } = useEnableCertificates();

  // 初始化表单
  useEffect(() => {
    if (course) {
      setTitle(course.title);
      setDescription(course.description);
      setCoverUrl(course.coverUrl);
      setPrice(formatEther(course.priceYDT));
      setCategoryId(course.categoryId);
    }
  }, [course]);

  // 更新成功
  useEffect(() => {
    if (updateSuccess || enableCertSuccess) {
      refetch();
      setIsEditing(false);
    }
  }, [updateSuccess, enableCertSuccess, refetch]);

  // 下架成功
  useEffect(() => {
    if (deactivateSuccess) {
      refetch();
    }
  }, [deactivateSuccess, refetch]);

  // 加载中
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded w-1/3" />
          <div className="h-64 bg-muted rounded-xl" />
        </div>
      </div>
    );
  }

  // 课程不存在或不是讲师
  if (!course || course.instructor !== address) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <div className="text-6xl mb-4">🚫</div>
        <h1 className="text-2xl font-bold mb-4">无权访问</h1>
        <p className="text-muted-foreground mb-6">
          你不是这个课程的讲师
        </p>
        <Button onClick={() => router.push("/instructor")}>
          返回讲师中心
        </Button>
      </div>
    );
  }

  const handleUpdate = () => {
    if (!title.trim()) {
      alert("请输入课程标题");
      return;
    }
    updateCourse(courseId, title, description, coverUrl, price, categoryId);
  };

  const handleDeactivate = () => {
    if (confirm("确定要下架这个课程吗？下架后学生仍可访问已购买的内容。")) {
      deactivateCourse(courseId);
    }
  };

  const handleEnableCertificates = () => {
    if (!metadataURI.trim()) {
      alert("请输入证书元数据 URI");
      return;
    }
    enableCertificates(courseId, metadataURI);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* 返回按钮 */}
      <button
        onClick={() => router.push("/instructor")}
        className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        返回讲师中心
      </button>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* 左侧：课程信息 */}
        <div className="lg:col-span-2 space-y-6">
          {/* 标题和状态 */}
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold mb-2">{course.title}</h1>
              <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${course.isActive
                  ? "bg-green-500/10 text-green-600"
                  : "bg-red-500/10 text-red-600"
                }`}>
                {course.isActive ? "✓ 活跃" : "✗ 已下架"}
              </div>
            </div>
            {course.isActive && !isEditing && (
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setIsEditing(true)}>
                  编辑
                </Button>
                <Button
                  variant="outline"
                  className="text-red-500"
                  onClick={handleDeactivate}
                  isLoading={deactivating}
                >
                  下架
                </Button>
              </div>
            )}
          </div>

          {/* 编辑表单 */}
          {isEditing ? (
            <Card>
              <CardHeader>
                <CardTitle>编辑课程</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">课程标题</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-3 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-1 block">课程描述</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={4}
                    className="w-full px-3 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-1 block">封面图 URL</label>
                  <input
                    type="url"
                    value={coverUrl}
                    onChange={(e) => setCoverUrl(e.target.value)}
                    className="w-full px-3 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-1 block">价格 (YDT)</label>
                  <input
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="w-full px-3 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-1 block">分类</label>
                  <select
                    value={categoryId.toString()}
                    onChange={(e) => setCategoryId(BigInt(e.target.value))}
                    className="w-full px-3 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="0">无分类</option>
                    {categories.map((cat) => (
                      <option key={cat.id.toString()} value={cat.id.toString()}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setIsEditing(false)}
                    className="flex-1"
                  >
                    取消
                  </Button>
                  <Button
                    onClick={handleUpdate}
                    className="flex-1"
                    isLoading={updating}
                  >
                    保存修改
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            /* 课程详情展示 */
            <>
              {/* 封面图 */}
              <div className="relative aspect-video rounded-xl overflow-hidden bg-muted">
                {course.coverUrl ? (
                  <Image
                    src={course.coverUrl}
                    alt={course.title}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-linear-to-br from-primary/20 to-secondary/20">
                    <span className="text-4xl font-bold text-primary/50">
                      {course.title.charAt(0)}
                    </span>
                  </div>
                )}
              </div>

              {/* 描述 */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">课程描述</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground whitespace-pre-wrap">
                    {course.description || "暂无描述"}
                  </p>
                </CardContent>
              </Card>
            </>
          )}

          {/* 证书设置 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">NFT 证书</CardTitle>
            </CardHeader>
            <CardContent>
              {certLoading ? (
                <div className="animate-pulse h-20 bg-muted rounded" />
              ) : certificatesEnabled ? (
                <div className="p-4 bg-green-500/10 rounded-lg">
                  <p className="text-green-600 font-medium">✓ 已启用证书功能</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    学生完成课程后可以领取 NFT 证书
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-muted-foreground">
                    启用证书功能，让学生可以领取 NFT 证书
                  </p>
                  <div>
                    <label className="text-sm font-medium mb-1 block">
                      证书元数据 URI
                    </label>
                    <input
                      type="url"
                      value={metadataURI}
                      onChange={(e) => setMetadataURI(e.target.value)}
                      placeholder="ipfs://..."
                      className="w-full px-3 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      建议使用 IPFS 存储证书元数据
                    </p>
                  </div>
                  <Button
                    onClick={handleEnableCertificates}
                    isLoading={enablingCert}
                    disabled={!metadataURI.trim()}
                  >
                    启用证书
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* 右侧：统计信息 */}
        <div className="space-y-6">
          {/* 统计卡片 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">课程统计</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span className="text-muted-foreground">价格</span>
                <span className="font-bold">{formatPrice(course.priceYDT)} YDT</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">学生数</span>
                <span className="font-bold">{Number(course.totalStudents)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">评分</span>
                <span className="font-bold">
                  {rating > 0 ? `${rating.toFixed(1)} (${ratingCount} 评价)` : "暂无评分"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">创建时间</span>
                <span>{formatDate(course.createdAt)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">预估收入</span>
                <span className="font-bold text-primary">
                  {formatPrice(course.priceYDT * BigInt(course.totalStudents) * BigInt(95) / BigInt(100))} YDT
                </span>
              </div>
            </CardContent>
          </Card>

          {/* 分享链接 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">分享推广</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-3">
                分享链接给学生，通过推荐购买可获得 5% 奖励
              </p>
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
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
