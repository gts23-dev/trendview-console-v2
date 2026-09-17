# Admin Console 개발 컨벤션

Admin Console을 만들고 운영할 때 공통으로 따르는 개발 기준입니다. 특정 서비스의 구현 방식을 설명하지 않으며, 프로젝트가 달라져도 유지할 구조와 협업 규칙을 정의합니다.

목표는 세 가지입니다.

- 같은 종류의 코드를 같은 위치와 형태로 작성해 찾기 쉽게 만듭니다.
- 화면, 데이터 요청, 공통 기능의 책임을 나눠 변경 범위를 줄입니다.
- 자동 검사로 반복적인 실수를 조기에 발견하고 리뷰는 업무 로직에 집중합니다.

인증 방식, API 응답 형식, 권한 값, 업무 메뉴, 배포 환경은 서비스마다 다릅니다. 해당 내용은 각 프로젝트의 명세와 API 계약으로 결정하며 이 문서에서 미리 고정하지 않습니다.

## 1. 기본 기술과 작성 원칙

- React와 TypeScript를 사용하며 TypeScript `strict` 설정을 유지합니다.
- 빌드와 개발 서버는 Vite, 스타일은 Tailwind CSS를 사용합니다.
- 서버 데이터는 TanStack Query, 복잡한 폼은 React Hook Form, 테이블은 TanStack Table을 기본으로 사용합니다.
- UI는 `src/components/ui`의 기본 부품을 우선 사용하고 업무 화면에서 조합합니다.
- 새로운 패키지는 현재 도구로 해결하기 어렵고 반복해서 사용할 필요가 있을 때 추가합니다.
- 한 번 사용할 코드를 미래 사용 가능성만으로 공통화하지 않습니다. 실제 재사용되거나 책임을 분리해야 할 때 이동합니다.
- 규칙과 자동 검사 또는 예제 코드가 다르면 셋을 함께 수정합니다. 문서만 고쳐 실제 코드와 어긋난 상태로 두지 않습니다.

## 2. 디렉터리와 책임

구조를 정하는 기준은 네 문장으로 고정합니다.

- `pages`는 URL로 진입하는 화면입니다.
- `features`는 독립된 업무 기능입니다.
- `shared`는 업무 이름을 모르는 기반 코드입니다.
- `components`는 여러 화면에서 쓰는 UI와 레이아웃입니다.

데이터를 사용하는 기본 흐름은 **page → feature hook → feature API → shared HTTP client**입니다.

```text
src/
  components/
    ui/                 기본 UI 부품
    common/             업무에 종속되지 않은 조합 UI
    layouts/            사이드바, 헤더, 본문 레이아웃
  config/               메뉴와 앱 설정
  shared/
    api/                HTTP client와 전송 기반
    query/              QueryClient 공통 설정
    errors/             공통 오류 타입과 메시지 변환
    logger/             공통 진단 로그
    utils/              업무와 무관한 순수 유틸리티
  features/
    <feature>/
      api/              해당 기능의 서버 요청
      hooks/            해당 기능의 Query와 상태 연결
      model/            타입, schema, mapper, 순수 계산
      components/       해당 기능을 표현하는 재사용 UI
      index.ts          외부에 공개할 항목만 재수출
  pages/                URL 화면 조립과 URL 전용 상태
  routing/              라우트 설정
  styles/               전역 스타일과 디자인 토큰
```

