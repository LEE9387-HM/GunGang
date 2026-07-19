/**
 * 구매가이드 콘텐츠 (카테고리별 "고르는 법").
 *
 * 목적: 우리가 이미 가진 데이터 축(함량·형태·가성비·중복)을 "왜/어떻게 봐야 하는지" 가르쳐
 *       사용자가 스스로 판단하게 돕는다. 각 기준은 기존 랭킹/필터/중복분석 화면으로 연결한다.
 *
 * 절대원칙 (docs/CLAUDE.md · master-prompt 2장):
 * - 추천보다 검증: "이 제품이 최고"라는 픽을 하지 않는다. 기준과 그 기준의 데이터로 연결만.
 * - 의료행위 회피: 효능·치료·복용중단 서술 금지. 함량·형태·가격·중복이라는 사실 축에만 머문다.
 * - 근거·정직: 우리가 데이터로 제공 못 하는 축은 숨기지 말고 명시한다(cannotProvide).
 * - 콘텐츠는 사람이 검수한다(reviewed). LLM은 초안·정리만.
 */

export interface GuideCTA {
  label: string;
  href: string;
}

export interface GuideChapter {
  title: string;
  subtitle?: string;
  paras: string[];
  /** 과장·함정 간파 콜아웃 */
  trap?: string;
  /** 이 기준을 실제 데이터로 확인하러 가는 링크 */
  cta?: GuideCTA;
}

export interface Guide {
  /** 카테고리 slug (product-service CATEGORY_NAMES 키와 일치) */
  slug: string;
  title: string;
  /** 한 줄 소개 */
  intro: string;
  /** "바쁘면 이것만" 실행요약 */
  tldr: string[];
  chapters: GuideChapter[];
  /** 우리가 데이터로 제공하지 못하는 축 (정직하게 명시) */
  cannotProvide?: string;
  /** 사람 검수 여부·일자 (미검수 초안은 노출 전 검토) */
  reviewed: boolean;
  updated: string;
}

