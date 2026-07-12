/**
 * 원료 형태·유래 추출 (순수 함수, 규칙 기반).
 *
 * 핵심 기능성 성분이 "어떤 원료 형태냐"를 제품명·기준규격에서 식별한다.
 * 예: 오메가3 → rTG / 식물성(조류) / 어류, 비타민D → D3 / D2 / 버섯유래.
 *
 * 원칙: 근거(제품명·기준규격 텍스트)가 있을 때만 태깅한다. 미표기를 특정 형태로
 * 단정하지 않는다 (예: "알티지" 없다고 TG로 확정하지 않음). 근거 표시 원칙(2.3).
 */

export type FormKind = "form" | "source" | "type";

export interface FormTag {
  kind: FormKind;
  label: string;
  /** 매칭 근거 (어느 텍스트의 어떤 표현에서 나왔는지) */
  evidence: string;
}

interface Rule {
  kind: FormKind;
  label: string;
  pattern: RegExp;
}

const RULES: Record<string, Rule[]> = {
  omega3: [
    // 제형 (rTG 규칙을 먼저 두어 우선 매칭. TG는 rTG가 아닐 때만)
    { kind: "form", label: "rTG", pattern: /알티지|알티G|rTG/i },
    { kind: "form", label: "TG", pattern: /트리글리세리드|(?<![rR])TG\s*오메가/i },
    { kind: "form", label: "EE(에틸에스터)", pattern: /에틸에스[테터]|(?<![a-z])EE(?![a-z])/i },
    // 유래
    { kind: "source", label: "식물성(조류)", pattern: /식물성|조류|알가|비건|vegan/i },
    { kind: "source", label: "크릴", pattern: /크릴/i },
    { kind: "source", label: "어류", pattern: /피쉬|어유|피시오일|fish\s*oil/i },
  ],
  "vitamin-d": [
    { kind: "type", label: "비타민 D3", pattern: /(?<![a-z])D\s*3|디\s*3|콜레칼시페롤/i },
    { kind: "type", label: "비타민 D2", pattern: /(?<![a-z])D\s*2|디\s*2|에르고칼시페롤/i },
    { kind: "source", label: "버섯·효모 유래", pattern: /버섯|표고|효모/i },
    { kind: "source", label: "식물성", pattern: /식물성|지의|라이[켄크]/i },
  ],
};

/**
 * 제품명(우선)과 기준규격 텍스트에서 원료 형태 태그를 추출.
 * 같은 label 중복 제거, 근거는 최초 매칭 텍스트 기준.
 */
export function extractIngredientForm(
  categorySlug: string | null,
  productName: string,
  baseStandard: string | null,
): FormTag[] {
  if (!categorySlug) return [];
  const rules = RULES[categorySlug];
  if (!rules) return [];

  const sources: Array<{ text: string; origin: string }> = [
    { text: productName, origin: "제품명" },
    { text: baseStandard ?? "", origin: "기준규격" },
  ];

  const seen = new Set<string>();
  const tags: FormTag[] = [];
  for (const rule of rules) {
    for (const src of sources) {
      const m = src.text.match(rule.pattern);
      if (m) {
        if (!seen.has(rule.label)) {
          seen.add(rule.label);
          tags.push({ kind: rule.kind, label: rule.label, evidence: `${src.origin}: "${m[0]}"` });
        }
        break; // 이 규칙은 첫 근거만
      }
    }
  }
  return tags;
}
