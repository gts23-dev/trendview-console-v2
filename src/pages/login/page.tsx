import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Layers, LogIn } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { APP_CONFIG } from '@/config/app.config';
import { getErrorMessage } from '@/shared/errors/app-error';
import { useAuth } from '@/features/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LoadingState } from '@/components/common/empty-state';

const loginSchema = z.object({
  username: z.string().min(1, '아이디를 입력해 주세요.'),
  password: z.string().min(1, '비밀번호를 입력해 주세요.'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export function LoginPage() {
  const { session, loading, signIn, error: authError } = useAuth();
  const [submitError, setSubmitError] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: '', password: '' },
  });
  const from =
    typeof location.state?.from === 'string' &&
    location.state.from.startsWith('/') &&
    !location.state.from.startsWith('//')
      ? location.state.from
      : '/collect';
  if (loading) return <LoadingState />;
  if (session) return <Navigate to={from} replace />;

  // 로그인은 Query를 거치지 않으므로 실패 문구를 이 화면에서 표시한다.
  const submit = handleSubmit(async (values) => {
    setSubmitError('');
    try {
      await signIn(values);
      navigate(from, { replace: true });
    } catch (error) {
      setSubmitError(getErrorMessage(error));
    }
  });

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <aside className="subtle-grid relative hidden flex-col justify-between bg-[#17243d] p-14 text-white lg:flex">
        <div className="flex items-center gap-3">
          <Layers className="size-7" />
          <span className="text-2xl font-semibold tracking-tight">
            {APP_CONFIG.brand}.
          </span>
        </div>
        <div>
          <h1 className="text-4xl leading-snug font-semibold tracking-tight">
            트렌드뷰 운영 콘솔
          </h1>
          <p className="mt-6 max-w-sm text-sm leading-7 text-slate-300">
            매체별 수집·게시 콘텐츠와 통계를
            <br />
            한곳에서 관리합니다.
          </p>
        </div>
        <p className="text-xs text-slate-400">
          {APP_CONFIG.name} · {APP_CONFIG.version}
        </p>
      </aside>
      <main className="flex items-center justify-center p-6 sm:p-12">
        <form onSubmit={submit} className="w-full max-w-[400px]">
          <div className="mb-10 flex items-center gap-2 text-primary lg:hidden">
            <Layers />
            <span className="text-xl font-bold">{APP_CONFIG.brand}.</span>
          </div>
          <h2 className="text-[28px] font-semibold tracking-tight">로그인</h2>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            운영자 계정으로 로그인하세요.
          </p>
          <fieldset className="mt-8 space-y-5" disabled={isSubmitting}>
            <div className="space-y-2">
              <Label htmlFor="username">아이디</Label>
              <Input
                id="username"
                autoComplete="username"
                aria-invalid={!!errors.username}
                aria-describedby={
                  errors.username ? 'username-error' : undefined
                }
                {...register('username')}
              />
              {errors.username && (
                <p id="username-error" className="text-xs text-destructive">
                  {errors.username.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">비밀번호</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                aria-invalid={!!errors.password}
                aria-describedby={
                  errors.password ? 'password-error' : undefined
                }
                {...register('password')}
              />
              {errors.password && (
                <p id="password-error" className="text-xs text-destructive">
                  {errors.password.message}
                </p>
              )}
            </div>
          </fieldset>
          {(submitError || authError) && (
            <p role="alert" className="mt-4 text-sm text-destructive">
              {submitError || authError}
            </p>
          )}
          <Button
            type="submit"
            className="mt-6 h-11 w-full"
            disabled={isSubmitting}
          >
            {isSubmitting ? '로그인 중...' : '로그인'}
            <LogIn />
          </Button>
        </form>
      </main>
    </div>
  );
}
