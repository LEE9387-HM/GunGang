import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "GunGang — 건강기능식품 비교",
  description: "건강기능식품의 성분·함량·가격을 근거와 함께 비교합니다.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
