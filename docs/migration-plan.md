# TrendView Console 이관 계획

`old-trendview-console`(Vue 2 + Vuetify + Vuex, 약 15.5k LOC)을 이 저장소의 스택과 [개발 컨벤션](conventions.md)에 맞춰 옮기는 계획입니다. 기능 명세의 기준은 별도 정리한 **트렌드뷰 콘솔 분석**(2026-09-08) 문서이며, 이 문서는 그 명세를 어떤 구조로 어떤 순서로 옮길지를 정합니다.

## 0. 원칙

- **유지**: API 엔드포인트와 요청 파라미터, 조회 조건, 액션의 의미, 등급별 표시 규칙.
- **교체**: 렌더링, 상태 관리, 스타일, 알림 계층 전부.
- **개선**: 조회 조건을 URL로, 화면 이동 시 조건 유실 제거, 로딩·빈 결과·오류 상태 분리, 확인 창 접근성.
- **추가하지 않음**: 요청받지 않은 새 기능, 새 API, 새 의존성. 기존에 없던 화면을 만들지 않습니다.
- **순서**: 조회는 실 API로 붙여 UI/UX를 확정하고, 변경 요청은 그때까지 구조로 막습니다(4.1, Phase 5). 개발용 서버가 없습니다.

API 응답 형식(`res.data.data` envelope)은 서버가 그대로이므로 유지합니다. 각 feature API 함수가 응답을 Zod로 검증한 뒤 화면 타입으로 변환합니다.

## 1. 스택 치환

| old                                | v2                                                                 | 비고                                                                                     |
| ---------------------------------- | ------------------------------------------------------------------ | ---------------------------------------------------------------------------------------- |
| Vue 2 SFC                          | React 19 + TSX                                                     | `function` 선언 + named export                                                           |
| Vuetify 2                          | `src/components/ui` (Radix + Tailwind)                             | 부족한 부품은 그때 추가                                                                  |
| Vuex + `vuex-persistedstate`       | 서버 데이터는 TanStack Query, 조회 조건은 URL, 세션은 AuthProvider | 전역 store 없음                                                                          |
| vue-router                         | react-router-dom                                                   | 이미 구성됨                                                                              |
| axios 전역 인스턴스                | `shared/api/http-client.ts`                                        | `getHeaders`로 `Authorization`, 요청별 `headers`로 `TV` 전달. client 수정 없이 가능      |
| sweetalert2                        | `components/common/confirm-dialog.tsx` + sonner                    | 확인 창은 Dialog, 성공은 toast, 실패는 공통 Query 설정                                   |
| numeral                            | `Intl.NumberFormat`                                                | 의존성 제거                                                                              |
| dayjs                              | `<input type="date">` + 소수의 날짜 유틸                           | 오늘/어제/일주일 계산만 필요. 통계 구간 계산이 커지면 그때 재검토                        |
| `@mdi/font`, material-design-icons | lucide-react                                                       | 플랫폼 아이콘은 lucide에 없는 것이 있어 대체 표기 필요(§6)                               |
| amCharts 4                         | recharts                                                           | 선/막대/파이는 1:1. force-directed 그래프는 대체 필요(§7)                                |
| `vue-infinite-loading`             | 제거                                                               | 실제로 사용되지 않음. 커서 기반 목록은 `useInfiniteQuery`                                |
| `FormData` CSV 업로드              | 그대로                                                             | http-client는 body가 문자열일 때만 `Content-Type`을 붙이므로 multipart boundary가 유지됨 |

## 2. feature 분해

API 소유를 기준으로 나눕니다. 화면 개수가 아니라 데이터 주체 기준입니다.

| feature         | 담당 API                                                                                                                                                                                                                                                                   | 사용 화면                                    |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------- |
| `auth`          | `POST oauth/token`, `GET api/v1/me`                                                                                                                                                                                                                                        | 로그인, 전역 권한                            |
| `medias`        | `GET api/v1/medias`, `GET api/v1/medias/{id}`                                                                                                                                                                                                                              | 거의 모든 화면의 매체 선택                   |
| `articles`      | `admin/articles`, `admin/post-articles`, `article-reports`, ~~`articles/{id}/detail`~~, `articles/{id}/state`, `articles`, `articles/delete`, `articles/{id}/delete`, `articles/{id}/tag`, `admin/articles/medias/thumbnail`, `admin/articlesByTag`, `admin/article/scrap` | 수집정보, 게시정보, 신고정보, 상세, 미리보기 |
| `article-stats` | `admin/articles/stats`, `platform-stats`, `platform-daily-stats`, `platform-date-stats`, `admin/articles/page-view-stats`, `admin/article-reports/platform-*`                                                                                                              | 수집/게시/신고 개수, 콘텐츠 순위             |
| `user-stats`    | `stats/uv-pv-stats`, `users/page-view-stats`, `platforms/page-view-stats`, `users/visit`, `users/search-detail/{id}`, `tags/user/stats/reset`                                                                                                                              | 일간 사용자 유입량, 접속자 순위, 사용자 검색 |
| `user-logs`     | `POST admin/log`, `POST admin/log/exclude/user`                                                                                                                                                                                                                            | 사용자 접속 로그                             |
| `tags`          | `tags`, `tags/text`, `tags/csv`, `tags/toggle-exposable/{id}`, `tags/daily-stats`, `tags/stats`, `tags/total`, `tags/ignore`, `tags/ignore/toggle-ignore/{id}`                                                                                                             | 키워드(PK) 순위·집계·제외, 비즈니스태그 관리 |
| `keywords`      | `base-keywords` 일체, `keywords` 일체, `commands/jobs`                                                                                                                                                                                                                     | 키워드(PK) 관리, 기존 키워드 관리            |
| `channels`      | `channels`, `channels/csv`, `channels/stats`, `commands/jobs`                                                                                                                                                                                                              | 채널 관리                                    |
| `topics`        | `topics`                                                                                                                                                                                                                                                                   | 카테고리 관리, 키워드·채널 등록 폼의 선택지  |
| `platforms`     | `platforms`, `platforms/{id}`, `platform-accounts`                                                                                                                                                                                                                         | 플랫폼 관리·상세, 등록 폼의 플랫폼 선택지    |
| `users`         | `users`, `users/medias`                                                                                                                                                                                                                                                    | 사용자 관리                                  |
| `exposure`      | `exposure/{media_id}`, `exposure`, `exposure/grade/{media_id}`                                                                                                                                                                                                             | 노출 가중치 관리                             |

