import { useState } from 'react';
import { Check, Copy, LoaderCircle, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { EntryStatusBadge } from '@/features/entries';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ConfirmDialog } from '@/components/common/confirm-dialog';
import { DetailSheet } from '@/components/common/detail-sheet';
import { EmptyState } from '@/components/common/empty-state';
import { PageHeader } from '@/components/common/page-header';

export function ComponentsPage() {
  const [sheet, setSheet] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [checked, setChecked] = useState(false);
  return (
    <div className="page-container">
      <PageHeader
        title="UI 컴포넌트"
        description="Metronic UI를 기반으로 모든 화면에서 일관되게 사용하는 기본 부품입니다."
        eyebrow="FOUNDATIONS"
      />
      <div className="grid items-start gap-6 xl:grid-cols-2">
        <section className="panel p-6">
          <p className="eyebrow mb-2">01 / ACTIONS</p>
          <h2 className="mb-5 font-semibold">버튼</h2>
          <div className="flex flex-wrap gap-3">
            <Button onClick={() => toast.success('저장했습니다.')}>
              <Plus />
              기본 버튼
            </Button>
            <Button
              variant="outline"
              onClick={() => toast('보조 작업 예제입니다.')}
            >
              보조 버튼
            </Button>
            <Button variant="ghost" onClick={() => toast('취소했습니다.')}>
              텍스트 버튼
            </Button>
            <Button variant="destructive" onClick={() => setConfirm(true)}>
              삭제
            </Button>
            <Button disabled>
              <LoaderCircle className="animate-spin" />
              처리 중
            </Button>
          </div>
          <p className="mt-5 text-xs leading-6 text-muted-foreground">
            한 영역에서 주요 액션은 하나만 강조합니다. 삭제는 확인 단계를
            거칩니다.
          </p>
        </section>
        <section className="panel p-6">
          <p className="eyebrow mb-2">02 / FORM</p>
          <h2 className="mb-5 font-semibold">입력과 선택</h2>
          <div className="grid gap-4">
            <div className="form-field">
              <Label htmlFor="example-input">제목</Label>
              <Input id="example-input" placeholder="제목을 입력해 주세요" />
            </div>
            <div className="form-field">
              <Label htmlFor="example-invalid">입력 오류 예시</Label>
              <Input
                id="example-invalid"
                aria-invalid="true"
                aria-describedby="example-error"
                placeholder="필수 입력"
              />
              <p id="example-error" className="form-error">
                필수 입력 항목입니다. (상태 예시)
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="example-checkbox"
                checked={checked}
                onCheckedChange={(value) => setChecked(value === true)}
              />
              <Label htmlFor="example-checkbox">선택 예제</Label>
            </div>
          </div>
        </section>
        <section className="panel p-6">
          <p className="eyebrow mb-2">03 / FEEDBACK</p>
          <h2 className="mb-5 font-semibold">상태와 피드백</h2>
          <div className="flex flex-wrap gap-3">
            <EntryStatusBadge status="published" />
            <EntryStatusBadge status="draft" />
            <EntryStatusBadge status="archived" />
          </div>
          <div className="mt-6 flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={() => toast.success('변경 내용을 저장했습니다.')}
            >
              <Check />
              성공 알림
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                // UI 부품의 오류 알림 모양을 시연한다.
                // eslint-disable-next-line project/error-toast
                toast.error('저장하지 못했습니다. 다시 시도해 주세요.');
              }}
            >
              실패 알림
            </Button>
          </div>
          <p className="mt-5 text-xs leading-6 text-muted-foreground">
            상태는 색과 텍스트를 함께 표시합니다.
          </p>
        </section>
        <section className="panel p-6">
          <p className="eyebrow mb-2">04 / OVERLAYS</p>
          <h2 className="mb-5 font-semibold">상세 패널과 확인 창</h2>
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" onClick={() => setSheet(true)}>
              상세 패널 열기
            </Button>
            <Button variant="outline" onClick={() => setConfirm(true)}>
              확인 창 열기
            </Button>
          </div>
          <p className="mt-5 text-xs leading-6 text-muted-foreground">
            Esc 키로 닫을 수 있습니다. 상세를 확인하는 동안 목록의 위치를
            유지합니다.
          </p>
        </section>
      </div>
      <section className="panel p-6">
        <p className="eyebrow mb-2">05 / DATA STATES</p>
        <h2 className="mb-5 font-semibold">목록 상태</h2>
        <Tabs defaultValue="empty">
          <TabsList>
            <TabsTrigger value="empty">빈 결과</TabsTrigger>
            <TabsTrigger value="loading">불러오는 중</TabsTrigger>
          </TabsList>
          <TabsContent value="empty">
            <EmptyState />
          </TabsContent>
          <TabsContent value="loading">
            <div className="space-y-5 py-8">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="size-10 rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-3 w-2/5" />
                    <Skeleton className="h-3 w-1/5" />
                  </div>
                  <Skeleton className="h-6 w-16" />
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </section>
      <DetailSheet
        open={sheet}
        onOpenChange={setSheet}
        title="상세 패널 예제"
        description="목록의 맥락을 유지하며 정보를 확인합니다."
        footer={
          <Button variant="outline" onClick={() => setSheet(false)}>
            닫기
          </Button>
        }
      >
        <div className="rounded-xl border bg-muted/30 p-6">
          <Copy className="mb-4 size-6 text-primary" />
          <h3 className="font-semibold">같은 구조, 다른 내용</h3>
          <p className="mt-3 text-sm leading-7 text-muted-foreground">
            제목, 본문, 하단 액션을 전달해 여러 화면에서 재사용할 수 있습니다.
          </p>
        </div>
      </DetailSheet>
      <ConfirmDialog
        open={confirm}
        onOpenChange={setConfirm}
        title="항목을 삭제할까요?"
        description="확인 창의 동작을 보여주는 예제입니다. 실제 데이터는 삭제되지 않습니다."
        onConfirm={() => {
          setConfirm(false);
          toast.success('확인 창 예제를 완료했습니다.');
        }}
      />
    </div>
  );
}
