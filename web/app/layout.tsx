import "pretendard/dist/web/variable/pretendardvariable-dynamic-subset.css";
import "@radix-ui/themes/styles.css";
import "./globals.css";
import { Theme } from "@radix-ui/themes";
import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { DemoBanner } from "@/components/DemoBanner";
import { SiteHeader } from "@/components/SiteHeader";

export const metadata: Metadata = {
  title: { default: "문제곳간 — 나만의 문제은행", template: "%s · 문제곳간" },
  description: "문제를 모아 두고, 찾고, 골라서 문제지로 뽑아요. 사진이나 PDF 속 문제는 AI가 옮겨 적어 줘요.",
};

export const viewport: Viewport = { themeColor: "#f7f9f7" };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ko">
      <body>
        <Theme accentColor="jade" grayColor="sage" radius="medium" appearance="light">
          <a className="skip-link" href="#main">
            본문으로 건너뛰기
          </a>
          <SiteHeader />
          <DemoBanner />
          <main id="main">{children}</main>
        </Theme>
      </body>
    </html>
  );
}
