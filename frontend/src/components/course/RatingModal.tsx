"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { useRateCourse } from "@/hooks/usePurchaseCourse";

interface RatingModalProps {
  courseId: bigint;
  onClose: () => void;
}

export function RatingModal({ courseId, onClose }: RatingModalProps) {
  const [score, setScore] = useState(0);
  const [hoverScore, setHoverScore] = useState(0);
  const [comment, setComment] = useState("");

  const { rateCourse, isPending, isConfirming, isSuccess, error } = useRateCourse();

  useEffect(() => {
    if (isSuccess) {
      onClose();
    }
  }, [isSuccess, onClose]);

  const handleSubmit = () => {
    if (score === 0) {
      alert("请选择评分");
      return;
    }
    rateCourse(courseId, score, comment);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* 背景遮罩 */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* 弹窗内容 */}
      <div className="relative bg-background rounded-xl shadow-xl w-full max-w-md mx-4 p-6">
        <h2 className="text-xl font-bold mb-4">评价课程</h2>

        {/* 星级评分 */}
        <div className="mb-4">
          <label className="text-sm text-muted-foreground mb-2 block">
            评分
          </label>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                className="text-3xl transition-transform hover:scale-110"
                onMouseEnter={() => setHoverScore(star)}
                onMouseLeave={() => setHoverScore(0)}
                onClick={() => setScore(star)}
              >
                <span
                  className={
                    star <= (hoverScore || score)
                      ? "text-yellow-500"
                      : "text-gray-300"
                  }
                >
                  ★
                </span>
              </button>
            ))}
          </div>
          {score > 0 && (
            <p className="text-sm text-muted-foreground mt-1">
              {score === 1 && "很差"}
              {score === 2 && "较差"}
              {score === 3 && "一般"}
              {score === 4 && "不错"}
              {score === 5 && "非常好"}
            </p>
          )}
        </div>

        {/* 评论 */}
        <div className="mb-6">
          <label className="text-sm text-muted-foreground mb-2 block">
            评论（可选）
          </label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="分享你的学习体验..."
            rows={4}
            className="w-full px-3 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary resize-none"
          />
        </div>

        {/* 错误提示 */}
        {error && (
          <p className="text-sm text-red-500 mb-4">
            提交失败: {error.message}
          </p>
        )}

        {/* 按钮 */}
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1"
            disabled={isPending || isConfirming}
          >
            取消
          </Button>
          <Button
            onClick={handleSubmit}
            className="flex-1"
            isLoading={isPending || isConfirming}
            disabled={score === 0}
          >
            {isConfirming ? "确认中..." : "提交评价"}
          </Button>
        </div>
      </div>
    </div>
  );
}