`keywords`가 `base-keywords`(현재 사용)와 `keywords`(메뉴 주석)를 같이 가집니다. 성격이 다른 두 도메인이지만 담당자가 같고 등록 폼 구조가 거의 동일하므로 한 feature 안에서 `api/base-keywords.ts`, `api/keywords.ts`로 나눕니다. 기존 키워드 관리를 폐기하기로 결정되면 파일 단위로 삭제됩니다.

`topics`, `platforms`는 다른 feature의 등록 폼에서 선택지로 필요합니다. 컨벤션대로 `@/features/topics` 공개 진입점만 참조합니다.

## 3. 화면 배치

라우트는 기존 평면 구조 대신 그룹으로 묶습니다. `/:id` catch-all은 제거했습니다(§7 결정 3).

| 기존 메뉴               | 기존 경로                     | v2 page                               | 사용 feature                        | 관리자 전용 |
| ----------------------- | ----------------------------- | ------------------------------------- | ----------------------------------- | ----------- |
| 로그인                  | `/login`                      | `pages/login`                         | auth                                | -           |
| 수집정보                | `/collect`                    | `pages/collect`                       | articles, medias                    | -           |
| 게시정보                | `/article`                    | `pages/articles`                      | articles, medias                    | -           |
| 신고정보(주석)          | `/article-report`             | `pages/article-reports`               | articles, medias                    | -           |
| 콘텐츠 상세             | `/:id`                        | 별도 page 없음. 목록 위 시트          | articles                            | -           |
| 수집/게시/신고 개수     | `/statistics`                 | `pages/stats/counts`                  | article-stats, medias               | O           |
| 일간 사용자 유입량      | `/statistic-users`            | `pages/stats/users`                   | user-stats, medias                  | O           |
| 콘텐츠 순위             | `/statistic-content-ranks`    | `pages/stats/contents`                | article-stats, articles, medias     | O           |
| 키워드(PK) 순위         | `/statistic-tag-ranks`        | `pages/stats/tags`                    | tags, articles, medias              | O           |
| 키워드(PK) 집계         | `/statistic-tag-aggs`         | `pages/stats/tag-totals`              | tags, medias                        | O           |
| 접속자 순위             | `/statistic-user-ranks`       | `pages/stats/visitors`                | user-stats, medias                  | O           |
| 사용자 검색             | `/statistic-user-search`      | `pages/stats/user-search`             | user-stats, medias                  | O           |
| 사용자 접속 로그        | `/statistic-user-logs`        | `pages/stats/user-logs`               | user-logs, medias, platforms        | O           |
| 사용자 관리             | `/users`                      | `pages/settings/users`                | users, medias                       | O           |
| 카테고리 관리           | `/topics`                     | `pages/settings/topics`               | topics, medias                      | -           |
| 키워드(PK) 관리         | `/base-keywords`              | `pages/settings/base-keywords`        | keywords, medias, topics, platforms | -           |
| 키워드(PK) 제외         | `/statistic-tag-ignores`      | `pages/settings/tag-ignores`          | tags, medias                        | O           |
| 노출 가중치 관리        | `/exposure`                   | `pages/settings/exposure`             | exposure, medias                    | O           |
| 플랫폼 관리(주석)       | `/platforms`, `/platform/:id` | `pages/settings/platforms`(+`detail`) | platforms                           | -           |
| 기존 키워드 관리(주석)  | `/keywords`                   | `pages/settings/keywords`             | keywords, medias, topics, platforms | -           |
| 채널 관리(주석)         | `/channels`                   | `pages/settings/channels`             | channels, medias, topics, platforms | -           |
| 비즈니스태그 관리(주석) | `/tags`                       | `pages/settings/tags`                 | tags, medias                        | -           |

수집정보를 진입 화면(`/` 리다이렉트 대상)으로 둡니다. 기존 대시보드 예제 화면은 제거합니다.

## 4. 공통 기반 (Phase 0)

화면 이관보다 먼저 끝내야 하는 항목입니다.

### 4.1 읽기 전용 개발

개발용 서버가 없고 실제 운영 데이터에 붙습니다. 조회는 실 API를 그대로 사용하고 **변경 요청은 서버에 도달하지 않게 구조로 막습니다.** 설정값으로 끄고 켜는 방식이 아니라, 이 단계에서는 쓰기 경로를 가진 fetcher를 애초에 주입하지 않습니다. 잘못 설정된 플래그 하나가 운영 콘텐츠를 지울 수 있기 때문입니다.

