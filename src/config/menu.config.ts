import { BookOpen, LayoutDashboard, Plus, Rows3, Shapes } from 'lucide-react';

export const MENU_GROUPS = [
  {
    label: '워크스페이스',
    items: [
      { label: '대시보드', path: '/dashboard', icon: LayoutDashboard },
      { label: '콘텐츠 관리', path: '/entries', icon: Rows3 },
      {
        label: '새 콘텐츠 등록',
        path: '/entries/new',
        icon: Plus,
        editOnly: true,
      },
    ],
  },
  {
    label: '시작하기',
    items: [
      { label: 'UI 컴포넌트', path: '/components', icon: Shapes },
      { label: '개발 가이드', path: '/guide', icon: BookOpen },
    ],
  },
];
