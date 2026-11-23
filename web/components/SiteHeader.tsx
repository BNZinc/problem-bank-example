"use client";

import { PlusIcon } from "@radix-ui/react-icons";
import { Button, Flex, Text } from "@radix-ui/themes";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "./Logo";

const NAV = [
  { href: "/", label: "문제", match: (p: string) => p === "/" || p.startsWith("/problems") },
  { href: "/import", label: "가져오기", match: (p: string) => p.startsWith("/import") },
  { href: "/worksheets", label: "문제지", match: (p: string) => p.startsWith("/worksheets") },
];

export function SiteHeader() {
  const path = usePathname() ?? "/";
  if (/^\/worksheets\/\d+\/print/.test(path)) return null;
  return (
    <header className="site-header">
      <div className="site-header-inner">
        <Link href="/" className="brand" aria-label="문제곳간 처음 화면">
          <Logo />
          <Text weight="bold" size="4">
            문제곳간
          </Text>
        </Link>
        <nav aria-label="주요 메뉴" className="nav">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className="nav-link" aria-current={n.match(path) ? "page" : undefined}>
              {n.label}
            </Link>
          ))}
        </nav>
        <Flex ml="auto">
          <Button asChild size="2">
            <Link href="/problems/new">
              <PlusIcon /> 새 문제
            </Link>
          </Button>
        </Flex>
      </div>
    </header>
  );
}