| 위치                                   | 책임                                  | 두지 않는 것                          |
| -------------------------------------- | ------------------------------------- | ------------------------------------- |
| `src/pages/<page>/`                    | URL 상태, 화면 조립, 페이지 전용 동작 | API 구현, 다른 페이지 내부 파일 참조  |
| `src/features/<feature>/api/`          | 요청·응답 검증, API 오류 변환         | React 상태, 토스트, 화면 이동         |
| `src/features/<feature>/hooks/`        | Query key, 조회·변경, 캐시 갱신       | 페이지 이동, 다이얼로그 열림 상태     |
| `src/features/<feature>/model/`        | 업무 타입, schema, mapper, 순수 계산  | React 상태, JSX, 토스트               |
| `src/features/<feature>/components/`   | 업무 의미가 있는 재사용 UI            | 다른 feature 내부 파일 참조           |
| `src/features/<feature>/index.ts`      | feature의 외부 공개 계약              | 외부에 필요 없는 내부 구현            |
| `src/shared/api/`                      | 업무와 무관한 HTTP 전송               | 도메인 endpoint, React 상태, 토스트   |
| `src/shared/query/`                    | QueryClient와 전역 Query 오류 처리    | 도메인 query key                      |
| `src/shared/errors`, `logger`, `utils` | 업무와 무관한 오류·로그·순수 함수     | UI, feature, page 의존성              |
| `src/components/common/`               | 업무 타입을 모르는 조합 UI            | 특정 업무 타입, feature와 page 의존성 |
| `src/components/ui/`                   | 스타일과 접근성을 포함한 기본 UI      | API, 인증, 업무 규칙                  |
| `src/components/layouts/`              | 앱 전체 껍데기와 탐색 레이아웃        | 개별 업무 화면 구현                   |

`page`와 `feature`는 이름이 같을 수 있지만 역할은 다릅니다. `pages/entries/page.tsx`는 `/entries` 화면을 조립하고 URL 검색 조건을 관리합니다. `features/entries`는 그 화면뿐 아니라 대시보드나 다른 화면에서도 사용할 수 있는 조회, 저장, 타입과 상태 UI를 가집니다. 대시보드처럼 여러 기능을 모아 보여주는 화면은 `pages/dashboard`만 있어도 됩니다. 모든 page에 같은 이름의 feature를 만들지 않습니다.

코드 위치는 다음 순서로 판단합니다.

1. 한 파일에서만 사용하면 그 파일 안에 둡니다.
2. URL과 화면 조립에만 필요한 코드는 해당 `pages/<page>`에 둡니다.
3. 한 업무 기능의 API, 타입, 훅, 업무 UI는 `features/<feature>`에 모읍니다.
4. 업무 이름을 제거해도 의미가 같고 여러 곳에서 사용하는 기반은 `shared` 또는 `components`로 옮깁니다.

각 위치에서 허용하는 프로젝트 내부 의존성은 다음과 같습니다.

| 작성 위치                 | import할 수 있는 위치                                      |
| ------------------------- | ---------------------------------------------------------- |
| `routing`                 | pages, layouts, feature 공개 진입점, shared                |
| `pages/<page>`            | 같은 page, components, feature 공개 진입점, shared 기반    |
| `components/layouts`      | components, config, feature 공개 진입점, shared            |
| `features/<feature>`      | 같은 feature, components, shared, 다른 feature 공개 진입점 |
| `components/ui`, `common` | components, shared                                         |
| `shared`                  | shared                                                     |

- page는 feature의 `index.ts` 공개 진입점만 import합니다.
- feature 내부 파일은 같은 feature 안에서 상대 경로로 참조합니다.
- 다른 feature가 필요하면 `@/features/<feature>` 공개 진입점만 참조합니다.
- feature는 `pages`와 `routing`을 import하지 않습니다.
- shared는 `features`, `pages`, `routing`, `components`를 import하지 않습니다.
- `components/ui`와 `components/common`은 feature와 page를 import하지 않습니다.
- `components/layouts`는 feature의 공개 진입점만 import하고 page와 routing을 import하지 않습니다.
- page는 HTTP client와 TanStack Query를 직접 호출하지 않습니다.
- 다른 page의 내부 파일을 import하지 않습니다.

폴더 경계를 넘는 import는 `@/` 별칭을 사용합니다. `index.ts`는 feature의 공개 진입점에만 만들고 나머지 위치에서는 불필요한 재수출 파일을 만들지 않습니다. 사용하지 않는 빈 폴더도 미리 만들지 않습니다.

