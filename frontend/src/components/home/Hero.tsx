"use client";

import Link from "next/link";
import { useAccount } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { Button } from "@/components/ui/Button";

export function Hero() {
  const { isConnected } = useAccount();

  return (
    <section className="relative overflow-hidden bg-linear-to-b from-primary/5 via-background to-background">
      {/* Background decoration */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 left-1/4 w-72 h-72 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-secondary/10 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 py-20 md:py-32">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
            Web3 驱动的去中心化学习平台
          </div>

          {/* Title */}
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
            用
            <span className="text-blue-500 bg-clip-text bg-linear-to-r from-primary to-secondary">
              {" "}YDT 代币{" "}
            </span>
            开启你的
            <br />
            Web3 学习之旅
          </h1>

          {/* Description */}
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            购买优质课程，获取 NFT 证书，成为区块链时代的先行者。
            支持评分、退款、推荐奖励等完整学习体验。
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            {isConnected ? (
              <>
                <Link href="/courses">
                  <Button size="lg" className="min-w-40">
                    浏览课程
                  </Button>
                </Link>
                <Link href="/token">
                  <Button size="lg" variant="outline" className="min-w-40">
                    获取 YDT
                  </Button>
                </Link>
              </>
            ) : (
              <ConnectButton.Custom>
                {({ openConnectModal }) => (
                  <Button size="lg" onClick={openConnectModal} className="min-w-[200px]">
                    连接钱包开始学习
                  </Button>
                )}
              </ConnectButton.Custom>
            )}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-8 mt-16 max-w-xl mx-auto">
            <div>
              <div className="text-3xl md:text-4xl font-bold text-primary">100+</div>
              <div className="text-sm text-muted-foreground mt-1">优质课程</div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold text-primary">1000+</div>
              <div className="text-sm text-muted-foreground mt-1">活跃学员</div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold text-primary">50+</div>
              <div className="text-sm text-muted-foreground mt-1">认证讲师</div>
            </div>
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="container mx-auto px-4 pb-20">
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          <FeatureCard
            icon="🎓"
            title="NFT 证书"
            description="完成课程后获得 NFT 证书，永久存储在区块链上，证明你的学习成果"
          />
          <FeatureCard
            icon="💰"
            title="代币激励"
            description="使用 YDT 代币购买课程，推荐好友可获得奖励，学习也能赚取收益"
          />
          <FeatureCard
            icon="🔒"
            title="去中心化"
            description="课程数据存储在链上，透明可追溯，你的学习记录永不丢失"
          />
        </div>
      </div>
    </section>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <div className="p-6 rounded-xl border border-border bg-card hover:shadow-md transition-shadow">
      <div className="text-4xl mb-4">{icon}</div>
      <h3 className="font-semibold text-lg mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
}
