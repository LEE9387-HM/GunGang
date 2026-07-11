/**
 * BASE_STANDARD(기준·규격) 텍스트에서 성분 함량을 추출하는 파서.
 *
 * 식약처 건강기능식품정보 API는 함량을 구조화 필드가 아니라 기준규격 텍스트로 제공한다
 * (실사: 볼트 research/data-sources-check.md). 447건 코퍼스에서 확인된 표기 변형:
 *   P1 표준:   "아연: 표시량(5mg/2,000mg)의 80~120%"
 *   P1 변형:   "비타민D : 표시량 (15 ug/g)의 80~180%"           — 기준량 수치 생략(/g)
 *   P1 변형:   "비타민D : 표시량 ｛100ug/500mg의 80~180%｝"      — 전각 괄호, 한정어가 괄호 안
 *   P1 변형:   "비타민D: 표시량 {125㎍(5000IU)/300mg}의 80~180%" — IU 병기 중첩 괄호
 *   P1 변형:   "비타민D(%) : 표시량(10㎍/2,400mg)의 80~180%"     — 라벨 뒤 괄호 접미
 *   P2 역순:   "비타민D : 10 ㎍ / 2 g (표시량의 80-180%)"        — 수치가 앞, 표시량이 뒤
 *   P3 축약:   "비타민D : 200 μg/g (80~180%)"                   — 표시량 키워드 없음, 범위 있음
 *   P4 선행:   "비타민D : 표시량의 80~180% (표시량 : 10μg/1,600mg)" — 한정어가 먼저
 *   P5 순수:   "비타민 D : 125 ㎍ / 500 mg"                     — 수치/기준량만
 *
 * 원문 보존 원칙(D-010): 추출 실패 시 임의 추정하지 않고 항목을 버린다.
 * 실패한 제품은 파이프라인에서 needs_review로 흘러간다.
 */

export interface ParsedAmount {
  /** 정제된 성분 라벨 (번호·성상 접두 제거) */
  label: string;
  amount: number;
  /** 정규화 표기 단위 (μg, mg, g, IU, CFU, mgα-TE, μgRE, μgRAE, μgDFE …) */
  unit: string;
  /** 기준량 수치 — "/g"처럼 수치 생략 시 1 */
  per: number | null;
  perUnit: string | null;
  /** "80~120%", "이상", "이하" 등 허용 범위 한정어 */
  qualifier: string | null;
  /** exact = 표시량 키워드 기반, loose = 축약 표기 추정 */
  confidence: "exact" | "loose";
  /** 매칭된 원문 조각 (근거 표시 원칙 2.3) */
  raw: string;
}

/** 품질·오염물질 규격 라벨 — 함량이 아니므로 제외 */
const QUALITY_LABELS =
  /성상|색택|대장균|세균|진균|곰팡이|효모|붕해|수분|이물|산가|과산화물가|납|카드뮴|비소|수은|중금속|잔류농약|벤조피렌|멜라민|방사능|산도|포장|pH/i;

/** P5(순수형)에서 허용하는 영양 단위 — 오탐 방지용 화이트리스트 */
const NUTRIENT_UNITS = /^(μg|mg|g|IU|CFU|mL|mgα-TE|mga-TE|μgRE|μgRAE|μgDFE|mgNE|억)$/i;
const PER_UNITS = /^(μg|mg|g|mL|캡슐|정|포)$/i;

const NUM = String.raw`\d[\d,]*(?:\.\d+)?`;
// 단위: 공백·괄호·슬래시·숫자·콜론·물결 제외 연속 문자 (α-TE 같은 복합 단위 허용)
const UNIT = String.raw`[^\s/()\d:：,~%]+`;
const RANGE = String.raw`(${NUM}\s*~\s*${NUM}\s*%?)`;
// 라벨: 콜론·괄호·개행 제외 + 뒤에 "(MSM)", "(%)" 같은 괄호 접미 허용 (비캡처)
const LABEL = String.raw`([^\n:：()]{1,60}?)(?:\s*\([^()\n:：]{0,30}\))*`;