## 3. 파일과 코드 이름

| 대상                | 규칙                                     | 예                                      |
| ------------------- | ---------------------------------------- | --------------------------------------- |
| 폴더·파일           | kebab-case                               | `user-toolbar.tsx`, `menu.config.ts`    |
| URL에 연결하는 화면 | 폴더의 `page.tsx`                        | `pages/users/form/page.tsx`             |
| 컴포넌트·타입       | PascalCase                               | `UserToolbar`, `UserToolbarProps`       |
| 함수·변수           | camelCase                                | `getUsers`, `handleSave`, `selectedIds` |
| 커스텀 훅           | `use` 접두사                             | `useUserList`, `useSaveUser`            |
| 고정 값·라벨        | UPPER_SNAKE_CASE                         | `PAGE_SIZE`, `STATUS_LABELS`            |
| 동작을 묶은 객체    | camelCase                                | `userKeys`, `logger`, `authAdapter`     |
| 불리언              | `is`, `has`, `can`, `should` 접두사 권장 | `isPending`, `hasSelection`, `canEdit`  |

```tsx
interface UserToolbarProps {
  filters: UserFilters;
  onApply: (filters: UserFilters) => void;
}

export function UserToolbar({ filters, onApply }: UserToolbarProps) {
  // 화면을 렌더링한다.
}
```

- 컴포넌트는 `function` 선언과 named export를 사용합니다.
- `React.FC`와 화살표 함수 형태의 컴포넌트는 사용하지 않습니다. 이벤트 콜백은 화살표 함수를 사용할 수 있습니다.
- `*Props`는 사용하는 컴포넌트 파일 안에 private interface로 둡니다. 다른 파일에서 직접 사용해야 할 때만 export합니다.
- 설정 도구가 요구하는 default export, `lazy()`에 전달하는 `{ default: Component }`, React Error Boundary의 class는 예외입니다.
- 공통 UI의 `open`, `disabled`, `pending` 같은 관용적인 props 이름은 그대로 사용합니다.
- 코드 식별자는 영어로 작성합니다. 사용자에게 보이는 문구와 필요한 코드 주석은 한국어로 작성합니다.
- 코드가 이미 설명하는 내용을 주석으로 반복하지 않습니다. 선택 이유, 업무 규칙, 명확한 예외만 기록합니다.

## 4. 코드 서식과 import

서식은 사람이 직접 맞추지 않고 Prettier에 맡깁니다.

- 들여쓰기 2칸
- 줄 길이 80자 기준
- LF 줄바꿈과 세미콜론 사용
- JavaScript·TypeScript 문자열은 작은따옴표, JSX 속성은 큰따옴표
- trailing comma 사용
- 화살표 함수 인자에 괄호 사용
- Tailwind class와 import 순서 자동 정렬

import는 Node 기본 모듈, React, 외부 패키지, 프로젝트 절대 경로, 상대 경로, 스타일 순으로 정렬합니다. 타입 전용 import는 `import type` 또는 inline `type`을 사용합니다.

`any`, 사용하지 않는 변수·인자, 불필요한 타입 강제 변환을 피합니다. 외부에서 들어오는 값은 `unknown`으로 받고 검증한 뒤 사용합니다.

## 5. 데이터 타입과 검증

타입은 데이터가 어디에서 사용되는지가 아니라 무엇을 표현하는지에 따라 이름을 정합니다.

| 이름          | 의미                           | 기본 위치                           |
| ------------- | ------------------------------ | ----------------------------------- |
| `*Input`      | 저장 API에 전달하는 입력       | `features/<feature>/model/types.ts` |
| `*Data`       | 특정 API 응답 wrapper          | 사용하는 feature API 파일 내부      |
| `*ListItem`   | 목록 표시에 맞게 변환한 데이터 | 해당 feature의 `model`              |
| `*FormValues` | 사용자가 입력 중인 폼 값       | 해당 page의 폼 파일 또는 전용 model |
| `*Filters`    | 기능에서 공유하는 검색 조건    | 해당 feature의 `model`              |
| `*Props`      | 컴포넌트 입력                  | 컴포넌트 파일 내부                  |