- 차단 지점은 `createHttpClient`의 `fetcher` 한 곳입니다. 모든 요청이 지나가는 자리이므로 feature나 훅마다 규칙을 넣지 않습니다.
- `shared/api/read-only-fetcher.ts`는 `GET`·`HEAD`와 **읽기용 POST 허용 목록**만 통과시키고 나머지는 요청을 보내기 전에 `AppError`로 거부합니다.
- 허용 목록은 `POST oauth/token`(로그인)과 `POST api/v1/admin/log`(사용자 접속 로그 조회) 둘입니다. 이 두 API는 POST지만 조회입니다. 목록은 이 파일 한 곳에만 둡니다.
- 특히 위험한 요청은 `POST api/v1/admin/article/scrap`(수집 작업 실행), `POST api/v1/commands/jobs`, `POST api/v1/tags/user/stats/reset`(스코어링 초기화), `DELETE api/v1/articles/delete`입니다. 해당 화면은 버튼과 확인 창까지 만들고 요청만 막습니다.
- 거부는 조용히 성공하지 않고 **소리내어 실패**합니다. 의도한 method와 경로를 진단 로그로 남겨 무엇이 나가려 했는지 확인할 수 있게 합니다.
- 저장 후 UX(성공 토스트, 다이얼로그 닫힘, 저장 중 중복 요청 방지)를 검토해야 하므로 기본 동작은 **모의 성공**입니다. 요청은 나가지 않고 성공 응답 형태만 돌려줍니다.
- 규칙을 사람의 기억에 맡기지 않습니다. `tests/conventions.test.ts`에 앱이 read-only fetcher로 client를 만드는지 확인하는 정적 검사를 추가합니다.
- 헤더의 `VITE_ENV_LABEL` 자리에 `읽기 전용` 배지를 표시합니다.

모의 성공은 서버 상태를 바꾸지 않으므로 저장 후 목록을 다시 불러와도 값이 그대로입니다. 예상된 동작입니다. 이 단계에서 검토하는 것은 결과 데이터가 아니라 확인 과정·중복 요청 방지·알림·닫힘 같은 상호작용입니다. 가짜 저장 상태를 메모리에 유지하는 구현은 하지 않습니다. 서버를 흉내내는 일이고 실제 연결 때 전부 버려집니다.

조회를 실 API로 하면 응답 모양을 가정할 일이 없고 실제 데이터 양과 빈 값, 긴 한글 문자열로 화면을 확인할 수 있습니다. 고정 데이터는 조회 실패·빈 결과·권한 없음처럼 실제 데이터로 만들기 어려운 상태를 확인할 때만 `fetcher`를 바꿔 씁니다.

운영 데이터에는 개인정보가 있습니다. 사용자 검색과 접속 로그의 응답을 저장소의 fixture, 스크린샷, 이슈 본문에 붙이지 않습니다.

### 4.2 인증 교체

`features/auth`의 계약을 실제 API에 맞게 바꿉니다. `AuthProvider`, `RequireAuth`는 수정하지 않습니다.

```ts
interface Session {
  id: string;
  name: string;
  email: string;
  grade: number;
  medias: { id: number; name: string }[]; // me 응답의 user_media
}
```

- `authAdapter.signIn`은 `POST oauth/token`(password grant)으로 토큰을 받고 `GET api/v1/me`로 세션을 구성합니다.
- `getSession`은 저장된 토큰으로 `GET api/v1/me`를 호출하고 실패하면 토큰을 지웁니다. 기존 `attempt` 동작과 같습니다.
- `signOut`은 토큰을 지웁니다. 기존 `localStorage.clear()`는 다른 값까지 지우므로 토큰 키만 제거합니다.
- 기존 `subscriber.js`가 저장하던 `Authorization`, `tv` localStorage 값은 사용처가 없어 옮기지 않습니다.
- 로그인은 실제 `oauth/token`을 사용합니다. 읽기 전용 허용 목록에 포함됩니다. 등급별 화면 확인이 필요하면 등급이 다른 계정으로 로그인합니다.
- `model.ts`의 `canEdit(role)`을 `isAdminGrade(session)`(`grade !== 0`)으로 교체합니다. 등급 판단 지점을 이 함수 하나로 모읍니다.
- `demo-adapter.ts`, 데모 역할 선택 UI, fixture는 Phase 1 종료 시 제거합니다.
- 로그인 실패는 로그인 화면에서 표시합니다. 매체가 없는 계정(`medias`가 빈 배열)은 기존과 같이 안내 후 로그아웃합니다.

### 4.3 토큰과 매체 헤더

- `createHttpClient({ baseUrl, getHeaders })`의 `getHeaders`에서 `Authorization: Bearer <token>`을 넣습니다.
- 매체별 `TV` 헤더는 요청마다 다르므로 feature API 함수가 `options.headers`로 전달합니다. http-client 수정은 필요 없습니다.
- `ApiError.status === 401`이면 세션을 비우고 로그인 화면으로 보냅니다. 처리 지점은 한 곳(AuthProvider 또는 Query 설정)으로 고정합니다. 기존에는 이 처리가 없어 토큰 만료 시 빈 화면이 됐습니다.
- 개발과 운영 모두 `VITE_API_BASE_URL`로 브라우저에서 직접 호출합니다. Phase 0에서는 API 서버가 개발 주소를 막을 것으로 보고 dev 서버 프록시를 뒀으나, 확인 결과 서버가 `Access-Control-Allow-Origin: *`를 주고 있어(2026-09-14) 프록시와 `DEV_API_PROXY_TARGET`을 제거했습니다. 환경별로 요청 경로가 갈리지 않습니다.
- 개발 대상은 운영 API입니다. old 콘솔의 develop과 production 설정이 같은 호스트를 쓰기 때문에 다른 선택지가 없습니다. 이것이 4.1의 변경 요청 차단이 필요한 직접적인 이유입니다.