// P1: 라벨: 표시량(수치 단위[/기준 단위]) [의 범위|이상|이하] — 한정어 괄호 안/밖 모두
const P1 = new RegExp(
  LABEL +
    String.raw`\s*[:：]\s*표시량\s*\(\s*(${NUM})\s*(${UNIT})\s*(?:/\s*(${NUM})?\s*(${UNIT}))?\s*(?:의\s*${RANGE})?\s*\)\s*(?:의\s*${RANGE}|(이상|이하))?`,
  "g",
);

// P2: 라벨: 수치 단위 / [기준수치] 기준단위 (표시량의 범위)
const P2 = new RegExp(
  LABEL +
    String.raw`\s*[:：]\s*(${NUM})\s*(${UNIT})\s*/\s*(${NUM})?\s*(${UNIT})\s*\(\s*표시량의?\s*${RANGE}?\s*\)`,
  "g",
);

// P3: 라벨: 수치 단위/[기준수치]기준단위 (범위%) — 표시량 키워드 없음, 범위 필수
const P3 = new RegExp(
  LABEL + String.raw`\s*[:：]\s*(${NUM})\s*(${UNIT})\s*/\s*(${NUM})?\s*(${UNIT})\s*\(\s*${RANGE}\s*\)`,
  "g",
);

// P4: 라벨: 표시량의 범위 (표시량 : 수치 단위 / [기준수치] 기준단위)
const P4 = new RegExp(
  LABEL +
    String.raw`\s*[:：]\s*표시량의?\s*${RANGE}\s*\(\s*표시량\s*[:：]?\s*(${NUM})\s*(${UNIT})\s*(?:/\s*(${NUM})?\s*(${UNIT}))?\s*\)`,
  "g",
);

// P5: 라벨: 수치 단위 / [기준수치] 기준단위 — 한정어 없음 (영양 단위 화이트리스트로 오탐 방지)
const P5 = new RegExp(
  LABEL + String.raw`\s*[:：]\s*(${NUM})\s*(${UNIT})\s*/\s*(${NUM})?\s*(${UNIT})`,
  "g",
);

function normalizeText(text: string): string {
  return (
    text
      .replace(/[｛［{[（]/g, "(")
      .replace(/[｝］}\]）]/g, ")")
      .replace(/[∼～]/g, "~")
      // "125㎍(5000IU)" 병기 괄호 제거 — 중첩 괄호가 패턴을 깨뜨림
      .replace(/\(\s*[\d,.]+\s*IU\s*\)/gi, "")
      // 숫자 사이 하이픈만 범위 기호로 (mgα-TE의 하이픈은 보존)
      .replace(/(\d)\s*[-–]\s*(?=\d)/g, "$1~")
      .replace(/ /g, " ")
  );
}

function normalizeUnit(u: string): string {
  const t = u
    .replace(/[㎍µ]/g, "μg")
    .replace(/^ug/i, "μg")
    .replace(/㎎/g, "mg")
    .replace(/㎖/g, "mL");
  return t.replace(/^μgg$/, "μg");
}

function cleanLabel(label: string): string {
  let s = label;
  // 직전 항목의 잔여물 제거: 마지막 번호 마커("5." "5)" "③") 뒤부터가 실제 라벨
  const marker = /(?:\d{1,2}\s*[.)]|[①-⑳])\s*/g;
  let cut = -1;
  let m: RegExpExecArray | null;
  while ((m = marker.exec(s)) !== null) cut = m.index + m[0].length;
  if (cut >= 0) s = s.slice(cut);
  // 직전 항목의 판정어 잔여("…이하", "…음성") 뒤부터
  const resid = /(?:이상|이하|음성|적합)\s*/g;
  cut = -1;
  while ((m = resid.exec(s)) !== null) cut = m.index + m[0].length;
  if (cut >= 0) s = s.slice(cut);
  return s
    .replace(/^[\s\d.)(①-⑳○●▶•·\-*,%~]+/, "")
    .replace(/\s+/g, " ")
    .trim();
}

