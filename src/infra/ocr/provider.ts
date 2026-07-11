/**
 * OCR 제공자 어댑터 — D-004: 구현은 Phase 4. 인터페이스만 선분리.
 * 후보: CLOVA OCR / Google Vision / Textract (한국어 라벨 인식 성능 비교 후 결정).
 */
export interface OcrProvider {
  readonly name: string;
  extractLabel(image: { bucket: string; path: string }): Promise<{
    rawText: string;
    confidence: number;
  }>;
}
