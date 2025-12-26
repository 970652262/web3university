"use client";

import { useAccount } from "wagmi";
import Link from "next/link";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { useUserCertificates } from "@/hooks";
import { formatDate, truncateAddress } from "@/lib/utils";

export default function CertificatesPage() {
  const { address, isConnected } = useAccount();
  const { certificates, isLoading } = useUserCertificates(address);

  // 未连接钱包
  if (!isConnected) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <div className="max-w-md mx-auto">
          <div className="text-6xl mb-6">🏆</div>
          <h1 className="text-2xl font-bold mb-4">我的证书</h1>
          <p className="text-muted-foreground mb-6">
            连接钱包查看你获得的 NFT 证书
          </p>
          <ConnectButton />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* 页面标题 */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">我的证书</h1>
        <p className="text-muted-foreground">
          完成课程后获得的 NFT 证书，永久存储在区块链上
        </p>
      </div>

      {/* 统计 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-primary">{certificates.length}</p>
            <p className="text-sm text-muted-foreground">证书总数</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-primary">
              {new Set(certificates.map(c => c.instructorName)).size}
            </p>
            <p className="text-sm text-muted-foreground">不同讲师</p>
          </CardContent>
        </Card>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <div className="aspect-[4/3] bg-muted animate-pulse" />
              <CardContent className="p-4 space-y-2">
                <div className="h-5 bg-muted rounded animate-pulse" />
                <div className="h-4 bg-muted rounded w-2/3 animate-pulse" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* 证书列表 */}
      {!isLoading && certificates.length > 0 && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {certificates.map((cert) => (
            <Card key={cert.tokenId.toString()} className="overflow-hidden hover:shadow-lg transition-shadow">
              {/* 证书样式 */}
              <div className="aspect-[4/3] bg-gradient-to-br from-primary/20 via-secondary/20 to-accent/20 relative p-6 flex flex-col items-center justify-center text-center">
                {/* 装饰边框 */}
                <div className="absolute inset-4 border-2 border-primary/30 rounded-lg" />
                <div className="absolute inset-6 border border-primary/20 rounded-lg" />

                {/* 证书图标 */}
                <div className="text-5xl mb-3">🎓</div>

                {/* 课程名 */}
                <h3 className="font-bold text-lg mb-1 line-clamp-2">{cert.courseName}</h3>

                {/* Token ID */}
                <p className="text-xs text-muted-foreground">
                  Certificate #{cert.tokenId.toString()}
                </p>
              </div>

              <CardContent className="p-4 space-y-3">
                {/* 讲师 */}
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">讲师</span>
                  <span className="font-medium">{cert.instructorName || "未知"}</span>
                </div>

                {/* 获得时间 */}
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">获得时间</span>
                  <span>{formatDate(cert.issueDate)}</span>
                </div>

                {/* 学生地址 */}
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">持有者</span>
                  <span className="font-mono text-xs">{truncateAddress(cert.student)}</span>
                </div>

                {/* 操作按钮 */}
                <div className="pt-2 flex gap-2">
                  <Link href={`/course/${cert.courseId}`} className="flex-1">
                    <Button variant="outline" size="sm" className="w-full">
                      查看课程
                    </Button>
                  </Link>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      // TODO: 实现分享功能
                      const shareUrl = `${window.location.origin}/certificate/${cert.tokenId}`;
                      navigator.clipboard.writeText(shareUrl);
                      alert("证书链接已复制！");
                    }}
                  >
                    分享
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* 空状态 */}
      {!isLoading && certificates.length === 0 && (
        <Card>
          <CardContent className="py-16 text-center">
            <div className="text-6xl mb-4">🏆</div>
            <h3 className="text-xl font-semibold mb-2">还没有证书</h3>
            <p className="text-muted-foreground mb-6">
              完成课程学习后，你可以领取 NFT 证书
            </p>
            <Link href="/my-courses">
              <Button>查看我的课程</Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* 说明信息 */}
      <Card className="mt-8">
        <CardContent className="p-6">
          <h3 className="font-semibold mb-3">关于 NFT 证书</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="text-green-500">✓</span>
              <span>证书作为 NFT 存储在区块链上，永久有效且不可篡改</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500">✓</span>
              <span>每个证书都有唯一的 Token ID，可在区块链浏览器上验证</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500">✓</span>
              <span>证书可以转让给其他地址（但不建议这样做）</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500">✓</span>
              <span>分享证书链接，让他人验证你的学习成果</span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
