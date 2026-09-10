# Admin Console Boilerplate

Admin Console을 시작할 때 사용하는 기본 프로젝트입니다. 공통 레이아웃과 UI, 인증 교체 지점, 목록·상세·등록·수정 예제, 데이터 처리와 검증 도구가 준비되어 있습니다.

UI는 Metronic 9.4.7을 기반으로 하며 React, TypeScript, Vite, Tailwind CSS를 사용합니다. 서버 데이터는 TanStack Query, 폼은 React Hook Form, 테이블은 TanStack Table, 차트는 Recharts로 구성합니다.

## 빠른 시작

Node.js 24(LTS) 권장. 22.12 이상 필요합니다. `.nvmrc`에 24를 지정했습니다.

```bash
npm ci
npm run dev
```

[http://127.0.0.1:3300](http://127.0.0.1:3300)에서 실행됩니다. `3300`은 이 프로젝트의 기본 개발 포트이며 프로젝트 환경에 맞게 `vite.config.ts`에서 변경할 수 있습니다. 변경할 때는 `playwright.config.ts`의 테스트 주소도 함께 맞춥니다.

로그인 화면에서 관리자 또는 조회 전용 역할을 선택하고 **데모 시작하기**를 누르면 별도 계정과 API 없이 기능을 확인할 수 있습니다.

## 기본 제공 기능

- 반응형 사이드바, 헤더, 본문, 모바일 메뉴
- 인증 상태 확인, 로그인·로그아웃, 보호된 라우트, 역할별 화면 제어
- 목록 검색, 상태 필터, 정렬, 페이지 이동, 항목 선택과 삭제
- URL로 열리는 상세 패널과 목록 조건 복원
- 등록·수정 폼 검증, 저장 중 중복 요청 방지, 미저장 이탈 확인
- 대시보드 지표와 차트
- 로딩, 빈 결과, 오류, 확인 창, 성공·실패 알림
- UI 컴포넌트와 개발 가이드 화면
- 타입, 코드 서식, 폴더 참조, 오류 처리에 대한 자동 검사

데모 콘텐츠는 현재 브라우저 탭의 `sessionStorage`에 저장됩니다. 실제 서비스나 외부 서버에는 영향을 주지 않으며 탭을 닫으면 사라집니다. 개발 가이드에서 기본 데이터로 초기화할 수 있습니다.

## 프로젝트 구조

```text
src/
  components/
    ui/                 기본 UI 부품
    common/             업무와 무관한 조합 부품
    layouts/            사이드바, 헤더, 본문 레이아웃
  config/               메뉴와 앱 설정
  shared/
    api/                HTTP client
    query/              QueryClient 공통 설정
    errors/             공통 오류
    logger/             공통 로그
    utils/              공통 순수 함수
  features/
    auth/               인증 계약, 구현 선택, Provider, 접근 제어
    entries/            콘텐츠 API, 훅, 타입, 업무 UI
  pages/
    dashboard/          대시보드와 차트 예제
    entries/            목록과 등록·수정 URL 화면
    login/              로그인 URL 화면
    components/         UI 컴포넌트 예제
    guide/              개발 가이드
  routing/              라우트 설정
  styles/               전역 스타일과 디자인 토큰
```

`pages`는 URL 화면, `features`는 업무 기능, `shared`는 업무를 모르는 기반, `components`는 공통 UI입니다. 코드 작성 기준과 폴더별 책임은 [Admin Console 개발 컨벤션](docs/conventions.md)을 따릅니다.

## 새 프로젝트에 적용하기

1. `package.json`의 프로젝트 이름과 화면의 서비스 이름을 변경합니다.
2. 실제 인증 adapter를 작성한 뒤 `src/features/auth/adapter.ts`의 export 대상만 교체합니다. `AuthProvider`는 수정하지 않습니다.
3. 서비스의 로그인 입력, 세션 타입과 권한 판단을 API 계약에 맞게 변경합니다. 메뉴와 버튼을 숨기는 프론트엔드 처리는 사용 편의를 위한 것이며 실제 인가는 서버에서 수행합니다.
4. `src/features/entries/api/entries.ts`의 데모 저장 구현을 실제 도메인 API로 교체합니다. 공통 HTTP 요청은 `src/shared/api/http-client.ts`를 사용하고 feature API에서 서버 응답을 검증합니다.
5. `src/features/entries/hooks/use-entries.ts`를 참고해 query key, 조회·변경, 저장 후 캐시 갱신을 연결합니다.
6. `src/config/menu.config.ts`와 `src/routing/app-router.tsx`에 실제 메뉴와 화면을 등록합니다.
7. API 주소 등 공개 가능한 환경 설정은 `.env.example`에 기록합니다. `VITE_*` 값은 브라우저에 공개되므로 비밀키를 넣지 않습니다.
8. 실제 인증과 API 연결이 끝나면 데모 역할 선택, fixture, 초기화 기능과 필요 없는 예제 화면을 제거합니다.

현재 HTTP client는 인증 헤더, 쿠키 전달 방식과 요청 취소를 외부에서 설정할 수 있습니다. 특정 인증 방식, 응답 envelope, 토큰 갱신 정책은 미리 가정하지 않으며 각 서비스의 API 계약에 맞게 연결합니다.

배포 서버는 SPA history fallback을 `/index.html`로 설정해야 직접 URL 접근과 새로고침이 동작합니다.

## 협업 기준

기능 담당자는 해당 feature와 이를 사용하는 page를 함께 관리합니다.

```text
features/<feature>/
  api/
  hooks/
  model/
  components/
  index.ts
pages/<page>/
```

인증, 공통 레이아웃, 메뉴, 라우터, 전역 스타일, 공통 UI, 검사 설정과 의존성 파일은 여러 기능에 영향을 줍니다. 담당자를 정하고 변경 내용을 팀에 공유합니다.

검색·필터·페이지는 URL, 서버 데이터는 TanStack Query, 폼 입력은 React Hook Form, 선택과 다이얼로그는 컴포넌트 상태로 관리합니다. 자세한 코드 규칙과 완료 기준은 [개발 컨벤션](docs/conventions.md)에 있습니다.

## 검증

```bash
npm run format
npm run check
npm run test:coverage
npm run build
npx playwright install chromium  # 최초 한 번
npm run test:e2e
```

| 명령어                  | 확인 내용                                             |
| ----------------------- | ----------------------------------------------------- |
| `npm run format`        | 코드, import, Tailwind class 정렬                     |
| `npm run check`         | 타입, lint, 서식, 단위·컨벤션 테스트                  |
| `npm run test:coverage` | 권한·데이터·HTTP·오류 처리 등 핵심 로직               |
| `npm run build`         | production bundle 생성                                |
| `npm run test:e2e`      | 로그인, 권한, 목록, 상세, 등록·수정·삭제, 모바일 동작 |

`src/components/ui`의 Metronic 기반 구현 형태는 유지할 수 있지만 계층 경계 검사는 적용됩니다. 업무 코드는 해당 feature에 둡니다.

## Metronic 사용

기본 UI 부품과 디자인 토큰은 Metronic 9.4.7을 기반으로 합니다. Metronic은 유료 자산이므로 회사가 보유한 라이선스와 적용 범위 안에서 사용해야 합니다.
