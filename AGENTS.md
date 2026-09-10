# 보일러플레이트 작업 기준

- 코드 작성 전에 [코드 컨벤션](docs/conventions.md)을 읽고 따른다. 문서가 이 프로젝트의 컨벤션 기준이다.
- 기본 흐름은 page → feature hook → feature API → shared HTTP client이다.
- page는 feature의 `index.ts`만 사용하고, feature는 page와 routing을 참조하지 않으며, shared는 업무와 화면 계층을 참조하지 않는다.
- 화면에는 성공 알림만 두고 변경 요청 실패는 공통 Query 설정에서 처리한다.
- Metronic 기본 부품 안에 업무 로직을 넣지 않는다. 예제의 인증·데이터·역할은 실제 서비스 계약으로 간주하지 않는다.
- 변경 후 `npm run check`, `npm run build`를 확인한다. 데이터·권한 변경은 `npm run test:coverage`, 사용자 동작 변경은 `npm run test:e2e`도 확인한다.
- 규칙 변경은 `docs/conventions.md`, 검사 설정, 예제 코드를 함께 맞춘다. 적용 범위가 명확한 예외는 문서에 이유를 남긴다.
- 요청하지 않은 서비스별 인증·API·배포 정책을 추가하지 않는다.
