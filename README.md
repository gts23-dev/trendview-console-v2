# TrendView Console

매체별 수집·게시 콘텐츠와 통계를 관리하는 운영 콘솔입니다. Vue 2로 만든 기존 콘솔을 React·TypeScript 스택으로 옮기는 중입니다.

UI는 Metronic 9.4.7을 기반으로 하며 React, TypeScript, Vite, Tailwind CSS를 사용합니다. 서버 데이터는 TanStack Query, 폼은 React Hook Form, 테이블은 TanStack Table, 차트는 Recharts로 구성합니다.

- 무엇을 어떤 순서로 옮기는지: [이관 계획](docs/migration-plan.md)
- 코드 작성 기준: [개발 컨벤션](docs/conventions.md)

## 현재 상태

**Phase 1 완료.** 

### 조회만 가능합니다

개발용 서버가 없어 실제 운영 데이터에 붙습니다. **변경 요청은 서버에 도달하지 않습니다.**

`src/shared/api/client.ts`가 `src/shared/api/read-only-fetcher.ts`를 주입하고, 이 fetcher는 `GET`·`HEAD`와 읽기용 POST 두 건(`oauth/token`, `api/v1/admin/log`)만 통과시킵니다. 나머지는 전송 전에 막고 화면 동작 확인을 위해 204로 답합니다. 설정값으로 끄고 켜는 방식이 아니라 쓰기 경로가 없는 fetcher를 주입하는 방식이며, `tests/auth-adapter.test.ts`가 이 연결을 검사합니다.

막힌 요청은 서버 상태를 바꾸지 않으므로 저장 후 목록을 다시 불러와도 값이 그대로입니다. 예상된 동작입니다. 쓰기는 UI/UX를 확정한 뒤 Phase 5에서 엽니다.

## 빠른 시작

Node.js 24(LTS) 권장. 22.12 이상 필요합니다. `.nvmrc`에 24를 지정했습니다.

```bash
npm ci
cp .env.example .env.local   # API 주소와 oauth client 값을 채웁니다
npm run dev
```

[http://127.0.0.1:8080](http://127.0.0.1:8080)에서 실행됩니다. 포트는 `vite.config.ts`에서 바꿀 수 있고, 바꿀 때는 `playwright.config.ts`의 테스트 주소도 함께 맞춥니다.

로그인은 실제 운영자 계정을 사용합니다. `VITE_API_BASE_URL`, `VITE_OAUTH_CLIENT_ID`, `VITE_OAUTH_CLIENT_SECRET`이 없으면 로그인할 수 없습니다.

## 프로젝트 구조

```text
src/
  components/
    ui/                 기본 UI 부품
    common/             업무와 무관한 조합 부품
    layouts/            사이드바, 헤더, 본문 레이아웃
  config/               메뉴와 앱 설정
  shared/
    api/                HTTP client, 토큰 보관, 변경 요청 차단
    query/              QueryClient 공통 설정
    errors/             공통 오류
    logger/             공통 로그
    utils/              공통 순수 함수
  features/
    auth/               로그인, 세션, 등급 판단
    medias/             매체 코드, 전역 매체 범위, 스토리지 URL
  pages/
    login/              로그인 화면
  routing/              라우트 설정
  styles/               전역 스타일과 디자인 토큰
```

`pages`는 URL 화면, `features`는 업무 기능, `shared`는 업무를 모르는 기반, `components`는 공통 UI입니다. 폴더별 책임과 허용하는 의존 방향은 [개발 컨벤션](docs/conventions.md)에 있습니다.

## 알아둘 규칙

- **매체는 전역 조회 범위입니다.** 선택기는 헤더에 하나만 두고 모든 화면이 같은 값을 씁니다. 값의 단일 출처는 URL의 `media`이며 저장된 마지막 선택은 기본값으로만 씁니다. 화면에서는 `useMediaScope()`를 사용합니다.
- **매체 영문 코드**는 서버가 요구하는 `TV` 헤더 값이고 이미지 스토리지 URL을 고르는 열쇠입니다. 대응표는 `src/features/medias/model/media-codes.ts` 한 곳에만 둡니다. 신규 매체가 생기면 이 파일을 고칩니다.
- **등급 판단**은 `isAdminGrade()` 한 곳에서만 합니다.
- **검색·필터·정렬·페이지는 URL**, 서버 데이터는 TanStack Query, 폼 입력은 React Hook Form, 선택과 다이얼로그는 컴포넌트 상태로 관리합니다.

배포 서버는 SPA history fallback을 `/index.html`로 설정해야 직접 URL 접근과 새로고침이 동작합니다.

## 검증

```bash
npm run format
npm run check
npm run test:coverage
npm run build
npx playwright install chromium  # 최초 한 번
npm run test:e2e
```

| 명령어                  | 확인 내용                                       |
| ----------------------- | ----------------------------------------------- |
| `npm run format`        | 코드, import, Tailwind class 정렬               |
| `npm run check`         | 타입, lint, 서식, 단위·컨벤션 테스트            |
| `npm run test:coverage` | 권한·매체 범위·HTTP·변경 요청 차단 등 핵심 로직 |
| `npm run build`         | production bundle 생성                          |
| `npm run test:e2e`      | 보호된 라우트, 로그인 입력 검증, 모바일 표시    |

e2e는 로그인 이후 흐름을 다루지 않습니다. 실제 운영 계정이 필요하기 때문입니다. Phase 1부터 화면이 붙으면 테스트 계정 정책을 정해 확장합니다.

## Metronic 사용

기본 UI 부품과 디자인 토큰은 Metronic 9.4.7을 기반으로 합니다. Metronic은 유료 자산이므로 회사가 보유한 라이선스와 적용 범위 안에서 사용해야 합니다.