- API 데이터와 화면 데이터가 다르면 mapper로 변환합니다.
- 화면에서만 필요한 라벨과 색상을 API 타입에 넣지 않습니다.
- 폼 값과 API 입력이 같으면 type alias로 공유하고, 다를 때만 변환 함수를 만듭니다.
- 사용자 입력, URL, 브라우저 저장소, API 응답 등 외부 데이터의 경계에서 Zod 같은 runtime schema로 검증합니다.
- `request<T>()`의 타입 인자는 실제 응답을 검증하지 않습니다. 도메인 API 함수가 서버 응답을 검증한 뒤 타입이 확정된 값을 반환해야 합니다.

## 6. 서버 데이터와 화면 상태

Query key는 도메인별 객체로 한 곳에서 관리합니다.

```ts
export const userKeys = {
  all: ['users'] as const,
  lists: () => [...userKeys.all, 'list'] as const,
  list: (filters: UserFilters) => [...userKeys.lists(), filters] as const,
  detail: (id: string) => [...userKeys.all, 'detail', id] as const,
};
```

- 서버 응답을 달라지게 하는 페이지·검색·정렬·필터 조건은 query key에 포함합니다.
- 저장 성공 후 필요한 캐시 갱신은 mutation 훅의 `onSuccess`에서 처리합니다.
- 성공 토스트, 모달 닫기, 페이지 이동은 사용자 맥락을 아는 화면에서 처리합니다.
- 저장 실패 알림은 공통 Query 설정에서 한 번만 표시합니다. 화면과 훅에서 같은 실패 토스트를 추가하지 않습니다.
- 화면별 `onError`가 필요하면 필드 오류 연결이나 로컬 상태 복구만 처리합니다.
- 조회 실패는 화면의 Error State와 다시 시도로 표시하고, 전역에서는 진단 로그만 남깁니다.
- 조회 중, 빈 결과, 조회 실패를 서로 다른 상태로 표현합니다.
- 변경 요청은 기본적으로 자동 재시도하지 않습니다. 중복 저장이나 삭제가 발생할 수 있기 때문입니다.

화면 상태의 기본 위치는 다음과 같습니다.

| 상태                      | 관리 위치            |
| ------------------------- | -------------------- |
| 서버에서 받은 데이터      | TanStack Query       |
| 검색·필터·정렬·페이지     | URL search params    |
| 폼 입력과 검증 오류       | React Hook Form      |
| 체크 선택·다이얼로그 열림 | 컴포넌트 local state |
| 로그인 사용자와 전역 권한 | Auth Provider        |

목록 URL의 페이지는 1부터 시작합니다. 테이블 라이브러리의 index가 0부터 시작한다면 연결 지점에서만 변환합니다. 검색·필터·정렬 조건이 바뀌면 페이지를 1로 돌립니다.

상세 화면을 주소로 공유하거나 새로고침 후 복원해야 하면 ID를 URL에 둡니다. 목록으로 돌아올 때 검색 조건과 페이지를 보존합니다.

## 7. 인증과 권한

- `AuthAdapter`는 현재 사용자 조회, 로그인, 로그아웃 계약을 정의합니다.
- `AuthProvider`는 구체적인 인증 구현을 직접 import하지 않고 `features/auth/adapter.ts`의 `authAdapter`만 사용합니다.
- 새 프로젝트에서 인증 방식을 연결할 때는 실제 adapter를 만든 뒤 `features/auth/adapter.ts`의 export 대상만 교체합니다.
- Demo 저장소와 Demo 세션 파서는 `demo-adapter.ts`에만 둡니다. 인증 계약 파일에 데모 구현을 섞지 않습니다.
- 버튼과 메뉴 숨김은 사용자 경험을 위한 프론트엔드 접근 제어입니다. 실제 데이터 인가는 서버가 검증해야 합니다.
- 세션 타입에는 화면에 필요한 최소 정보만 둡니다. 비밀번호, 토큰, 쿠키 값을 로그나 URL에 남기지 않습니다.
- 로그인 실패는 로그인 화면에서 표시합니다. Query를 통하지 않는 인증 요청의 실패 토스트는 사용 위치에 이유와 ESLint 예외를 함께 적습니다.