function toNumber(s: string): number {
  return Number.parseFloat(s.replace(/,/g, ""));
}

interface RawMatch {
  index: number;
  length: number;
  entry: ParsedAmount;
}

type Core = Omit<ParsedAmount, "label" | "confidence" | "raw"> | null;

function collect(
  re: RegExp,
  text: string,
  confidence: "exact" | "loose",
  map: (m: RegExpExecArray) => Core,
): RawMatch[] {
  const out: RawMatch[] = [];
  re.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    const label = cleanLabel(m[1] ?? "");
    if (!label || QUALITY_LABELS.test(label)) continue;
    const core = map(m);
    if (!core || Number.isNaN(core.amount)) continue;
    if (core.perUnit && /^kg$/i.test(core.perUnit)) continue; // 오염물질 기준(mg/kg)
    out.push({
      index: m.index,
      length: m[0].length,
      entry: { label, confidence, raw: m[0].trim(), ...core },
    });
  }
  return out;
}

/** 기준규격 텍스트에서 성분 함량 엔트리를 전부 추출한다. */
export function parseBaseStandard(input: string): ParsedAmount[] {
  const text = normalizeText(input);
  const matches: RawMatch[] = [
    ...collect(P1, text, "exact", (m) => ({
      amount: toNumber(m[2] ?? ""),
      unit: normalizeUnit(m[3] ?? ""),
      per: m[4] ? toNumber(m[4]) : m[5] ? 1 : null,
      perUnit: m[5] ? normalizeUnit(m[5]) : null,
      qualifier: m[6] ?? m[7] ?? m[8] ?? null,
    })),
    ...collect(P2, text, "exact", (m) => ({
      amount: toNumber(m[2] ?? ""),
      unit: normalizeUnit(m[3] ?? ""),
      per: m[4] ? toNumber(m[4]) : 1,
      perUnit: normalizeUnit(m[5] ?? ""),
      qualifier: m[6] ?? null,
    })),
    ...collect(P4, text, "exact", (m) => ({
      amount: toNumber(m[3] ?? ""),
      unit: normalizeUnit(m[4] ?? ""),
      per: m[5] ? toNumber(m[5]) : m[6] ? 1 : null,
      perUnit: m[6] ? normalizeUnit(m[6]) : null,
      qualifier: m[2] ?? null,
    })),
    ...collect(P3, text, "loose", (m) => ({
      amount: toNumber(m[2] ?? ""),
      unit: normalizeUnit(m[3] ?? ""),
      per: m[4] ? toNumber(m[4]) : 1,
      perUnit: normalizeUnit(m[5] ?? ""),
      qualifier: m[6] ?? null,
    })),
    ...collect(P5, text, "loose", (m) => {
      const unit = normalizeUnit(m[3] ?? "");
      const perUnit = normalizeUnit(m[5] ?? "");
      // 화이트리스트 밖 단위는 함량으로 보지 않는다 (오탐 방지)
      if (!NUTRIENT_UNITS.test(unit) || !PER_UNITS.test(perUnit)) return null;
      return {
        amount: toNumber(m[2] ?? ""),
        unit,
        per: m[4] ? toNumber(m[4]) : 1,
        perUnit,
        qualifier: null,
      };
    }),
  ];

  // 겹치면 exact 우선, 같은 신뢰도면 더 긴 매칭 우선
  const rank = (r: RawMatch) => (r.entry.confidence === "exact" ? 0 : 1);
  matches.sort((a, b) => a.index - b.index || rank(a) - rank(b) || b.length - a.length);
  const taken: RawMatch[] = [];
  for (const cand of matches) {
    const overlaps = taken.some(
      (t) => cand.index < t.index + t.length && t.index < cand.index + cand.length,
    );
    if (!overlaps) taken.push(cand);
  }
  return taken.sort((a, b) => a.index - b.index).map((t) => t.entry);
}