const OMEGA3: Guide = {
  slug: "omega3",
  title: "오메가3 고르는 법",
  intro:
    "오메가3는 표기 방식이 제각각이라 숫자만 보면 비교가 어렵습니다. 실제로 비교해야 하는 축은 네 가지입니다.",
  tldr: [
    '"1000mg"에 속지 마세요 — 어유(원료) 양이 아니라 EPA+DHA 합을 봐야 합니다.',
    "형태(rTG·TG·EE)는 순도·흡수의 참고 지표지만, 제품에 표기된 경우에만 확인됩니다.",
    "가격은 통 크기가 아니라 1일 섭취비용(하루치 가격)으로 비교하세요.",
    "종합비타민 등 다른 제품에도 EPA·DHA가 들어가면 합산됩니다 — 중복 분석으로 확인하세요.",
  ],
  chapters: [
    {
      title: "1. EPA+DHA 실함량",
      subtitle: "원료(어유) 양이 아니라 기능성분의 합",
      paras: [
        "오메가3에서 실제로 몸에 작용하는 핵심은 EPA와 DHA입니다. 그런데 제품 앞면의 큰 숫자(예: 「1000mg」)는 EPA+DHA의 합이 아니라 어유(원료) 전체 양인 경우가 많습니다. 같은 「1000mg」이라도 그중 EPA+DHA가 500mg인 제품과 900mg인 제품은 전혀 다릅니다.",
        "그래서 비교의 출발점은 항상 EPA와 DHA의 합입니다. GunGang의 함량 랭킹은 제품 표시사항에서 EPA+DHA 합을 뽑아 같은 기준으로 정렬하므로, 앞면 숫자에 휘둘리지 않고 실함량을 바로 비교할 수 있습니다.",
      ],
      trap: "앞면 「○○mg」이 어유량인지 EPA+DHA 합인지 확인하세요. 상세 표시사항의 '기능성분/지표성분' 항목이 진짜 비교 기준입니다.",
      cta: { label: "EPA+DHA 함량순 Top10 보기", href: "/search?category=omega3&sort=amount" },
    },
    {
      title: "2. 형태 (rTG · TG · EE)",
      subtitle: "순도·흡수의 참고 지표 — 표기가 있을 때만",
      paras: [
        "오메가3는 가공 형태에 따라 rTG(재에스테르화 트리글리세라이드), TG(트리글리세라이드), EE(에틸에스테르) 등으로 나뉩니다. 일반적으로 rTG는 고농축·고순도 제품에서 많이 쓰이고, EE는 상대적으로 저가 원료에 흔합니다. 형태에 따라 순도와 흡수율에 차이가 있다고 알려져 있습니다.",
        "다만 형태는 제품 표시에 명시된 경우에만 알 수 있습니다. GunGang은 제품명·표시사항에 형태가 표기된 경우에만 태깅하고, 표기가 없으면 추정하지 않습니다. 식물성(조류) 유래는 어류를 피하는 분들을 위한 선택지입니다.",
      ],
      trap: "형태 표기가 없다고 나쁜 제품은 아닙니다. 다수 제품이 형태를 표기하지 않으며, 이 경우 GunGang은 '표기 없음'으로 둡니다.",
      cta: {
        label: "형태별로 걸러 보기 (rTG·TG·식물성·어류)",
        href: "/search?category=omega3&sort=amount&form=rTG",
      },
    },
    {
      title: "3. 1일 섭취비용 (가성비)",
      subtitle: "통 크기·총 가격이 아니라 하루치 가격",
      paras: [
        "큰 통이 무조건 싼 것은 아닙니다. 제품마다 1일 섭취량(캡슐 수)과 함량이 다르기 때문에, 총 가격만 보면 착시가 생깁니다. 제대로 된 비교는 '하루치 가격' 또는 'EPA+DHA 100mg당 가격'입니다.",
        "GunGang은 실시간 판매가를 직접 수집하지 않습니다(공개 가격 API가 없어 임의 수집 시 오차·오매칭 위험이 큽니다). 대신 제품 상세에 '네이버 쇼핑에서 최저가 검색' 링크를 제공해, 사용자가 현재 최저가를 직접 확인하도록 안내합니다. 가격은 함량 등급이나 노출 순위에 영향을 주지 않는, 별도의 비교 축입니다.",
      ],
      trap: "'대용량 O개월분'이 저렴해 보여도, 하루치로 환산하면 소용량이 더 쌀 수 있습니다. 검색결과의 가격이 몇 개월분인지 꼭 확인하세요.",
      cta: { label: "제품 상세에서 최저가 검색", href: "/search?category=omega3&sort=amount" },
    },
    {
      title: "4. 중복 섭취 주의",
      subtitle: "다른 제품과 EPA·DHA가 겹치는지",
      paras: [
        "오메가3만 따로 먹는 게 아니라, 종합비타민이나 눈 건강·혈행 관련 복합 제품에도 EPA·DHA가 들어 있는 경우가 있습니다. 여러 제품을 함께 먹으면 EPA·DHA 섭취량이 생각보다 커질 수 있습니다.",
        "GunGang의 중복 분석은 함께 먹는 제품들을 골라 같은 성분의 합산량을 보여줍니다. 회원 가입 없이 익명으로 확인할 수 있습니다.",
      ],
      cta: { label: "중복 섭취 분석 해보기", href: "/analyze" },
    },
  ],
  cannotProvide:
    "산패도(TOTOX)·비린내·캡슐 크기 같은 항목은 공개 데이터에 없어 GunGang이 수치로 제공하지 못합니다. 이런 항목은 제품 상세페이지와 실제 구매 후기에서 확인하세요.",
  reviewed: false,
  updated: "2026-07-20",
};

export const GUIDES: Record<string, Guide> = {
  omega3: OMEGA3,
};

export function getGuide(slug: string): Guide | null {
  return GUIDES[slug] ?? null;
}

export function hasGuide(slug: string): boolean {
  return slug in GUIDES;
}