### 4.4 매체 코드와 스토리지 URL

`TV` 헤더와 이미지 URL이 매체 영문 코드에 의존하고, 그 코드는 기존 `main.js`의 하드코딩 switch 49개 호출 지점에 흩어져 있습니다.

- `features/medias/model/media-codes.ts` 한 파일에 `id → { code, label }` 맵을 모읍니다. 신규 매체 추가 시 이 파일만 고칩니다.
- 스토리지 URL은 매체 코드별 도메인이 13개입니다. `VITE_MEDIA_STORAGE_URLS`에 JSON 한 건으로 두고 경계에서 Zod로 검증합니다. 환경변수 13개보다 추가·검증이 쉽습니다.
- 개발 환경은 기존과 같이 단일 dev 스토리지 URL을 사용합니다.
- 근본 해결은 `GET api/v1/medias` 응답에 코드와 스토리지 URL을 포함시키는 것입니다(§7).

### 4.5 매체 전역 범위

매체 선택은 화면에 귀속되지 않고 앱 전체에 적용됩니다. 헤더에 선택기 하나를 두고 모든 화면이 그 값을 조회 범위로 사용합니다.

- 선택기는 `components/layouts`의 헤더에 둡니다. 컨벤션대로 layout은 `@/features/medias` 공개 진입점만 참조합니다.
- 값의 단일 출처는 URL의 `media` 파라미터이고, 마지막 선택은 브라우저에 저장해 **기본값으로만** 씁니다.
- `features/medias/hooks/use-media-scope.ts` 하나가 이 규칙을 담습니다. URL에 `media`가 없으면 저장된 기본값(없으면 세션 `user_media[0]`)을 `replace`로 채웁니다. 화면 이동은 평범한 링크로 두고 도착 화면의 훅이 값을 채우므로, 화면 간 동기화 코드가 필요 없습니다.
- 저장된 값은 신뢰 경계에서 검증합니다. 세션의 `user_media`에 없는 매체(권한 변경, 오래된 저장값)는 버리고 `user_media[0]`으로 되돌립니다.
- 매체를 바꾸면 페이지를 1로 되돌리고 나머지 조회 조건은 유지합니다. 기존 `resetStore()`처럼 조건 전체를 지우지 않습니다.
- 매체를 조회 범위로 쓰지 않는 화면은 플랫폼 관리·상세 둘뿐입니다. 선택기는 위치를 고정해 항상 표시하고 그 화면들은 값을 쓰지 않습니다.

전역으로 만드는 것은 **선택기의 위치와 적용 범위**이고, 값을 어디에 저장하느냐는 별개 결정입니다. URL에 남겨두면 목록·통계 링크를 공유하거나 북마크할 때 매체가 같이 따라갑니다. 특히 콘텐츠 상세는 `TV` 헤더가 매체에서 결정되므로, URL에 매체가 없으면 링크를 받은 사람의 선택에 따라 다른 매체로 요청이 나갑니다. 공유가 필요 없다는 판단이면 URL 파라미터를 빼고 저장값만 쓰는 형태로 줄일 수 있습니다(§7 결정 11).

### 4.6 그 외 조회 조건을 URL로

기존에는 매체·플랫폼·기간·검색어·정렬·페이지가 모두 Vuex + sessionStorage 전역 상태였고, `App.vue`의 `$route` watch가 화면 전환 조합마다 `resetStore()`를 호출했습니다. 매체는 4.5의 전역 범위로 분리하고, 나머지 조건을 URL search params로 옮깁니다.

- `features/articles/model/filters.ts`에 `ArticleFilters` 타입과 Zod schema, `parseArticleFilters`/`serializeArticleFilters`를 둡니다. 수집·게시·신고 3화면이 같은 조건을 쓰므로 feature model에 둡니다. 매체는 이 타입에 넣지 않고 `useMediaScope()`에서 받습니다.
- 매체는 서버 응답을 바꾸는 조건이므로 **query key에는 반드시 포함**합니다.
- page는 `useSearchParams`와 위 함수만 연결합니다.
- 조건이 바뀌면 페이지를 1로 되돌립니다. 화면 이동 시 조건을 강제로 지우는 로직은 만들지 않습니다.
- 상세로 이동할 때 조건을 쿼리로 실어 보내던 코드는 필요 없어집니다. 목록 URL 자체가 조건을 담고 있으므로 브라우저 뒤로가기로 복원됩니다.

### 4.7 공통 부품

