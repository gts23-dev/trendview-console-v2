import { FileText, LayoutGrid } from 'lucide-react';

/**
 * 만든 화면만 넣는다. 화면을 붙일 때 라우터(`routing/app-router.tsx`)와 여기에
 * 한 줄씩 추가한다. 아직 없는 화면을 미리 걸어 두면 운영자가 눌렀을 때 빈
 * 화면을 보게 된다. 남은 화면 목록과 순서는 `docs/migration-plan.md` §3에 있다.
 *
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
];
