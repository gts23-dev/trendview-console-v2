import { Fragment, useState } from 'react';
import { Plus, UserPlus } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { useMediaScope } from '@/features/medias';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/common/data-table';
import { PageHeader } from '@/components/common/page-header';
import { SearchField } from '@/components/common/search-field';
import { userColumns } from '../columns/user-columns';
import {
  useAddUserMedia,
  useCreateUser,
  useUserList,
} from '../hooks/use-users';
import {
  pageUsers,
  parseUserFilters,
  serializeUserFilters,
  USER_PAGE_SIZE,
  type UserFilters,
} from '../model/filters';
import { UserFormDialog } from './user-form-dialog';
import { UserMediaDialog } from './user-media-dialog';

// 기존 콘솔의 "매체 미지정"은 옮기지 않았다. 매체는 헤더에서 고르는 전역
// 범위다(docs/migration-plan.md §5).
export function UserListView() {
  const { mediaId, medias } = useMediaScope();
  const [searchParams, setSearchParams] = useSearchParams();
  const filters = parseUserFilters(searchParams);
  const [dialog, setDialog] = useState<'create' | 'add' | null>(null);
  const list = useUserList(mediaId, filters.search);
  const create = useCreateUser();
  const addMedia = useAddUserMedia();

  function apply(next: Partial<UserFilters>) {
    setSearchParams((current) =>
      serializeUserFilters(
        // 조건이 바뀌면 쪽은 처음으로 돌린다.
        { ...filters, ...next, page: next.page ?? 1 },
        current,
      ),
    );
  }

  const users = list.data?.users ?? [];
  const mediaName = medias.find((media) => media.id === mediaId)?.name ?? '';

  return (
    <div className="space-y-5 px-5 py-6 sm:px-8 lg:px-10">
      <PageHeader
        title="사용자 관리"
        description="헤더에서 고른 매체를 볼 수 있는 사용자입니다. 새 사용자는 이 매체로 등록됩니다."
      />

      <DataTable
        columns={userColumns}
        data={pageUsers(users, filters.page)}
        totalCount={users.length}
        page={filters.page}
        pageSize={USER_PAGE_SIZE}
        onPageChange={(page) => apply({ page })}
        isLoading={list.isPending}
        emptyMessage={
          filters.search ? '검색 결과가 없습니다.' : '등록된 사용자가 없습니다.'
        }
        toolbar={
          <>
            <Button
              disabled={mediaId === null}
              onClick={() => setDialog('create')}
            >
              <UserPlus />
              사용자 등록
            </Button>
            <Button
              variant="outline"
              disabled={mediaId === null}
              onClick={() => setDialog('add')}
            >
              <Plus />
              기존 사용자 추가
            </Button>
            <SearchField
              value={filters.search}
              placeholder="이름 또는 이메일"
              onSearch={(search) => apply({ search })}
            />
          </>
        }
      />

      {/* 모달이 열린 채로 매체가 바뀌면(뒤로 가기 등) 이전 매체에서 입력·선택한
          값이 새 매체로 나가지 않게 모달 안을 새로 시작한다. */}
      {mediaId !== null && (
        <Fragment key={mediaId}>
          <UserFormDialog
            open={dialog === 'create'}
            mediaName={mediaName}
            pending={create.isPending}
            onOpenChange={(open) => setDialog(open ? 'create' : null)}
            onSubmit={(values) =>
              create.mutate(
                { mediaId, ...values },
                {
                  onSuccess: () => {
                    toast.success('등록했습니다.');
                    setDialog(null);
                  },
                  // 성공·실패와 상관없이 요청 기록에 남은 비밀번호를 지운다.
                  onSettled: () => create.reset(),
                },
              )
            }
          />
          <UserMediaDialog
            open={dialog === 'add'}
            mediaId={mediaId}
            mediaName={mediaName}
            pending={addMedia.isPending}
            onOpenChange={(open) => setDialog(open ? 'add' : null)}
            onSubmit={(userId) =>
              addMedia.mutate(
                { userId, mediaId },
                {
                  onSuccess: () => {
                    toast.success('추가했습니다.');
                    setDialog(null);
                  },
                },
              )
            }
          />
        </Fragment>
      )}
    </div>
  );
}