| 부품                          | 위치                                                    | 대체 대상                                               |
| ----------------------------- | ------------------------------------------------------- | ------------------------------------------------------- |
| 매체 선택(헤더 전역)          | `features/medias/components/media-select.tsx`           | `MediaSelectBox.vue`, `TopSearchMenu.vue`의 매체 select |
| 매체 범위 훅                  | `features/medias/hooks/use-media-scope.ts`              | Vuex `SET_MEDIA_ID`/`getMediaId`                        |
| 목록 조회 툴바(매체 제외)     | `features/articles/components/article-toolbar.tsx`      | `TopSearchMenu.vue`의 나머지 영역                       |
| 기간 선택(프리셋 + 범위 달력) | `components/common/date-range-field.tsx`                | `TopSearchMenu.vue`의 날짜 영역                         |
| 콘텐츠 상세 시트              | `features/articles/components/article-detail-sheet.tsx` | `ArticleShow.vue` + `ArticlePopup.vue`                  |
| 태그 관련 콘텐츠 팝업         | `features/tags/components/tag-articles-dialog.tsx`      | `BusinessTagPopup.vue`                                  |
| 확인 창                       | 기존 `components/common/confirm-dialog.tsx`             | sweetalert2                                             |
| 이동 경로 표시                | 제거                                                    | `Breadcrumbs.vue`. `PageHeader`로 대체                  |
| 전체 화면 스피너              | 제거                                                    | `Spinner.vue`, `CardSpinner.vue`. Skeleton으로 대체     |
| 숫자·날짜 포맷                | `shared/utils/format.ts`                                | numeral, dayjs                                          |

`ListGroup.vue`, `Datatable.vue`는 Vuetify 래퍼라 옮기지 않습니다. 테이블은 TanStack Table + `components/ui/table`로 다시 만듭니다.

기간 선택기는 Metronic의 `calendar.tsx`·`popover.tsx`를 그대로 가져와 `react-day-picker`로 만든 범위 달력입니다. 네이티브 `<input type="date">` 두 개는 한 달력에서 범위를 잡을 수 없고 표시 형식이 OS 로케일을 따릅니다. 프리셋(전체/오늘/어제/일주일/한 달)은 팝오버 안에 둡니다. Phase 3의 통계 8화면이 같은 부품을 씁니다.

### 4.8 메뉴와 라우팅

- 헤더에 매체 선택기(4.5)와 사용자 메뉴를 둡니다. 매체가 전역 범위이므로 위치는 모든 화면에서 고정합니다.
- `config/menu.config.ts`를 관리·통계·설정 3그룹으로 바꿉니다. 항목의 `editOnly` 플래그를 `adminOnly`로 바꿔 `grade !== 0` 조건을 표현합니다. 메뉴에 조건이 있는 항목은 분석 문서의 등급 표를 그대로 따릅니다.
- 프런트 숨김은 편의 처리이고 실제 인가는 서버가 합니다. 이 사실을 주석과 PR에 남깁니다.
- `.env.example`에 `VITE_API_BASE_URL`, `VITE_MEDIA_STORAGE_URLS`, oauth client 값을 기록합니다.
- `APP_CONFIG.name`을 `TrendView Console`로 바꿉니다.

## 5. 화면 이관 시 주의점

분석 문서에 기록된 표시·조건·액션·API를 그대로 옮깁니다. 아래는 구조가 달라지면서 판단이 필요한 지점만 적습니다.

**수집정보 / 게시정보 / 신고정보** — 같은 조회 조건, 같은 카드 목록, 목록 API와 일괄 액션의 `state` 값만 다릅니다. 툴바에는 매체 select가 없습니다(헤더로 이동, 4.5). 응답의 `article_medias` 가공(인스타그램 다중 이미지 vs 썸네일 대체)은 `features/articles/model`의 mapper에 있습니다.

계획에서는 page를 각각 두고 훅·툴바만 공유하려 했으나, **Phase 1에서 `features/articles/components/article-list-view.tsx` 한 컴포넌트를 공유하도록 바꿨습니다.** 두 화면이 state·문구·주 동작 라벨·비즈니스 태그 표시 여부만 다르고 나머지 220줄이 같았기 때문입니다. page는 각각 14줄짜리 껍데기입니다. 신고정보를 붙일 때 분기가 늘어나면 그때 쪼갭니다.

**수집과 게시는 DB 테이블이 다릅니다**(백엔드 확인). 화면 통합을 검토했으나 하지 않습니다. 응답 컬럼이 같다는 보장이 없고, 활성 시 행이 테이블 사이를 이동하므로 **한 번의 활성이 두 목록을 모두 바꿉니다.** Phase 5에서 캐시 무효화는 `articleKeys.lists()` 단위로 해야 합니다.

`per_page`는 32에서 **24로 바꿨습니다.** 화면에서 쓰는 2·3·4·6열 모두로 나누어떨어져 마지막 줄이 비지 않습니다. 개수 표시는 `searchCount`와 `totalCount`가 같으면 하나만 보여줍니다.

**콘텐츠 상세** — **별도 화면을 만들지 않았습니다.** 목록 위에 뜨는 시트 하나로 기존의 상세 페이지와 미리보기 팝업을 합쳤습니다. 미리보기가 상세의 부분집합이라 둘로 나눌 이유가 없었습니다.

