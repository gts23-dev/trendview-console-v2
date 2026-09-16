import {
  BarChart3,
  EyeOff,
  FileText,
  Hash,
  LayoutGrid,
  ListOrdered,
  ScrollText,
  Search,
  Settings,
  SlidersHorizontal,
  Tags,
  TrendingUp,
  Users,
} from 'lucide-react';

/**
 * `adminOnly`는 어드민 이용등급이 0이 아닐 때만 표시한다는 뜻이다. 메뉴 숨김은
 * 사용 편의를 위한 표시 제어이고 실제 인가는 서버가 검증한다.
 */
export const MENU_GROUPS = [
  {
    label: '관리',
    items: [
      { label: '수집정보', path: '/collect', icon: LayoutGrid },
      { label: '게시정보', path: '/articles', icon: FileText },
    ],
  },
  {
    label: '통계',
    items: [
      {
        label: '수집/게시/신고 개수',
        path: '/stats/counts',
        icon: BarChart3,
        adminOnly: true,
      },
      {
        label: '일간 사용자 유입량',
        path: '/stats/users',
        icon: TrendingUp,
        adminOnly: true,
      },
      {
        label: '콘텐츠 순위',
        path: '/stats/contents',
        icon: ListOrdered,
        adminOnly: true,
      },
      {
        label: '키워드(PK) 순위',
        path: '/stats/tags',
        icon: Hash,
        adminOnly: true,
      },
      {
        label: '키워드(PK) 집계',
        path: '/stats/tag-totals',
        icon: Tags,
        adminOnly: true,
      },
      {
        label: '접속자 순위',
        path: '/stats/visitors',
        icon: Users,
        adminOnly: true,
      },
      {
        label: '사용자 검색',
        path: '/stats/user-search',
        icon: Search,
        adminOnly: true,
      },
      {
        label: '사용자 접속 로그',
        path: '/stats/user-logs',
        icon: ScrollText,
        adminOnly: true,
      },
    ],
  },
  {
    label: '설정',
    items: [
      {
        label: '사용자 관리',
        path: '/settings/users',
        icon: Users,
        adminOnly: true,
      },
      { label: '카테고리 관리', path: '/settings/topics', icon: Settings },
      {
        label: '키워드(PK) 관리',
        path: '/settings/base-keywords',
        icon: Hash,
      },
      {
        label: '키워드(PK) 제외',
        path: '/settings/tag-ignores',
        icon: EyeOff,
        adminOnly: true,
      },
      {
        label: '노출 가중치 관리',
        path: '/settings/exposure',
        icon: SlidersHorizontal,
        adminOnly: true,
      },
    ],
  },
];
