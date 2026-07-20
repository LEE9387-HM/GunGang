"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createBrowserAuthClient } from "@/infra/db/browser-auth-client";

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setNotice(null);

    if (password.length < 8) {
      setError("비밀번호는 8자 이상이어야 합니다.");
      return;
    }
    if (password !== passwordConfirm) {
      setError("비밀번호가 일치하지 않습니다.");
      return;
    }
    if (!agreed) {
      setError("이용약관 및 개인정보처리방침에 동의해야 가입할 수 있습니다.");
      return;
    }

    setLoading(true);
    const sb = createBrowserAuthClient();
    const { data, error: signUpError } = await sb.auth.signUp({ email, password });

    if (signUpError) {
      setLoading(false);
      setError(
        signUpError.message.includes("already registered")
          ? "이미 가입된 이메일입니다."
          : "회원가입에 실패했습니다. 잠시 후 다시 시도해주세요.",
      );
      return;
    }

    if (data.session && data.user) {
      // 이메일 확인이 없는 프로젝트 설정이면 가입과 동시에 세션이 생기므로 바로 기록
      await sb
        .from("user_consent")
        .upsert(
          { user_id: data.user.id, kind: "terms_privacy" },
          { onConflict: "user_id,kind", ignoreDuplicates: true },
        );
      setLoading(false);
      router.replace("/mypage");
      router.refresh();
      return;
    }
    setLoading(false);
    // 이메일 확인이 필요한 프로젝트 설정인 경우 — 동의 기록은 최초 로그인 시점에 처리(/login)
    setNotice("가입 확인 이메일을 보냈습니다. 메일함을 확인한 뒤 로그인해주세요.");
  }

  return (
    <main className="mx-auto max-w-sm px-5 py-16">
      <Link href="/" className="text-sm text-gray-500 hover:underline">
        ← GunGang
      </Link>
      <h1 className="mt-4 text-xl font-bold">회원가입</h1>
      <p className="mt-1 text-sm text-gray-500">
        섭취 중인 영양제를 등록하고 중복·상한 초과를 확인하려면 계정이 필요합니다.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div>
          <label className="text-xs font-medium text-gray-500" htmlFor="email">
            이메일
          </label>
          <input
            id="email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-500" htmlFor="password">
            비밀번호 (8자 이상)
          </label>
          <input
            id="password"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-500" htmlFor="passwordConfirm">
            비밀번호 확인
          </label>
          <input
            id="passwordConfirm"
            type="password"
            required
            autoComplete="new-password"
            value={passwordConfirm}
            onChange={(e) => setPasswordConfirm(e.target.value)}
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900"
          />
        </div>

        <label className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
          <input
            type="checkbox"
            required
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className="mt-0.5 h-4 w-4 shrink-0"
          />
          <span>
            <Link href="/terms" target="_blank" className="text-blue-600 hover:underline dark:text-blue-400">
              이용약관
            </Link>{" "}
            및{" "}
            <Link href="/privacy" target="_blank" className="text-blue-600 hover:underline dark:text-blue-400">
              개인정보처리방침
            </Link>
            에 동의합니다 (필수)
          </span>
        </label>

        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
        {notice && <p className="text-sm text-green-700 dark:text-green-400">{notice}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-full bg-gray-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-gray-700 disabled:opacity-50 dark:bg-white dark:text-gray-900"
        >
          {loading ? "가입 중…" : "회원가입"}
        </button>
      </form>

      <p className="mt-4 text-center text-sm text-gray-500">
        이미 계정이 있으신가요?{" "}
        <Link href="/login" className="font-medium text-blue-600 hover:underline dark:text-blue-400">
          로그인
        </Link>
      </p>
    </main>
  );
}