## 8. 오류와 로그

- API 함수는 실패를 Error로 전달하고 화면 이동이나 토스트를 직접 실행하지 않습니다.
- 사용자에게 표시해도 되는 오류만 `AppError`로 만듭니다.
- 알 수 없는 서버 오류, stack trace, 응답 원문을 사용자에게 그대로 보여주지 않습니다.
- HTTP 상태가 필요한 오류는 `ApiError.status`로 전달합니다.
- 오류를 catch한 뒤 성공한 것처럼 무시하지 않습니다. 복구하거나 상위 계층으로 전달합니다.

로그는 `logger.info`, `logger.warn`, `logger.error`를 사용합니다. 직접 `console`을 호출하지 않습니다.

```ts
logger.info('목록 조회 완료', { count: 24, durationMs: 120 });
logger.error('저장 실패', { status: 500, code: 'HTTP_ERROR' });
```

기본 진단 필드는 `status`, `code`, `count`, `durationMs`입니다. 요청 body, API variables, 응답 원문, 토큰, 쿠키, 세션, 개인정보, Error 객체는 로그에 넣지 않습니다. 로그 메시지와 오류 코드에도 사용자 입력이나 개인정보를 포함하지 않습니다.

## 9. UI와 접근성

- 버튼, 입력, 테이블, 다이얼로그는 `components/ui`의 기본 부품을 우선 사용합니다.
- 업무 의미가 포함된 재사용 부품은 해당 feature의 `components`, 업무를 모르는 조합 UI는 `components/common`, 한 화면에만 필요한 조합은 해당 page에 둡니다.
- 색상은 전역 semantic token을 사용하고 조건부 class는 `cn`으로 합칩니다.
- 기본 UI 부품 안에 서비스 라벨, API 호출, 인증 또는 업무 규칙을 넣지 않습니다.
- 기본 UI의 키보드 조작, focus 이동, aria 속성을 유지합니다.
- 입력 오류는 해당 입력과 연결하고 색상만으로 상태를 구분하지 않습니다.
- 저장 중에는 중복 요청을 막고, 미저장 이탈과 삭제 같은 되돌리기 어려운 동작은 확인 과정을 제공합니다.
- 차트와 큰 화면은 필요할 때 lazy loading합니다. 단순 계산에 습관적으로 memo를 추가하지 않습니다.

목록 화면은 `components/common/data-table.tsx`를 사용합니다. 서버 페이징과 0-based 변환, 표 레이아웃이 여기 모여 있으므로 화면에서 `useReactTable`을 직접 부르지 않습니다. 컬럼 정의는 feature의 `columns` 폴더에 둡니다.

| 컬럼                            | 정렬                                     |
| ------------------------------- | ---------------------------------------- |
| 순번과 숫자                     | 왼쪽. 자릿수는 `tabular-nums`로 맞춥니다 |
| 텍스트                          | 왼쪽                                     |
| 수정·삭제 같은 행 동작          | 오른쪽                                   |
| 스위치처럼 상태를 나타내는 입력 | 왼쪽                                     |

기존 콘솔은 화면마다 정렬이 다릅니다. 옮길 때는 위 규칙을 따르고 기존 정렬은 재현하지 않습니다.

목록 조건은 카드 머리에 둡니다. 목록을 좁히는 조건(기간, 플랫폼, 구분 select)은 왼쪽, 자유 입력 검색과 추가 같은 동작은 오른쪽입니다.

