import {
  BarChart3,
  EyeOff,
  FileText,
  Hash,
  Layers,
  LayoutGrid,
  ScrollText,
  Search,
  Settings,
  SlidersHorizontal,
  TrendingUp,
  Trophy,
  UserCheck,
  Users,
} from 'lucide-react';

/**
 * 만든 화면만 넣는다. 미리 걸어 두면 운영자가 눌렀을 때 빈 화면을 보게 된다.
 * 남은 화면과 순서, 등급 제한은 `docs/migration-plan.md` §3에 있다.
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
        icon: Trophy,
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
        icon: Layers,
        adminOnly: true,
      },
      {
        label: '접속자 순위',
        path: '/stats/visitors',
        icon: UserCheck,
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
