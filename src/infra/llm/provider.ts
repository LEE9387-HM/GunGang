/**
 * LLM 제공자 어댑터 (Claude/OpenAI/Gemini 교체 가능 — docs/02-architecture.md).
 * 절대 원칙 2: 설명·요약·번역·검수 지원만. 계산·판정에 사용 금지.
 * 모든 호출은 usage 로그(모델, 프롬프트 버전, 목적, 비용, 노출 여부)에 기록한다.
 * 사용자 개인정보는 입력에 포함하지 않는다 (docs/07-security-and-privacy.md 4장).
 */
export interface LlmProvider {
  readonly name: string;
  explain(input: {
    purpose: "product-summary" | "comparison-summary" | "claim-translation";
    promptVersion: string;
    data: unknown;
  }): Promise<string>;
}
