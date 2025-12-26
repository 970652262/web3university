"use client";

import { useState, useEffect } from "react";
import { useAccount, useBalance } from "wagmi";
import { parseEther, formatEther } from "viem";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import {
  useYDTBalance,
  useExchangeRate,
  useBuyYDT,
  useSellYDT,
  useContracts,
} from "@/hooks";

type TabType = "buy" | "sell";

export default function TokenPage() {
  const { address, isConnected } = useAccount();
  const { ydToken } = useContracts();

  // 余额
  const { data: ethBalance } = useBalance({ address });
  const { balance: ydtBalance, formatted: ydtFormatted, refetch: refetchYDT } = useYDTBalance(address);
  const { rate, ethToYDT, ydtToETH } = useExchangeRate();

  // 合约 YDT 余额（可购买量）
  const { balance: contractYDTBalance } = useYDTBalance(ydToken.address);

  // 购买/出售操作
  const { buyYDT, isPending: buyPending, isConfirming: buyConfirming, isSuccess: buySuccess, error: buyError } = useBuyYDT();
  const { sellYDT, isPending: sellPending, isConfirming: sellConfirming, isSuccess: sellSuccess, error: sellError } = useSellYDT();

  // 状态
  const [activeTab, setActiveTab] = useState<TabType>("buy");
  const [ethAmount, setEthAmount] = useState("");
  const [ydtAmount, setYdtAmount] = useState("");

  // 购买成功后刷新余额
  useEffect(() => {
    if (buySuccess || sellSuccess) {
      refetchYDT();
      setEthAmount("");
      setYdtAmount("");
    }
  }, [buySuccess, sellSuccess, refetchYDT]);

  // 计算预估值
  const estimatedYDT = ethAmount ? ethToYDT(ethAmount) : "0";
  const estimatedETH = ydtAmount ? ydtToETH(ydtAmount) : "0";

  const handleBuy = () => {
    if (!ethAmount || parseFloat(ethAmount) <= 0) {
      alert("请输入有效的 ETH 数量");
      return;
    }
    buyYDT(ethAmount);
  };

  const handleSell = () => {
    if (!ydtAmount || parseFloat(ydtAmount) <= 0) {
      alert("请输入有效的 YDT 数量");
      return;
    }
    sellYDT(parseEther(ydtAmount));
  };

  const setMaxETH = () => {
    if (ethBalance) {
      // 保留一些 ETH 用于 gas
      const max = Math.max(0, parseFloat(formatEther(ethBalance.value)) - 0.01);
      setEthAmount(max.toFixed(6));
    }
  };

  const setMaxYDT = () => {
    if (ydtBalance) {
      setYdtAmount(formatEther(ydtBalance));
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* 页面标题 */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">YDT 代币</h1>
        <p className="text-muted-foreground">
          购买 YDT 代币用于购买课程，或将 YDT 兑换回 ETH
        </p>
      </div>

      <div className="max-w-2xl mx-auto space-y-6">
        {/* 余额卡片 */}
        <div className="grid sm:grid-cols-2 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">ETH 余额</p>
                  <p className="text-2xl font-bold">
                    {isConnected && ethBalance
                      ? parseFloat(formatEther(ethBalance.value)).toFixed(4)
                      : "0.0000"}
                  </p>
                </div>
                <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                  <span className="text-xl">Ξ</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">YDT 余额</p>
                  <p className="text-2xl font-bold">
                    {isConnected
                      ? parseFloat(ydtFormatted).toLocaleString()
                      : "0"}
                  </p>
                </div>
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-xl font-bold text-primary">Y</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 兑换率信息 */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-center gap-4 text-sm">
              <span className="text-muted-foreground">兑换率:</span>
              <span className="font-medium">1 ETH = {rate ? Number(rate).toLocaleString() : "10,000"} YDT</span>
            </div>
          </CardContent>
        </Card>

        {/* 兑换卡片 */}
        <Card>
          <CardHeader>
            {/* Tab 切换 */}
            <div className="flex gap-2 p-1 bg-muted rounded-lg">
              <button
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${activeTab === "buy"
                  ? "bg-background shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
                  }`}
                onClick={() => setActiveTab("buy")}
              >
                购买 YDT
              </button>
              <button
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${activeTab === "sell"
                  ? "bg-background shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
                  }`}
                onClick={() => setActiveTab("sell")}
              >
                出售 YDT
              </button>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {!isConnected ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">请先连接钱包</p>
                <ConnectButton />
              </div>
            ) : activeTab === "buy" ? (
              /* 购买 YDT */
              <div className="space-y-4">
                {/* ETH 输入 */}
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <label className="text-muted-foreground">支付</label>
                    <button
                      className="text-primary hover:underline"
                      onClick={setMaxETH}
                    >
                      最大
                    </button>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={ethAmount}
                      onChange={(e) => setEthAmount(e.target.value)}
                      placeholder="0.0"
                      step="0.001"
                      min="0"
                      className="flex-1 px-4 py-3 text-lg border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    <div className="flex items-center gap-2 px-4 py-3 bg-muted rounded-lg">
                      <span className="text-xl">Ξ</span>
                      <span className="font-medium">ETH</span>
                    </div>
                  </div>
                </div>

                {/* 箭头 */}
                <div className="flex justify-center">
                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                    </svg>
                  </div>
                </div>

                {/* YDT 预估 */}
                <div>
                  <label className="text-sm text-muted-foreground mb-2 block">获得</label>
                  <div className="flex gap-2">
                    <div className="flex-1 px-4 py-3 text-lg bg-muted rounded-lg">
                      {parseFloat(estimatedYDT).toLocaleString()}
                    </div>
                    <div className="flex items-center gap-2 px-4 py-3 bg-muted rounded-lg">
                      <span className="text-xl font-bold text-primary">Y</span>
                      <span className="font-medium">YDT</span>
                    </div>
                  </div>
                </div>

                {/* 合约余量 */}
                <p className="text-xs text-muted-foreground text-center">
                  可购买量: {contractYDTBalance ? parseFloat(formatEther(contractYDTBalance)).toLocaleString() : "0"} YDT
                </p>

                {/* 错误提示 */}
                {buyError && (
                  <p className="text-sm text-red-500 text-center">
                    购买失败: {buyError.message}
                  </p>
                )}

                {/* 购买按钮 */}
                <Button
                  onClick={handleBuy}
                  className="w-full"
                  size="lg"
                  isLoading={buyPending || buyConfirming}
                  disabled={!ethAmount || parseFloat(ethAmount) <= 0}
                >
                  {buyConfirming ? "确认中..." : "购买 YDT"}
                </Button>
              </div>
            ) : (
              /* 出售 YDT */
              <div className="space-y-4">
                {/* YDT 输入 */}
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <label className="text-muted-foreground">出售</label>
                    <button
                      className="text-primary hover:underline"
                      onClick={setMaxYDT}
                    >
                      最大
                    </button>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={ydtAmount}
                      onChange={(e) => setYdtAmount(e.target.value)}
                      placeholder="0"
                      step="1"
                      min="0"
                      className="flex-1 px-4 py-3 text-lg border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    <div className="flex items-center gap-2 px-4 py-3 bg-muted rounded-lg">
                      <span className="text-xl font-bold text-primary">Y</span>
                      <span className="font-medium">YDT</span>
                    </div>
                  </div>
                </div>

                {/* 箭头 */}
                <div className="flex justify-center">
                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                    </svg>
                  </div>
                </div>

                {/* ETH 预估 */}
                <div>
                  <label className="text-sm text-muted-foreground mb-2 block">获得</label>
                  <div className="flex gap-2">
                    <div className="flex-1 px-4 py-3 text-lg bg-muted rounded-lg">
                      {parseFloat(estimatedETH).toFixed(6)}
                    </div>
                    <div className="flex items-center gap-2 px-4 py-3 bg-muted rounded-lg">
                      <span className="text-xl">Ξ</span>
                      <span className="font-medium">ETH</span>
                    </div>
                  </div>
                </div>

                {/* 错误提示 */}
                {sellError && (
                  <p className="text-sm text-red-500 text-center">
                    出售失败: {sellError.message}
                  </p>
                )}

                {/* 出售按钮 */}
                <Button
                  onClick={handleSell}
                  className="w-full"
                  size="lg"
                  isLoading={sellPending || sellConfirming}
                  disabled={!ydtAmount || parseFloat(ydtAmount) <= 0 || parseFloat(ydtAmount) > parseFloat(ydtFormatted)}
                >
                  {sellConfirming ? "确认中..." : "出售 YDT"}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 说明信息 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">关于 YDT 代币</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>
              <strong className="text-foreground">YDT (YD Token)</strong> 是 Web3 University
              平台的原生代币，用于购买课程和支付平台服务。
            </p>
            <ul className="list-disc list-inside space-y-1">
              <li>兑换率固定为 1 ETH = 10,000 YDT</li>
              <li>购买限制: 最小 0.001 ETH，最大 100 ETH</li>
              <li>可随时将 YDT 兑换回 ETH</li>
              <li>推荐好友购买课程可获得 5% YDT 奖励</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