`src/components/ui`의 Metronic 기반 구현 형태는 유지할 수 있지만 계층 경계 검사는 적용합니다. feature 또는 page를 import하면 자동 검사에서 실패합니다.

## 10. 환경변수와 보안

- 환경변수 이름과 용도는 `.env.example`에 기록합니다.
- 실제 `.env` 파일, 비밀키, 계정 정보는 저장소에 올리지 않습니다.
- `VITE_*` 환경변수는 브라우저에 공개되는 값입니다. 비밀값을 넣지 않습니다.
- 사용자 입력과 외부 URL은 시스템 경계에서 검증합니다.
- 사용자 입력을 HTML로 직접 삽입하지 않습니다.
- 실제 권한 검사는 서버에서 수행하고 프론트엔드 표시 제어에 의존하지 않습니다.
- 패키지 설치는 npm을 사용하고 `package-lock.json`으로 버전을 재현합니다.

## 11. 협업과 변경 관리

기능 담당자는 해당 feature와 이를 사용하는 page를 함께 책임집니다.

```text
features/<feature>/
  api/
  hooks/
  model/
  components/
  index.ts
pages/<page>/
```

인증, 레이아웃, 메뉴, 라우터, 전역 스타일, 검사 설정, 공통 컴포넌트, 의존성 파일은 여러 작업에 영향을 줍니다. 담당자를 정하고 변경 내용을 팀에 공유합니다.

커밋과 PR 제목은 `type: 한국어 설명` 형식을 사용합니다.

| type       | 용도                         |
| ---------- | ---------------------------- |
| `feat`     | 기능 추가                    |
| `fix`      | 오류 수정                    |
| `refactor` | 동작을 유지한 코드 구조 변경 |
| `style`    | 코드 서식 변경               |
| `docs`     | 문서 변경                    |
| `test`     | 테스트 추가·수정             |
| `chore`    | 도구, 의존성, 설정 변경      |
| `ci`       | 자동화 작업 변경             |
| `revert`   | 이전 변경 취소               |

PR에는 해결한 문제, 변경 후 동작, 검증 결과를 적습니다. 공통 파일, 권한, API 계약에 영향이 있다면 해당 내용을 함께 기록합니다.

## 12. 검사와 완료 기준

```bash
npm run format         # 코드와 import, Tailwind class 정렬
npm run check          # 타입, lint, 서식, 단위·컨벤션 테스트
npm run test:coverage  # 핵심 로직의 테스트 범위 확인
npm run build          # production build 확인
npm run test:e2e       # 브라우저 사용자 흐름 확인
```

| 변경 내용                      | 필수 검사                                          |
| ------------------------------ | -------------------------------------------------- |
| 문서·서식만 변경               | `npm run format`, `npm run check`                  |
| 타입·API·권한·데이터 처리 변경 | 위 검사 + `npm run test:coverage`, `npm run build` |
| 화면·라우팅·사용자 동작 변경   | 위 검사 + `npm run test:e2e`                       |

자동 검사는 파일명, 계층별 import 방향, feature 공개 진입점, 페이지의 직접 HTTP·Query 호출, 다른 페이지 내부 참조, 실패 토스트 중복, Hooks 규칙, 타입 오류와 미사용 코드를 확인합니다. 자동 검사로 판단하기 어려운 이름의 의미, 캐시 key의 조건, 공통화 범위, 업무 규칙과 접근성은 코드 리뷰에서 확인합니다.

새 기능은 다음 순서로 작성합니다.

1. 데이터 타입과 API 계약을 정합니다.
2. API 요청과 runtime 응답 검증을 작성합니다.
3. Query key와 조회·변경 훅을 작성합니다.
4. feature 공개 진입점을 정리하고 page에서 화면을 연결합니다.
5. 라우트와 메뉴를 등록합니다.
6. 로딩, 빈 결과, 실패, 권한, 모바일과 키보드 동작을 검증합니다.
