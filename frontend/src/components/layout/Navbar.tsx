"use client";

import Link from "next/link";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount } from "wagmi";
import { useState } from "react";
import { useIsOwner } from "@/hooks";

export function Navbar() {
  const { address, isConnected } = useAccount();
  const { isOwner } = useIsOwner(address);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
      <nav className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-white font-bold">
            W3
          </div>
          <span className="text-xl font-bold hidden sm:inline-block">
            Web3 University
          </span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-6">
          <Link
            href="/courses"
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            课程
          </Link>
          {isConnected && (
            <>
              <Link
                href="/my-courses"
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                我的学习
              </Link>
              <Link
                href="/certificates"
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                我的证书
              </Link>
              <Link
                href="/instructor"
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                讲师中心
              </Link>
              <Link
                href="/profile"
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                用户中心
              </Link>
            </>
          )}
          <Link
            href="/token"
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            代币
          </Link>
          <Link
            href="/staking"
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            质押
          </Link>
          {isOwner && (
            <Link
              href="/admin"
              className="text-sm font-medium text-primary hover:text-primary/80 transition-colors"
            >
              管理
            </Link>
          )}
        </div>

        {/* Wallet Connect & Mobile Menu */}
        <div className="flex items-center gap-4">
          <ConnectButton
            accountStatus={{
              smallScreen: "avatar",
              largeScreen: "full",
            }}
            chainStatus={{
              smallScreen: "icon",
              largeScreen: "full",
            }}
            showBalance={{
              smallScreen: false,
              largeScreen: true,
            }}
          />

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 rounded-md hover:bg-muted"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <svg
              className="h-6 w-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {mobileMenuOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-border bg-background">
          <div className="container mx-auto px-4 py-4 space-y-3">
            <Link
              href="/courses"
              className="block text-sm font-medium text-muted-foreground hover:text-foreground"
              onClick={() => setMobileMenuOpen(false)}
            >
              课程
            </Link>
            {isConnected && (
              <>
                <Link
                  href="/my-courses"
                  className="block text-sm font-medium text-muted-foreground hover:text-foreground"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  我的学习
                </Link>
                <Link
                  href="/certificates"
                  className="block text-sm font-medium text-muted-foreground hover:text-foreground"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  我的证书
                </Link>
                <Link
                  href="/instructor"
                  className="block text-sm font-medium text-muted-foreground hover:text-foreground"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  讲师中心
                </Link>
                <Link
                  href="/profile"
                  className="block text-sm font-medium text-muted-foreground hover:text-foreground"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  用户中心
                </Link>
              </>
            )}
            <Link
              href="/token"
              className="block text-sm font-medium text-muted-foreground hover:text-foreground"
              onClick={() => setMobileMenuOpen(false)}
            >
              代币
            </Link>
            {isOwner && (
              <Link
                href="/admin"
                className="block text-sm font-medium text-primary hover:text-primary/80"
                onClick={() => setMobileMenuOpen(false)}
              >
                管理后台
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
