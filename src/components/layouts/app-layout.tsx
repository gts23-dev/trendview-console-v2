import { useEffect, useState } from 'react';
import {
  ChevronRight,
  Layers,
  LogOut,
  Menu,
  PanelLeftClose,
} from 'lucide-react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import { APP_CONFIG } from '@/config/app.config';
import { MENU_GROUPS } from '@/config/menu.config';
import { cn } from '@/shared/utils/class-name';
import { isAdminGrade, useAuth } from '@/features/auth';
import { MediaSelect } from '@/features/medias';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from '@/components/ui/sheet';

// 운영 API를 개발 화면으로 착각해 데이터를 건드리는 사고를 막는 표시다.
const ENV_LABEL =
  import.meta.env.VITE_ENV_LABEL || (import.meta.env.PROD ? '' : 'LOCAL');

const CONTENT_WIDTH = 'mx-auto w-full max-w-[1600px]';

interface NavigationProps {
  onNavigate?: () => void;
}

function Navigation({ onNavigate }: NavigationProps) {
  const { session } = useAuth();
  return (
    <nav aria-label="주 메뉴" className="space-y-7 px-3 py-6">
      {MENU_GROUPS.map((group) => (
        <div key={group.label}>
          <p className="mb-3 px-3 text-[11px] font-semibold text-muted-foreground">
            {group.label}
          </p>
          <div className="space-y-1">
            {group.items
              // 메뉴 숨김은 표시 제어일 뿐이고 인가는 서버가 검증한다.
              .filter(
                (item) =>
                  !('adminOnly' in item && item.adminOnly) ||
                  isAdminGrade(session),
              )
              .map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={onNavigate}
                  className={({ isActive }) =>
                    cn(
                      'flex h-10 items-center gap-3 rounded-lg px-3 text-[13px] font-medium transition-colors',
                      isActive
                        ? 'bg-primary/8 text-primary'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                    )
                  }
                >
                  <item.icon className="size-[18px]" />
                  {item.label}
                </NavLink>
              ))}
          </div>
        </div>
      ))}
    </nav>
  );
}
function Brand() {
  return (
    <Link to="/collect" className="flex items-center gap-2.5">
      <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-white">
        <Layers className="size-5" />
      </span>
      <span className="text-[19px] font-bold tracking-tight">
        {APP_CONFIG.brand}
      </span>
    </Link>
  );
}
export function AppLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const { session, signOut } = useAuth();
  const { pathname } = useLocation();
  const current = MENU_GROUPS.flatMap((group) => group.items).find(
    (item) => item.path === pathname,
  );
  useEffect(() => {
    document.title = current
      ? `${current.label} · ${APP_CONFIG.name}`
      : APP_CONFIG.name;
  }, [current]);
  async function logout() {
    try {
      await signOut();
    } catch {
      // Query mutation을 사용하지 않는 인증 adapter의 실패를 알린다.
      // eslint-disable-next-line project/error-toast
      toast.error('로그아웃하지 못했습니다. 다시 시도해 주세요.');
    }
  }
  return (
    <div className="min-h-screen">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:bg-white focus:p-3"
      >
        본문으로 바로가기
      </a>
      {!collapsed && (
        <aside className="fixed inset-y-0 left-0 z-30 hidden w-[240px] flex-col border-r bg-white lg:flex">
          <div className="flex h-[72px] items-center px-6">
            <Brand />
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto">
            <Navigation />
          </div>
          <p className="p-5 text-[10px] text-muted-foreground">
            v{APP_CONFIG.version}
          </p>
        </aside>
      )}
      <div className={cn(!collapsed && 'lg:pl-[240px]')}>
        <header className="sticky top-0 z-20 border-b bg-white/95 backdrop-blur-sm">
          <div
            className={cn(
              CONTENT_WIDTH,
              'flex h-[72px] items-center justify-between gap-3 px-5 sm:px-8 lg:px-10',
            )}
          >
            <div className="flex min-w-0 items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden"
                aria-label="메뉴 열기"
                onClick={() => setMobileOpen(true)}
              >
                <Menu />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="hidden lg:inline-flex"
                aria-label={collapsed ? '사이드바 펼치기' : '사이드바 접기'}
                onClick={() => setCollapsed(!collapsed)}
              >
                <PanelLeftClose />
              </Button>
              <span className="hidden text-xs text-muted-foreground sm:block">
                {APP_CONFIG.name}
              </span>
              <ChevronRight className="hidden size-3 text-muted-foreground sm:block" />
              <span className="truncate text-xs font-medium">
                {current?.label ?? '콘텐츠 상세'}
              </span>
            </div>
            <div className="flex items-center gap-3 sm:gap-5">
              {ENV_LABEL && (
                <span className="rounded-md border px-2 py-1 text-[11px] font-medium text-muted-foreground">
                  {ENV_LABEL}
                </span>
              )}
              {/* 변경 요청을 막아 둔 상태임을 항상 보이게 한다. shared/api의
                  read-only fetcher를 제거할 때 이 표시도 함께 지운다. */}
              <span className="rounded-md bg-warning-soft px-2 py-1 text-[11px] font-medium text-warning">
                읽기 전용
              </span>
              <MediaSelect />
              <div className="flex items-center gap-2.5 border-l pl-4">
                <span className="grid size-8 place-items-center rounded-full bg-blue-50 text-xs font-semibold text-primary">
                  {session?.name.slice(0, 1)}
                </span>
                <div className="hidden sm:block">
                  <p className="text-xs font-medium">{session?.name}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {isAdminGrade(session) ? '관리자' : '운영자'}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="로그아웃"
                  onClick={logout}
                >
                  <LogOut className="size-4" />
                </Button>
              </div>
            </div>
          </div>
        </header>
        <main id="main-content" tabIndex={-1} className={CONTENT_WIDTH}>
          <Outlet />
        </main>
        <footer className={cn(CONTENT_WIDTH, 'px-5 sm:px-8 lg:px-10')}>
          <div className="flex flex-wrap items-center justify-between gap-2 border-t py-5 text-[11px] text-muted-foreground">
            <span>{APP_CONFIG.name}</span>
            <span>{session?.email}</span>
          </div>
        </footer>
      </div>
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-[280px] p-0">
          <div className="px-6 pt-7">
            <SheetTitle>
              <Brand />
            </SheetTitle>
            <SheetDescription className="sr-only">
              모바일 탐색 메뉴
            </SheetDescription>
          </div>
          <Navigation onNavigate={() => setMobileOpen(false)} />
        </SheetContent>
      </Sheet>
    </div>
  );
}
