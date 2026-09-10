import { lazy, Suspense } from 'react';
import {
  Archive,
  ArrowRight,
  ArrowUpRight,
  CircleCheck,
  Files,
  Layers,
  PencilLine,
  Plus,
  Rows3,
  Shapes,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { canEdit, useAuth } from '@/features/auth';
import { EntryStatusBadge, useEntryList } from '@/features/entries';
import { Button } from '@/components/ui/button';
import { ErrorState, LoadingState } from '@/components/common/empty-state';
import { PageHeader } from '@/components/common/page-header';

const ActivityChart = lazy(() =>
  import('./components/activity-chart').then((module) => ({
    default: module.ActivityChart,
  })),
);
export function DashboardPage() {
  const { session } = useAuth();
  const { data = [], isPending, isError, refetch } = useEntryList();
  const stats = [
    {
      label: '전체 콘텐츠',
      value: data.length,
      icon: Files,
      description: '워크스페이스의 모든 콘텐츠',
    },
    {
      label: '게시 중',
      value: data.filter((x) => x.status === 'published').length,
      icon: CircleCheck,
      description: '현재 게시된 콘텐츠',
    },
    {
      label: '임시 저장',
      value: data.filter((x) => x.status === 'draft').length,
      icon: PencilLine,
      description: '검토 또는 작성 중인 콘텐츠',
    },
    {
      label: '보관',
      value: data.filter((x) => x.status === 'archived').length,
      icon: Archive,
      description: '보관된 콘텐츠',
    },
  ];
  return (
    <div className="page-container">
      <PageHeader
        title="워크스페이스 한눈에 보기"
        description="콘텐츠 현황을 확인하고 오늘의 작업을 시작하세요."
        eyebrow="OVERVIEW"
        action={
          <Button asChild variant="outline" size="lg">
            <Link to="/entries">
              콘텐츠 관리
              <ArrowUpRight />
            </Link>
          </Button>
        }
      />
      <section className="relative overflow-hidden rounded-xl bg-[#17243d] px-7 py-7 text-white sm:px-8">
        <div className="subtle-grid absolute inset-0" />
        <div className="relative flex items-center justify-between gap-5">
          <div>
            <p className="mb-2 text-[11px] font-medium tracking-wider text-blue-200">
              YOUR NEXT CONSOLE STARTS HERE
            </p>
            <h2 className="text-[22px] font-semibold tracking-tight">
              필요한 화면을, 익숙한 패턴으로.
            </h2>
            <p className="mt-2 max-w-xl text-xs leading-6 text-slate-300">
              목록부터 상세, 입력 폼까지. 어드민에서 반복되는 공통 패턴을
              담았습니다.
            </p>
            <Link
              to="/guide"
              className="mt-4 inline-flex items-center gap-2 text-xs font-medium text-white"
            >
              시작 가이드 <ArrowRight className="size-3.5" />
            </Link>
          </div>
          <div className="hidden size-24 shrink-0 rotate-[-8deg] items-center justify-center rounded-2xl border border-white/15 bg-white/5 sm:flex">
            <Layers className="size-12 stroke-[1.1] text-blue-200" />
          </div>
        </div>
      </section>
      {isPending ? (
        <LoadingState />
      ) : isError ? (
        <ErrorState retry={refetch} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.label} className="panel p-5">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-muted-foreground">
                  {stat.label}
                </p>
                <stat.icon className="size-[18px] text-muted-foreground" />
              </div>
              <p className="mt-3 text-[30px] font-semibold tracking-tight tabular-nums">
                {stat.value}
                <span className="ml-1 text-xs font-normal text-muted-foreground">
                  건
                </span>
              </p>
              <p className="mt-2 text-[11px] text-muted-foreground">
                {stat.description}
              </p>
            </div>
          ))}
        </div>
      )}
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.7fr)_minmax(280px,1fr)]">
        <section className="panel p-6">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <h2 className="font-semibold">콘텐츠 조회 추이</h2>
              <p className="mt-1 text-xs text-muted-foreground">
                2026.09.01 – 09.07 · 예제 통계
              </p>
            </div>
            <span className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <span className="size-2 rounded-full bg-primary" />
              조회수
            </span>
          </div>
          <Suspense fallback={<LoadingState />}>
            <ActivityChart />
          </Suspense>
        </section>
        <section className="panel p-6">
          <h2 className="font-semibold">빠른 시작</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            기본 화면을 직접 살펴보세요.
          </p>
          <div className="mt-6 space-y-3">
            {[
              {
                title: '콘텐츠 목록',
                description: '검색, 필터, 선택, 페이지 이동',
                path: '/entries',
                icon: Rows3,
              },
              {
                title: '콘텐츠 등록',
                description: '입력 검증과 저장 흐름',
                path: '/entries/new',
                icon: Plus,
                editOnly: true,
              },
              {
                title: 'UI 컴포넌트',
                description: '버튼, 입력창, 상태, 패널',
                path: '/components',
                icon: Shapes,
              },
            ]
              .filter((item) => !item.editOnly || canEdit(session))
              .map((item) => (
                <Link
                  to={item.path}
                  key={item.path}
                  className="group flex items-center gap-3 rounded-lg border p-3.5 transition-colors hover:border-primary/30 hover:bg-primary/3"
                >
                  <span className="rounded-lg bg-muted p-2">
                    <item.icon className="size-4 text-muted-foreground" />
                  </span>
                  <div className="flex-1">
                    <p className="text-xs font-semibold group-hover:text-primary">
                      {item.title}
                    </p>
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      {item.description}
                    </p>
                  </div>
                  <ChevronIcon />
                </Link>
              ))}
          </div>
        </section>
      </div>
      <section className="panel overflow-hidden">
        <div className="flex items-center justify-between border-b p-5">
          <div>
            <h2 className="font-semibold">최근 수정된 콘텐츠</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              가장 최근에 작업한 콘텐츠를 이어서 확인하세요.
            </p>
          </div>
          <Link
            to="/entries"
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary"
          >
            전체 보기
            <ArrowUpRight className="size-3.5" />
          </Link>
        </div>
        {isPending ? (
          <LoadingState />
        ) : isError ? (
          <ErrorState retry={refetch} />
        ) : data.length ? (
          [...data]
            .sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt))
            .slice(0, 4)
            .map((item) => (
              <Link
                key={item.id}
                to={`/entries?detail=${item.id}`}
                className="flex items-center gap-4 border-b px-5 py-4 last:border-b-0 hover:bg-muted/50"
              >
                <span className="rounded-md border bg-muted/40 p-2">
                  <Files className="size-4 text-muted-foreground" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-medium">{item.title}</p>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    {item.category} · {item.author}
                  </p>
                </div>
                <EntryStatusBadge status={item.status} />
                <span className="hidden text-[11px] text-muted-foreground sm:inline">
                  {new Date(item.updatedAt).toLocaleDateString('ko-KR')}
                </span>
                <ArrowUpRight className="size-4 text-muted-foreground" />
              </Link>
            ))
        ) : (
          <p className="p-8 text-center text-muted-foreground">
            등록된 콘텐츠가 없습니다.
          </p>
        )}
      </section>
    </div>
  );
}
function ChevronIcon() {
  return <ArrowUpRight className="size-4 text-muted-foreground" />;
}