- URL은 경로(`/articles/:id`)가 아니라 **목록 URL의 쿼리**(`?article=123`)입니다. 시트는 목록의 상태이므로, 경로를 바꾸면 닫았을 때 돌아갈 목록 조건(수집/게시, 페이지, 필터)을 잃습니다. 조건이 바뀌면 `article`을 지워 시트도 함께 닫습니다.
- **`GET articles/{id}/detail`을 쓰지 않습니다.** 목록 응답과 필드를 비교한 결과 상세가 더 주는 것은 `article_comments`(빈 배열)뿐이고, 오히려 목록이 `tag_activity`·`is_favorite`·`is_like`를 더 줍니다. 본문(`contents`)도 목록에서 전문이 옵니다. 기존 콘솔이 이 API를 부른 것은 상세가 별도 페이지여서 목록 데이터가 없었기 때문입니다(미리보기 팝업은 API를 부르지 않습니다).
- 이 결정으로 **고정 토큰 문제가 사라졌습니다.** `articles/{id}/detail`은 앱용 엔드포인트라 관리자 OAuth 토큰을 받지 않고(401), 기존 콘솔은 `src/store/subscriber.js`에 하드코딩된 고정 키를 `localStorage['Authorization']`에 넣어 이 호출에만 썼습니다. 관리자용 상세 라우트는 서버에 없습니다(`admin/articles/{id}` → 404). 서버가 관리자 토큰을 받는 상세를 열어주면 이 항목 자체가 없어집니다.
- 신고 내역(`article-reports/{id}`)만 별도 query입니다. 이쪽은 관리자 토큰을 씁니다. 대부분 0건이라 있을 때만 섹션을 보여주며, 본문이 길 수 있으므로 **본문보다 위에** 둡니다.
- 유튜브는 첨부가 썸네일뿐이라 이미지 대신 `youtube-nocookie.com` 임베드를 넣습니다. 쇼츠는 주소의 `/shorts/` 또는 세로 썸네일로 판별해 9:16으로 보여줍니다.

**수집/게시/신고 개수** — 영역마다 날짜 입력이 따로 있는 구조를 화면 상단 한 곳으로 합칩니다. 단, `platform-stats`는 날짜를 보내지 않고 `platform-daily-stats`는 보내며 활성/비활성 영역은 `dateChoice`와 `choice_start_date`/`choice_end_date`를 씁니다. 요청 파라미터 조합은 기존과 동일하게 유지하고 UI만 합칩니다.

**일간 사용자 유입량 / 콘텐츠 순위 / 접속자 순위 / 키워드(PK) 순위** — 기간 단위(일간·주간·월간)별 카드와 "이전/다음 구간" 이동이 있습니다. 이것이 서버 페이징인지 응답을 클라이언트에서 잘라 보여주는지 확인한 뒤 URL 파라미터 설계를 정합니다(§7).

**사용자 접속 로그** — `search_after` 커서 기반입니다. `useInfiniteQuery`로 옮기고 "more logs" 버튼을 유지합니다. 조건 변경 시 커서를 버리는 기존 동작(`delete requestBody.search_after` 10곳)은 query key에 조건을 포함시키면 자동으로 해결됩니다.

**키워드(PK) 관리 / 기존 키워드 / 채널 / 비즈니스태그** — 등록 폼이 거의 같습니다(카테고리 선택, 쉼표 구분 입력, 플랫폼 복수 선택, CSV 업로드). React Hook Form + Zod로 옮기고, 폼 컴포넌트 공통화는 두 번째 화면을 만들 때 실제 중복을 보고 판단합니다.

**노출 가중치** — 슬라이더 부품이 `components/ui`에 없습니다. 비율 입력이므로 `<input type="range">` 또는 숫자 입력으로 충분한지 확인하고, 필요하면 Radix Slider를 `components/ui/slider.tsx`로 추가합니다.

**사용자 관리** — 수정·삭제 API 호출 코드는 있으나 버튼이 연결돼 있지 않습니다. 기존 화면과 동일하게 버튼 없이 옮기고, 복구 여부는 별도 결정합니다(§7).

## 6. UI/UX 개선 항목

기능을 바꾸지 않는 범위에서 다음을 개선합니다.

- **매체 선택 한 곳**: 기존에는 화면마다 툴바 안에 매체 select가 따로 있고 화면을 옮기면 초기화됐습니다. 헤더의 선택기 하나로 통일하고 화면 전환·새로고침 후에도 유지합니다.
- **조회 조건 공유·복원**: 조건이 URL에 있으므로 링크 공유, 새로고침, 뒤로가기가 동작합니다. 기존에는 sessionStorage에 남아 다른 화면으로 새는 대신 화면 전환마다 강제 초기화됐습니다.
- **상태 3분리**: 조회 중(Skeleton), 빈 결과(EmptyState), 조회 실패(오류 + 다시 시도)를 구분합니다. 기존은 전체 화면 오버레이 스피너와 "데이터 없음" 문구뿐이고 실패는 `console.error`로 끝났습니다.
- **확인 창 접근성**: sweetalert2를 Radix Dialog로 바꿔 focus trap, ESC 닫기, aria 속성을 확보합니다. 확인 후 `location.reload()`로 화면을 되돌리던 처리를 제거합니다.
- **선택 액션바**: 카드 목록에서 선택 건수와 일괄 활성·삭제 버튼을 목록 상단에 고정 표시합니다. 기존에는 선택해도 버튼 위치가 멀고 선택 개수가 보이지 않았습니다.
- **알림 정리**: 성공은 toast, 실패는 공통 Query 설정에서 한 번만 표시합니다. 기존의 `alert()`와 스낵바 혼용을 정리합니다.
- **반응형**: `App.vue`의 해상도 구간 9개 px 하드코딩을 제거하고 Tailwind 컨테이너와 grid로 처리합니다. 테이블 컬럼 고정 폭(`width: '200opx'` 같은 오타 포함)도 제거합니다.
- **키보드·포커스**: 검색 입력의 Enter 조회, 다이얼로그 진입 시 포커스 이동, 스위치·체크박스의 label 연결을 기본 부품으로 확보합니다.
- **플랫폼 표기**: lucide-react에 없는 플랫폼(네이버 블로그, 네이버 뉴스 등)은 아이콘 대신 색상 배지 + 한글 라벨로 통일합니다. 아이콘만으로 구분하던 기존 필터 버튼에 라벨을 붙여 색상·아이콘만으로 상태를 구분하지 않게 합니다.
- **다크 모드**: 전역 토큰에 dark variant가 있으므로 semantic token만 사용하면 따라옵니다. 별도 작업으로 잡지 않습니다.

