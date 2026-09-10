import { useState } from 'react';
import {
  ArrowRight,
  FolderTree,
  Layers,
  Plug,
  RotateCcw,
  Users,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { canEdit, useAuth } from '@/features/auth';
import { useResetEntries } from '@/features/entries';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/common/confirm-dialog';
import { PageHeader } from '@/components/common/page-header';

export function GuidePage() {
  const { session } = useAuth();
  const [confirm, setConfirm] = useState(false);
  const reset = useResetEntries();
  function handleReset() {
    reset.mutate(undefined, {
      onSuccess: () => {
        setConfirm(false);
        toast.success('예제 데이터를 초기화했습니다.');
      },
    });
  }
  return (
    <div className="page-container">
      <PageHeader
        title="이 프로젝트로 시작하기"
        description="두 콘솔에서 사용한 구조와 Metronic UI를 새로운 서비스의 출발점으로 정리했습니다."
        eyebrow="GET STARTED"
      />
      <section className="rounded-xl border border-primary/20 bg-primary/4 p-6">
        <h2 className="font-semibold">지금은 데모 모드입니다</h2>
        <p className="mt-2 max-w-3xl text-sm leading-7 text-muted-foreground">
          로그인과 콘텐츠는 예제 데이터로 동작합니다. 데이터는 현재 브라우저
          탭에만 저장되고 실제 서버로 전송되지 않습니다. 관리자·조회 전용 계정은
          화면 권한을 확인하기 위한 예제이며 실제 보안 인증이 아닙니다.
        </p>
      </section>
      <div className="grid gap-5 lg:grid-cols-2">
        {[
          {
            icon: FolderTree,
            title: '화면 단위로 나눕니다',
            text: 'pages 아래에 화면 폴더를 만들고, 전용 목록·필터·상세는 그 안에 둡니다. 여러 화면에서 사용하는 부품만 components/common으로 옮깁니다.',
          },
          {
            icon: Layers,
            title: 'UI 부품은 함께 사용합니다',
            text: '버튼·입력창·표는 components/ui를 사용합니다. 전역 색상은 styles/globals.css, 메뉴는 config/menu.config.ts에서 관리합니다.',
          },
          {
            icon: Plug,
            title: 'API 연결은 별도로 바꿉니다',
            text: '현재 api/entries.ts는 예제 데이터를 다룹니다. 실제 연동 시 이 계층과 auth의 데모 adapter를 교체합니다. HTTP 요청 공통부는 api/http-client.ts에 있습니다.',
          },
          {
            icon: Users,
            title: '두 사람의 작업 경계를 정합니다',
            text: '각자 맡은 화면과 해당 API·훅·타입을 함께 작업합니다. 레이아웃·인증·메뉴 같은 공통 파일은 담당자를 정하고 변경 전에 서로 알립니다.',
          },
        ].map((item, i) => (
          <section key={item.title} className="panel p-6">
            <div className="flex items-center justify-between">
              <item.icon className="size-5 text-primary" />
              <span className="text-xs text-muted-foreground">0{i + 1}</span>
            </div>
            <h2 className="mt-5 font-semibold">{item.title}</h2>
            <p className="mt-3 text-sm leading-7 text-muted-foreground">
              {item.text}
            </p>
          </section>
        ))}
      </div>
      <section className="panel p-6">
        <h2 className="font-semibold">코드 작성 기본 규칙</h2>
        <p className="mt-2 text-sm leading-7 text-muted-foreground">
          전체 기준과 출처는 프로젝트의 docs/conventions.md에 정리되어 있습니다.
        </p>
        <ul className="mt-4 space-y-2 text-sm leading-7 text-muted-foreground">
          <li>
            파일은 entry-toolbar.tsx처럼, 컴포넌트는 EntryToolbar처럼 이름
            짓습니다.
          </li>
          <li>
            화면은 훅을 사용하고, 훅이 API 요청과 저장 후 데이터 갱신을
            맡습니다.
          </li>
          <li>
            성공 알림은 화면에서, 저장 실패 알림은 공통 설정에서 한 번만
            표시합니다.
          </li>
          <li>
            다른 화면의 내부 파일을 가져오지 않고 필요한 코드를 공통 폴더로
            옮깁니다.
          </li>
          <li>
            npm run format으로 정렬하고 npm run check로 규칙과 테스트를
            확인합니다.
          </li>
        </ul>
      </section>
      <section className="panel overflow-hidden">
        <div className="border-b p-6">
          <h2 className="font-semibold">새 화면을 추가하는 순서</h2>
        </div>
        <ol className="grid gap-6 p-6 md:grid-cols-3">
          {[
            'pages에 새 폴더를 만들고 목록 예제를 참고해 화면을 작성합니다.',
            'types에 데이터 타입, api에 요청 함수, hooks에 조회·저장을 작성합니다. 로딩·빈 결과·실패 상태도 확인합니다.',
            'routing/app-router.tsx와 메뉴 설정에 등록하고 권한·이동·저장을 검증합니다.',
          ].map((text, i) => (
            <li key={text} className="text-sm leading-7">
              <span className="mb-3 grid size-7 place-items-center rounded-full bg-muted text-xs font-semibold">
                {i + 1}
              </span>
              {text}
            </li>
          ))}
        </ol>
        <div className="border-t bg-muted/30 px-6 py-4">
          <Link
            to="/entries"
            className="inline-flex items-center gap-2 text-xs font-medium text-primary"
          >
            목록 예제 살펴보기
            <ArrowRight className="size-3.5" />
          </Link>
        </div>
      </section>
      {canEdit(session) && (
        <section className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-dashed p-6">
          <div>
            <h2 className="text-sm font-semibold">
              예제를 처음 상태로 되돌리기
            </h2>
            <p className="mt-2 text-xs text-muted-foreground">
              추가·수정한 내용을 지우고 기본 콘텐츠 24개를 복원합니다.
            </p>
          </div>
          <Button variant="outline" onClick={() => setConfirm(true)}>
            <RotateCcw />
            예제 데이터 초기화
          </Button>
        </section>
      )}
      <ConfirmDialog
        open={confirm}
        onOpenChange={setConfirm}
        title="예제 데이터를 초기화할까요?"
        description="이 탭에서 추가·수정한 모든 콘텐츠가 기본 예제로 교체됩니다."
        confirmLabel="초기화"
        pending={reset.isPending}
        onConfirm={handleReset}
      />
    </div>
  );
}
