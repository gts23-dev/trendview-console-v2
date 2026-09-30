import {
  EyeOff,
  FileText,
  Hash,
  LayoutGrid,
  Settings,
  SlidersHorizontal,
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
    label: '설정',
    items: [
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