## 7. 결정 필요 / 미확인

이관 전에 정해야 하는 항목입니다. 1·2번은 제안대로 진행하기로, 5·9번은 보류하기로 정했습니다(2026-09-10).

| #   | 항목                              | 현재 상태                                                          | 제안                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| --- | --------------------------------- | ------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | oauth `client_id`/`client_secret` | **결정: 제안대로**                                                 | `.env.example`에 기록하고 노출 사실을 주석에 남깁니다. 브라우저 password grant는 어디에 둬도 노출되므로 근본 해결은 서버 로그인 프록시이며, 별도 과제로 남깁니다                                                                                                                                                                                                                                                                            |
| 2   | 매체 영문 코드·스토리지 URL       | **결정: 제안대로**                                                 | `features/medias/model/media-codes.ts` + `VITE_MEDIA_STORAGE_URLS` JSON으로 진행합니다. 서버 `medias` 응답에 코드·스토리지 URL을 추가하는 것은 별도 요청으로 남깁니다                                                                                                                                                                                                                                                                       |
| 3   | 라우트 경로 변경                  | **결정됨(Phase 1)**                                                | `/:id` 제거 완료. 상세는 별도 경로가 아니라 목록 URL의 `?article=` 쿼리로 엽니다(§5). 나머지 그룹화는 운영자 북마크 영향 확인 후 결정                                                                                                                                                                                                                                                                                                       |
| 4   | `GET api/v1/medias` 범위          | 매체 선택 목록은 이 API, 기본값은 `me.user_media[0]`               | 이 API가 로그인 운영자의 `user_media`로 필터되는지 확인. 아니면 클라이언트에서 교차 필터 필요                                                                                                                                                                                                                                                                                                                                               |
| 5   | 콘텐츠 매칭 순위 차트             | **보류**                                                           | Phase 3의 키워드(PK) 순위 화면 하단만 해당합니다. 같은 화면 상단 순위표와 나머지 통계 7화면은 영향 없이 진행합니다. Phase 3 착수 전까지 결정하면 됩니다                                                                                                                                                                                                                                                                                     |
| 6   | 통계 "이전/다음 구간"             | 서버 페이징인지 클라이언트 청크인지 미확인                         | 확인 후 URL 파라미터 설계 확정                                                                                                                                                                                                                                                                                                                                                                                                              |
| 7   | `articles/stats` 0 응답           | 기존 화면에서 모두 0인 사례 있었음                                 | 서버 집계 기준 확인. 프런트는 응답을 그대로 표시                                                                                                                                                                                                                                                                                                                                                                                            |
| 8   | 사용자 관리 수정·삭제             | API 호출 코드만 남고 버튼 없음                                     | 기본은 기존과 동일하게 버튼 없이 이관. 필요하면 별도 요청으로 추가                                                                                                                                                                                                                                                                                                                                                                          |
| 9   | 살아있는 화면 안의 주석 처리 기능 | **보류 = 기본값 적용**                                             | 기존 화면과 동일하게 숨긴 상태로 이관합니다. 대상은 인스타그램·트위터 필터 버튼, 키워드/채널 유형 필터, 수집정보의 수동 수집 버튼, 키워드(PK) 노출여부 스위치, 미리보기의 삭제 버튼, 오늘/어제 수집 수 표시입니다. 나중에 되살리는 비용이 낮게, 플랫폼 필터 항목은 배열 한 줄 추가로 켜지는 형태로 만듭니다. 수동 수집은 `features/articles/components/scrap-button.tsx`로 옮겨 두고 `pages/collect/page.tsx`에서 두 줄만 주석 처리했습니다 |
| 10  | 숨겨진 화면 5개                   | 신고정보·플랫폼·기존 키워드·채널·비즈니스태그. 필요하다고 확인받음 | Phase 4에서 이관. 메뉴 노출 여부와 등급 조건을 이 시점에 확정                                                                                                                                                                                                                                                                                                                                                                               |
| 11  | 전역 매체를 URL에도 둘지          | 결정됨: 선택기는 헤더 전역(4.5)                                    | 값은 URL `media` + 저장된 기본값을 제안. 링크 공유·북마크와 상세의 `TV` 헤더가 매체에 의존하기 때문. 공유가 필요 없다면 URL 파라미터를 빼고 저장값만 쓰는 형태로 축소 가능                                                                                                                                                                                                                                                                  |
| 12  | 실제 응답이 필요한 결정           | 4·6·7번은 응답을 봐야 답이 나옴                                    | 조회가 열려 있으므로 Phase 0~3 진행 중에 확인해 확정합니다                                                                                                                                                                                                                                                                                                                                                                                  |
| 14  | 목록 검색 대상                    | **확인됨(Phase 1)**                                                | `search=#검색어`는 제목뿐 아니라 본문까지 찾습니다. 플레이스홀더를 "제목, 내용 검색"으로 맞췄습니다                                                                                                                                                                                                                                                                                                                                         |
| 15  | 기간 필터의 기준 날짜             | 미확인                                                             | `start_date`/`end_date`가 작성일(`date`)인지 수집일(`created_at`)인지 응답만으로는 구분되지 않습니다. 두 값이 같은 콘텐츠가 대부분이라 눈으로도 확인되지 않았습니다. 통계 화면에서 같은 파라미터를 쓰므로 Phase 3 전에 서버에 확인합니다                                                                                                                                                                                                    |
| 16  | 관리자용 콘텐츠 상세 API          | 없음                                                               | `articles/{id}/detail`은 앱용 고정 토큰만 받고 `admin/articles/{id}`는 404입니다. 현재는 목록 응답만으로 상세를 채워 우회했습니다. 서버에 관리자 토큰을 받는 상세가 생기면 §5의 관련 설명을 지웁니다                                                                                                                                                                                                                                        |
| 13  | 첫 실제 쓰기 검증 방법            | 개발용 서버가 없어 운영 데이터에 직접 쓰게 됨                      | Phase 5 착수 전에 정해야 합니다. 버려도 되는 콘텐츠·매체를 지정하거나, 데이터 담당자와 시각을 맞춰 되돌릴 수 있는 액션(활성 → 비활성)부터 시험하는 방법을 제안합니다                                                                                                                                                                                                                                                                        |
| 17  | 카테고리와 키워드(PK)의 연결 방식 | **이름 문자열로 보임(Phase 2 확인)**                               | `base-keywords` 응답에 `topic_id`가 없고 `topic` 이름만 옵니다. 기존 콘솔도 등록·수정 때 `item-value="topic"`으로 이름을 보냅니다. 서버가 정규화하지 않는다면 카테고리 이름을 바꿔도 기존 키워드는 이전 이름을 그대로 들고 남습니다. 기존 콘솔에 카테고리 삭제가 없는 것도 같은 이유로 보입니다. 확인 전까지 화면에는 결과를 단정하지도, 추측을 경고로 적지도 않습니다                                                                      |

