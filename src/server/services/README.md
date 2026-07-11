# Application Layer (services)

유스케이스 조립: repository(infra)에서 읽고 → domain 순수 함수로 계산 → 저장/응답.
Phase 2 구현 예정: productService, compareService, pricingService / Phase 3: supplementService, analysisService.
Route Handler(src/app/api)는 얇게 유지하고 여기의 서비스만 호출한다.
