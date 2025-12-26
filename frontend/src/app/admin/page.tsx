"use client";

import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { formatEther } from "viem";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import {
  useIsOwner,
  usePlatformConfig,
  useCategories,
  useCourseCounter,
  useCreateCategory,
  useUpdateCategory,
  useCertifyInstructor,
  useDecertifyInstructor,
  useSetRequireCertification,
  useSetPlatformFee,
  useSetRefundPeriod,
  useSetReferralReward,
  useIsCertifiedInstructor,
} from "@/hooks";

type TabType = "categories" | "instructors" | "settings";

export default function AdminPage() {
  const { address, isConnected } = useAccount();
  const { isOwner, owner, isLoading: ownerLoading } = useIsOwner(address);
  const config = usePlatformConfig();
  const { categories, isLoading: categoriesLoading } = useCategories(50);
  const { count: courseCount } = useCourseCounter();

  const [activeTab, setActiveTab] = useState<TabType>("categories");

  // 未连接钱包
  if (!isConnected) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <div className="max-w-md mx-auto">
          <div className="text-6xl mb-6">🔐</div>
          <h1 className="text-2xl font-bold mb-4">管理后台</h1>
          <p className="text-muted-foreground mb-6">
            请连接管理员钱包
          </p>
          <ConnectButton />
        </div>
      </div>
    );
  }

  // 加载中
  if (ownerLoading) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto" />
      </div>
    );
  }

  // 非管理员
  if (!isOwner) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <div className="max-w-md mx-auto">
          <div className="text-6xl mb-6">🚫</div>
          <h1 className="text-2xl font-bold mb-4">无权访问</h1>
          <p className="text-muted-foreground mb-4">
            只有合约 Owner 才能访问管理后台
          </p>
          <p className="text-xs text-muted-foreground">
            Owner 地址: {owner}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* 页面标题 */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">管理后台</h1>
        <p className="text-muted-foreground">
          管理平台分类、讲师认证和系统设置
        </p>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-primary">
              {courseCount?.toString() || "0"}
            </p>
            <p className="text-sm text-muted-foreground">课程总数</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-primary">
              {categories.length}
            </p>
            <p className="text-sm text-muted-foreground">分类数量</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-primary">
              {config.platformFeePercent?.toString() || "5"}%
            </p>
            <p className="text-sm text-muted-foreground">平台费率</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-primary">
              {config.requireCertification ? "是" : "否"}
            </p>
            <p className="text-sm text-muted-foreground">需要认证</p>
          </CardContent>
        </Card>
      </div>

      {/* Tab 切换 */}
      <div className="flex gap-2 p-1 bg-muted rounded-lg mb-6 w-fit">
        {[
          { key: "categories", label: "分类管理" },
          { key: "instructors", label: "讲师认证" },
          { key: "settings", label: "系统设置" },
        ].map((tab) => (
          <button
            key={tab.key}
            className={`py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? "bg-background shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
            onClick={() => setActiveTab(tab.key as TabType)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 内容区域 */}
      {activeTab === "categories" && <CategoriesTab categories={categories} />}
      {activeTab === "instructors" && <InstructorsTab />}
      {activeTab === "settings" && <SettingsTab config={config} />}
    </div>
  );
}

// 分类管理 Tab
function CategoriesTab({ categories }: { categories: Array<{ id: bigint; name: string; isActive: boolean }> }) {
  const [newCategoryName, setNewCategoryName] = useState("");
  const { createCategory, isPending: creating, isSuccess: createSuccess } = useCreateCategory();
  const { updateCategory, isPending: updating } = useUpdateCategory();

  useEffect(() => {
    if (createSuccess) {
      setNewCategoryName("");
    }
  }, [createSuccess]);

  const handleCreate = () => {
    if (!newCategoryName.trim()) {
      alert("请输入分类名称");
      return;
    }
    createCategory(newCategoryName);
  };

  return (
    <div className="space-y-6">
      {/* 创建分类 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">创建分类</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            <input
              type="text"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              placeholder="输入分类名称"
              className="flex-1 px-3 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <Button onClick={handleCreate} isLoading={creating}>
              创建
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 分类列表 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">分类列表</CardTitle>
        </CardHeader>
        <CardContent>
          {categories.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              暂无分类，请创建第一个分类
            </p>
          ) : (
            <div className="space-y-2">
              {categories.map((cat) => (
                <div
                  key={cat.id.toString()}
                  className="flex items-center justify-between p-3 bg-muted rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-muted-foreground">
                      #{cat.id.toString()}
                    </span>
                    <span className="font-medium">{cat.name}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      cat.isActive
                        ? "bg-green-500/10 text-green-600"
                        : "bg-red-500/10 text-red-600"
                    }`}>
                      {cat.isActive ? "启用" : "禁用"}
                    </span>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => updateCategory(cat.id, cat.name, !cat.isActive)}
                    isLoading={updating}
                  >
                    {cat.isActive ? "禁用" : "启用"}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// 讲师认证 Tab
function InstructorsTab() {
  const [instructorAddress, setInstructorAddress] = useState("");
  const [checkAddress, setCheckAddress] = useState("");

  const { certifyInstructor, isPending: certifying, isSuccess: certifySuccess } = useCertifyInstructor();
  const { decertifyInstructor, isPending: decertifying, isSuccess: decertifySuccess } = useDecertifyInstructor();
  const { isCertified, isLoading: checking } = useIsCertifiedInstructor(
    checkAddress && checkAddress.startsWith("0x") ? checkAddress as `0x${string}` : undefined
  );

  useEffect(() => {
    if (certifySuccess || decertifySuccess) {
      setInstructorAddress("");
    }
  }, [certifySuccess, decertifySuccess]);

  const handleCertify = () => {
    if (!instructorAddress || !instructorAddress.startsWith("0x")) {
      alert("请输入有效的地址");
      return;
    }
    certifyInstructor(instructorAddress as `0x${string}`);
  };

  const handleDecertify = () => {
    if (!instructorAddress || !instructorAddress.startsWith("0x")) {
      alert("请输入有效的地址");
      return;
    }
    if (confirm("确定要取消该讲师的认证吗？")) {
      decertifyInstructor(instructorAddress as `0x${string}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* 认证讲师 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">认证讲师</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-1 block">讲师地址</label>
            <input
              type="text"
              value={instructorAddress}
              onChange={(e) => setInstructorAddress(e.target.value)}
              placeholder="0x..."
              className="w-full px-3 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div className="flex gap-3">
            <Button onClick={handleCertify} isLoading={certifying} className="flex-1">
              认证
            </Button>
            <Button
              onClick={handleDecertify}
              isLoading={decertifying}
              variant="outline"
              className="flex-1 text-red-500"
            >
              取消认证
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 查询认证状态 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">查询认证状态</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-1 block">查询地址</label>
            <input
              type="text"
              value={checkAddress}
              onChange={(e) => setCheckAddress(e.target.value)}
              placeholder="0x..."
              className="w-full px-3 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          {checkAddress && checkAddress.startsWith("0x") && (
            <div className={`p-4 rounded-lg ${
              checking
                ? "bg-muted"
                : isCertified
                  ? "bg-green-500/10"
                  : "bg-red-500/10"
            }`}>
              {checking ? (
                <p className="text-muted-foreground">查询中...</p>
              ) : isCertified ? (
                <p className="text-green-600 font-medium">✓ 已认证讲师</p>
              ) : (
                <p className="text-red-600 font-medium">✗ 未认证</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// 系统设置 Tab
function SettingsTab({ config }: { config: ReturnType<typeof usePlatformConfig> }) {
  const [platformFee, setPlatformFee] = useState("");
  const [refundDays, setRefundDays] = useState("");
  const [referralReward, setReferralReward] = useState("");

  const { setRequireCertification, isPending: settingCert } = useSetRequireCertification();
  const { setPlatformFee: updateFee, isPending: settingFee } = useSetPlatformFee();
  const { setRefundPeriod, isPending: settingRefund } = useSetRefundPeriod();
  const { setReferralReward: updateReward, isPending: settingReward } = useSetReferralReward();

  // 初始化
  useEffect(() => {
    if (config.platformFeePercent !== undefined) {
      setPlatformFee(config.platformFeePercent.toString());
    }
    if (config.refundPeriod !== undefined) {
      setRefundDays((Number(config.refundPeriod) / 86400).toString());
    }
    if (config.referralRewardPercent !== undefined) {
      setReferralReward(config.referralRewardPercent.toString());
    }
  }, [config]);

  return (
    <div className="space-y-6">
      {/* 讲师认证设置 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">讲师认证要求</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">要求讲师认证</p>
              <p className="text-sm text-muted-foreground">
                启用后，只有认证讲师才能创建课程
              </p>
            </div>
            <Button
              variant={config.requireCertification ? "primary" : "outline"}
              onClick={() => setRequireCertification(!config.requireCertification)}
              isLoading={settingCert}
            >
              {config.requireCertification ? "已启用" : "已禁用"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 平台费率 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">平台费率</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-1 block">
              费率百分比 (最大 20%)
            </label>
            <div className="flex gap-3">
              <input
                type="number"
                value={platformFee}
                onChange={(e) => setPlatformFee(e.target.value)}
                min="0"
                max="20"
                className="flex-1 px-3 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <Button
                onClick={() => updateFee(BigInt(platformFee))}
                isLoading={settingFee}
              >
                更新
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 退款期限 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">退款期限</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-1 block">
              退款天数
            </label>
            <div className="flex gap-3">
              <input
                type="number"
                value={refundDays}
                onChange={(e) => setRefundDays(e.target.value)}
                min="0"
                className="flex-1 px-3 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <Button
                onClick={() => setRefundPeriod(BigInt(Number(refundDays) * 86400))}
                isLoading={settingRefund}
              >
                更新
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 推荐奖励 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">推荐奖励</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-1 block">
              奖励百分比 (最大 20%)
            </label>
            <div className="flex gap-3">
              <input
                type="number"
                value={referralReward}
                onChange={(e) => setReferralReward(e.target.value)}
                min="0"
                max="20"
                className="flex-1 px-3 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <Button
                onClick={() => updateReward(BigInt(referralReward))}
                isLoading={settingReward}
              >
                更新
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 当前配置 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">当前配置</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">平台费率</span>
              <span>{config.platformFeePercent?.toString()}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">退款期限</span>
              <span>{Number(config.refundPeriod || 0) / 86400} 天</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">推荐奖励</span>
              <span>{config.referralRewardPercent?.toString()}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">月订阅价格</span>
              <span>{config.monthlySubscriptionPrice ? formatEther(config.monthlySubscriptionPrice) : "0"} YDT</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">年订阅价格</span>
              <span>{config.yearlySubscriptionPrice ? formatEther(config.yearlySubscriptionPrice) : "0"} YDT</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">批量折扣门槛</span>
              <span>{config.bulkDiscountThreshold?.toString()} 门课程</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">批量折扣</span>
              <span>{config.bulkDiscountPercent?.toString()}%</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
