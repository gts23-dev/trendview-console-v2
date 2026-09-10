import { useState } from 'react';
import { ArrowRight, Check, Eye, Layers, ShieldCheck } from 'lucide-react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { APP_CONFIG } from '@/config/app.config';
import { cn } from '@/shared/utils/class-name';
import { useAuth, type Session } from '@/features/auth';
import { Button } from '@/components/ui/button';
import { LoadingState } from '@/components/common/empty-state';

export function LoginPage() {
  const { session, loading, signIn, error: authError } = useAuth();
  const [role, setRole] = useState<Session['role']>('admin');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const from =
    typeof location.state?.from === 'string' &&
    location.state.from.startsWith('/') &&
    !location.state.from.startsWith('//')
      ? location.state.from
      : '/dashboard';
  if (loading) return <LoadingState />;
  if (session) return <Navigate to={from} replace />;
  async function enter() {
    setPending(true);
    setError('');
    try {
      await signIn(role);
      navigate(from, { replace: true });
    } catch {
      setError(
        '데모를 시작하지 못했습니다. 브라우저 저장소 설정을 확인해 주세요.',
      );
    } finally {
      setPending(false);
    }
  }
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <aside className="subtle-grid relative hidden flex-col justify-between bg-[#17243d] p-14 text-white lg:flex">
        <div className="flex items-center gap-3">
          <Layers className="size-7" />
          <span className="text-2xl font-semibold tracking-tight">
            console.
          </span>
        </div>
        <div>
          <p className="eyebrow mb-5 text-blue-200!">
            A FOUNDATION FOR YOUR NEXT PROJECT
          </p>
          <h1 className="text-4xl leading-snug font-semibold tracking-tight">
            다음 콘솔의 시작,
            <br />잘 정리된 기본부터.
          </h1>
          <p className="mt-6 max-w-sm text-sm leading-7 text-slate-300">
            어드민에서 반복되는 화면 패턴과
            <br />
            Metronic의 UI를 하나의 시작점에 담았습니다.
          </p>
          <div className="mt-10 flex flex-wrap gap-2">
            {['React + TypeScript', 'Metronic UI', '공통 화면 패턴'].map(
              (x) => (
                <span
                  key={x}
                  className="rounded-full border border-white/20 px-3 py-1.5 text-xs text-slate-300"
                >
                  {x}
                </span>
              ),
            )}
          </div>
        </div>
        <p className="text-xs text-slate-400">
          {APP_CONFIG.name} · {APP_CONFIG.version}
        </p>
      </aside>
      <main className="flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-[400px]">
          <div className="mb-10 flex items-center gap-2 text-primary lg:hidden">
            <Layers />
            <span className="text-xl font-bold">console.</span>
          </div>
          <span className="rounded-md bg-warning-soft px-2 py-1 text-xs font-medium text-warning">
            데모 모드
          </span>
          <h2 className="mt-5 text-[28px] font-semibold tracking-tight">
            워크스페이스 둘러보기
          </h2>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            예제 계정을 선택해 기본 화면을 확인하세요.
            <br />
            실제 계정이나 비밀번호는 필요하지 않습니다.
          </p>
          <fieldset className="mt-8 space-y-3" disabled={pending}>
            <legend className="mb-3 text-xs font-medium">예제 계정</legend>
            {[
              {
                value: 'admin' as const,
                label: '관리자',
                description: '조회 · 등록 · 수정 · 삭제',
                icon: ShieldCheck,
              },
              {
                value: 'viewer' as const,
                label: '조회 전용',
                description: '목록과 상세 조회',
                icon: Eye,
              },
            ].map((item) => (
              <label
                key={item.value}
                className={cn(
                  'flex cursor-pointer items-center gap-3 rounded-xl border p-4',
                  role === item.value
                    ? 'border-primary bg-primary/3'
                    : 'hover:bg-muted/50',
                )}
              >
                <input
                  type="radio"
                  name="role"
                  value={item.value}
                  checked={role === item.value}
                  onChange={() => setRole(item.value)}
                  className="peer sr-only"
                />
                <item.icon
                  className={cn(
                    'size-5',
                    role === item.value
                      ? 'text-primary'
                      : 'text-muted-foreground',
                  )}
                />
                <span className="flex-1">
                  <span className="block text-sm font-semibold">
                    {item.label}
                  </span>
                  <span className="mt-1 block text-xs text-muted-foreground">
                    {item.description}
                  </span>
                </span>
                <span className="grid size-5 place-items-center rounded-full border peer-focus-visible:ring-2 peer-focus-visible:ring-primary">
                  {role === item.value && (
                    <Check className="size-3 text-primary" />
                  )}
                </span>
              </label>
            ))}
          </fieldset>
          {(error || authError) && (
            <p role="alert" className="mt-4 text-sm text-destructive">
              {error || authError}
            </p>
          )}
          <Button
            className="mt-6 h-11 w-full"
            disabled={pending || !!authError}
            onClick={enter}
          >
            {pending ? '시작하는 중...' : '데모 시작하기'}
            <ArrowRight />
          </Button>
          <p className="mt-5 text-center text-[11px] leading-6 text-muted-foreground">
            데이터는 현재 탭에만 저장됩니다.
            <br />
            실제 서비스와 연결되지 않은 UI 예제입니다.
          </p>
        </div>
      </main>
    </div>
  );
}
