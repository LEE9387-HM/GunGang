# Changelog

이 프로젝트의 사용자 관점 변경 사항을 기록한다. [Keep a Changelog](https://keepachangelog.com/ko/) 형식을 따른다.

## [Unreleased]

### Added
- BASE_STANDARD(기준규격) 텍스트 함량 파서 (`src/ingestion`)
- gstack 스킬 라우팅 규칙 (CLAUDE.md)
- README 식약처 API 인증키 발급 안내

### Changed
- CI: actions/checkout, setup-node v4 → v5

## [0.1.0] - 2026-07-11

### Added
- 프로젝트 스캐폴딩: Next.js 15 + TypeScript strict + Tailwind v4 + vitest
- 레이어 구조: app / server / domain(순수 TS) / infra / ingestion
- domain 실구현: units(IU↔μg 변환), pricing(1일 비용·단위당 가격)
- LLM/OCR 어댑터 인터페이스
- 식약처 공공데이터 검증 스크립트 (`scripts/verify_data_sources.py`)
- GitHub Actions CI (typecheck·lint·test·build)