## 8. 단계와 검증

진행 상황은 Phase 표로 관리합니다.

**Phase 1 완료(2026-09-15).** 수집정보·게시정보 목록과 상세 시트가 실 API로 동작합니다. 쓰기는 여전히 차단 상태이고, 활성·비활성·삭제·수동 수집은 확인 대화상자까지만 동작합니다. e2e는 로그인 화면 3건 그대로이며 로그인 이후 흐름은 수동 확인합니다.

**Phase 0 완료(2026-09-10).** 실제 계정으로 로그인, 헤더의 전역 매체 선택, 등급별 메뉴 표시까지 확인했습니다. 개발 환경도 운영 API를 직접 조회하며, 변경 요청은 read-only fetcher가 막습니다.

처음 계획에서 Phase 0에 넣었던 `features/articles`의 조회 조건 model(4.6)과 목록 툴바·기간 선택·미리보기·숫자·날짜 포맷(4.7)은 **Phase 1로 옮겼습니다.** 모두 수집·게시 화면 전용이고, 쓰는 화면 없이 먼저 만들면 컨벤션 1장의 "한 번 사용할 코드를 미래 사용 가능성만으로 공통화하지 않는다"에 어긋납니다. Phase 0의 범위는 인증·전송·전역 매체 범위·탐색 골격으로 확정합니다.

| Phase | 범위                                                                                                                       | 산출물                                                                      |
| ----- | -------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| 0     | 인증 교체, 토큰·401 처리, 읽기 전용 차단, 전역 매체 범위, 매체 코드·스토리지 URL, 메뉴·라우팅 골격, 환경변수               | **완료.** 로그인 후 헤더에서 매체를 고르고 빈 화면들이 메뉴로 연결되는 상태 |
| 1     | 수집정보, 게시정보, 콘텐츠 상세·미리보기. 조회 조건 URL model(4.6)과 목록 툴바·기간 선택·미리보기·숫자·날짜 포맷(4.7) 포함 | **완료(2026-09-15).** 상세와 미리보기는 시트 하나로 합쳤습니다              |
| 2     | 설정 5화면: 카테고리, 키워드(PK) 관리, 키워드(PK) 제외, 사용자 관리, 노출 가중치                                           | 테이블·폼 패턴 확정                                                         |
| 3     | 통계 8화면                                                                                                                 | 차트 패턴 확정                                                              |
| 4     | 숨겨진 화면 5개: 신고정보, 플랫폼 관리·상세, 기존 키워드, 채널, 비즈니스태그                                               | 화면 전체 완성. **여기서 UI/UX 확정 승인을 받습니다**                       |
| 5     | 쓰기 연결. read-only fetcher를 교체하고 feature 단위로 변경 요청을 붙임                                                    | 운영 가능 상태                                                              |

Phase 0~4는 조회만 실 API에 붙이고 변경 요청은 차단한 상태로 만듭니다(4.1). Phase 5는 `articles`의 활성·비활성부터 붙여 한 흐름을 확인한 뒤 나머지를 같은 순서로 연결합니다. 13개 feature의 변경 요청을 한꺼번에 여는 것은 운영 데이터에 대한 일괄 위험입니다.

각 Phase는 컨벤션 12장의 완료 기준을 따릅니다.

```bash
npm run format
npm run check
npm run test:coverage   # 타입·API·권한·데이터 처리 변경 시
npm run build
npm run test:e2e        # 화면·라우팅·사용자 동작 변경 시
```

테스트는 로직에만 둡니다. Phase 0은 등급 판단, 매체 코드 변환, 매체 범위 해석(저장값 검증과 기본값 대체), 필터 URL 파싱, Phase 1 이후는 각 feature의 응답 mapper와 필터 직렬화를 단위 테스트로 덮습니다. 화면은 e2e에서 로그인·목록·상세·일괄 액션·권한 숨김 흐름만 확인합니다.
