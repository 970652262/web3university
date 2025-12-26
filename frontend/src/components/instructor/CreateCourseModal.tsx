"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { useCreateCourse, useCategories } from "@/hooks";

interface CreateCourseModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export function CreateCourseModal({ onClose, onSuccess }: CreateCourseModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [coverUrl, setCoverUrl] = useState("");
  const [price, setPrice] = useState("");
  const [categoryId, setCategoryId] = useState<bigint>(BigInt(0));

  const { categories } = useCategories();
  const { createCourse, isPending, isConfirming, isSuccess, error } = useCreateCourse();

  useEffect(() => {
    if (isSuccess) {
      onSuccess();
    }
  }, [isSuccess, onSuccess]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      alert("请输入课程标题");
      return;
    }
    if (!price || parseFloat(price) <= 0) {
      alert("请输入有效的价格");
      return;
    }

    createCourse(title, description, coverUrl, price, categoryId);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* 背景遮罩 */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* 弹窗内容 */}
      <div className="relative bg-background rounded-xl shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-xl font-bold mb-6">创建新课程</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* 标题 */}
            <div>
              <label className="text-sm font-medium mb-1 block">
                课程标题 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="输入课程标题"
                className="w-full px-3 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                required
              />
            </div>

            {/* 描述 */}
            <div>
              <label className="text-sm font-medium mb-1 block">课程描述</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="输入课程描述..."
                rows={4}
                className="w-full px-3 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary resize-none"
              />
            </div>

            {/* 封面图 URL */}
            <div>
              <label className="text-sm font-medium mb-1 block">封面图 URL</label>
              <input
                type="url"
                value={coverUrl}
                onChange={(e) => setCoverUrl(e.target.value)}
                placeholder="https://..."
                className="w-full px-3 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <p className="text-xs text-muted-foreground mt-1">
                建议使用 IPFS 或其他永久存储的图片链接
              </p>
            </div>

            {/* 价格 */}
            <div>
              <label className="text-sm font-medium mb-1 block">
                价格 (YDT) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="100"
                min="0"
                step="1"
                className="w-full px-3 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                required
              />
            </div>

            {/* 分类 */}
            <div>
              <label className="text-sm font-medium mb-1 block">课程分类</label>
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

            {/* 错误提示 */}
            {error && (
              <p className="text-sm text-red-500">
                创建失败: {error.message}
              </p>
            )}

            {/* 按钮 */}
            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex-1"
                disabled={isPending || isConfirming}
              >
                取消
              </Button>
              <Button
                type="submit"
                className="flex-1"
                isLoading={isPending || isConfirming}
              >
                {isConfirming ? "确认中..." : "创建课程"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
