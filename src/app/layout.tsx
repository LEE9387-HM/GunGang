import type { Metadata } from "next";
import Link from "next/link";
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
      <body>
        {children}
        <footer className="mx-auto max-w-2xl px-5 pb-10 text-xs text-gray-400">
          <div className="flex gap-3 border-t border-gray-100 pt-4 dark:border-gray-900">
            <Link href="/terms" className="hover:underline">
              이용약관
            </Link>
            <Link href="/privacy" className="hover:underline">
              개인정보처리방침
            </Link>
          </div>
        </footer>
      </body>
    </html>
  );
}
