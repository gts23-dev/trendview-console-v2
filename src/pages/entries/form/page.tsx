import { useCallback, useRef } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, Info, Save } from 'lucide-react';
import { useForm } from 'react-hook-form';
import {
  Link,
  useBeforeUnload,
  useBlocker,
  useLocation,
  useNavigate,
  useParams,
} from 'react-router-dom';
import { toast } from 'sonner';
import { canEdit, useAuth } from '@/features/auth';
import {
  entryInputSchema,
  useEntryList,
  useSaveEntry,
  type Entry,
  type EntryInput,
} from '@/features/entries';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ConfirmDialog } from '@/components/common/confirm-dialog';
import {
  EmptyState,
  ErrorState,
  LoadingState,
} from '@/components/common/empty-state';
import { PageHeader } from '@/components/common/page-header';

interface EntryFormProps {
  entry?: Entry;
}

function EntryForm({ entry }: EntryFormProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const returnTo =
    typeof location.state?.returnTo === 'string' &&
    /^\/entries(?:\?|$)/.test(location.state.returnTo)
      ? location.state.returnTo
      : '/entries';
  const saved = useRef(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<EntryInput>({
    resolver: zodResolver(entryInputSchema),
    defaultValues: entry ?? {
      title: '',
      category: '공지',
      status: 'draft',
      description: '',
    },
  });
  const blocker = useBlocker(() => isDirty && !saved.current);
  useBeforeUnload(
    useCallback(
      (event) => {
        if (isDirty && !saved.current) event.preventDefault();
      },
      [isDirty],
    ),
  );
  const mutation = useSaveEntry(entry?.id);
  function handleSave(input: EntryInput) {
    mutation.mutate(input, {
      onSuccess: () => {
        saved.current = true;
        toast.success(
          entry ? '콘텐츠를 수정했습니다.' : '콘텐츠를 등록했습니다.',
        );
        navigate(returnTo);
      },
    });
  }
  return (
    <div className="page-container">
      <Link
        to={returnTo}
        className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary"
      >
        <ArrowLeft className="size-3.5" />
        목록으로 돌아가기
      </Link>
      <PageHeader
        title={entry ? '콘텐츠 수정' : '콘텐츠 등록'}
        description="기본 정보를 입력한 후 저장해 주세요."
        eyebrow="CONTENT"
      />
      <form
        onSubmit={handleSubmit(handleSave)}
        className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_280px]"
      >
        <div className="panel">
          <div className="border-b px-6 py-5">
            <h2 className="font-semibold">기본 정보</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              별표(*)로 표시된 항목은 필수입니다.
            </p>
          </div>
          <fieldset disabled={mutation.isPending} className="space-y-6 p-6">
            <div className="form-field">
              <label htmlFor="title">
                제목 <span className="text-primary">*</span>
              </label>
              <Input
                id="title"
                className="h-11"
                placeholder="콘텐츠 제목을 입력해 주세요"
                aria-invalid={!!errors.title}
                aria-describedby={errors.title ? 'title-error' : undefined}
                {...register('title')}
              />
              {errors.title && (
                <p id="title-error" className="form-error" role="alert">
                  {errors.title.message}
                </p>
              )}
            </div>
            <div className="grid gap-6 sm:grid-cols-2">
              <div className="form-field">
                <label htmlFor="category">
                  카테고리 <span className="text-primary">*</span>
                </label>
                <select
                  id="category"
                  className="native-select"
                  {...register('category')}
                >
                  <option>공지</option>
                  <option>가이드</option>
                  <option>업데이트</option>
                </select>
                {errors.category && (
                  <p className="form-error">{errors.category.message}</p>
                )}
              </div>
              <div className="form-field">
                <label htmlFor="status">
                  상태 <span className="text-primary">*</span>
                </label>
                <select
                  id="status"
                  className="native-select"
                  {...register('status')}
                >
                  <option value="draft">임시 저장</option>
                  <option value="published">게시 중</option>
                  <option value="archived">보관</option>
                </select>
              </div>
            </div>
            <div className="form-field">
              <label htmlFor="description">내용</label>
              <Textarea
                id="description"
                className="min-h-60 leading-7"
                placeholder="콘텐츠 내용을 입력해 주세요"
                {...register('description')}
                aria-describedby="description-help"
              />
              <p
                id="description-help"
                className="text-xs text-muted-foreground"
              >
                최대 3,000자까지 입력할 수 있습니다.
              </p>
              {errors.description && (
                <p className="form-error" role="alert">
                  {errors.description.message}
                </p>
              )}
            </div>
          </fieldset>
          <div className="flex items-center justify-end gap-2 border-t px-6 py-4">
            <Button
              variant="outline"
              type="button"
              onClick={() => navigate(returnTo)}
              disabled={mutation.isPending}
            >
              취소
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              <Save />
              {mutation.isPending ? '저장 중...' : '저장하기'}
            </Button>
          </div>
        </div>
        <aside className="rounded-xl border bg-muted/40 p-5">
          <Info className="mb-3 size-5 text-primary" />
          <h2 className="text-sm font-semibold">저장 전 확인해 주세요</h2>
          <ul className="mt-3 space-y-3 text-xs leading-6 text-muted-foreground">
            <li>제목은 내용을 알아보기 쉽게 작성해 주세요.</li>
            <li>작성 중인 콘텐츠는 ‘임시 저장’ 상태로 보관할 수 있습니다.</li>
            <li>
              이 화면은 예제이며 저장 결과는 현재 브라우저 탭에서만 유지됩니다.
            </li>
          </ul>
        </aside>
      </form>
      <ConfirmDialog
        open={blocker.state === 'blocked'}
        onOpenChange={(open) => {
          if (!open && blocker.state === 'blocked') blocker.reset();
        }}
        title="작성을 그만둘까요?"
        description="저장하지 않은 변경 내용은 사라집니다."
        confirmLabel="나가기"
        destructive={false}
        onConfirm={() => {
          if (blocker.state === 'blocked') blocker.proceed();
        }}
      />
    </div>
  );
}
export function EntryFormPage() {
  const { id } = useParams();
  const { session } = useAuth();
  const { data, isPending, isError, refetch } = useEntryList();
  if (!canEdit(session))
    return (
      <EmptyState
        title="수정 권한이 없습니다"
        description="조회 전용 계정에서는 등록과 수정을 할 수 없습니다."
      />
    );
  if (id && isPending) return <LoadingState />;
  if (id && isError) return <ErrorState retry={refetch} />;
  const entry = data?.find((item) => item.id === id);
  if (id && !entry)
    return (
      <EmptyState
        title="콘텐츠를 찾을 수 없습니다"
        description="삭제되었거나 잘못된 주소입니다."
      />
    );
  return <EntryForm key={id ?? 'new'} entry={entry} />;
}
