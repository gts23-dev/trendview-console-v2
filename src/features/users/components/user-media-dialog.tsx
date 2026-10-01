import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useUserList } from '../hooks/use-users';

interface UserMediaDialogProps {
  open: boolean;
  mediaId: number;
  mediaName: string;
  onOpenChange: (open: boolean) => void;
  onSubmit: (userId: number) => void;
  pending: boolean;
}

export function UserMediaDialog({
  open,
  mediaId,
  mediaName,
  onOpenChange,
  onSubmit,
  pending,
}: UserMediaDialogProps) {
  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        if (!pending) onOpenChange(value);
      }}
    >
      <DialogContent className="sm:max-w-md">
        {/* 닫으면 사라지므로 열 때마다 선택이 빈 채로 시작한다. */}
        <UserMediaForm
          mediaId={mediaId}
          mediaName={mediaName}
          onCancel={() => onOpenChange(false)}
          onSubmit={onSubmit}
          pending={pending}
        />
      </DialogContent>
    </Dialog>
  );
}

interface UserMediaFormProps {
  mediaId: number;
  mediaName: string;
  onCancel: () => void;
  onSubmit: (userId: number) => void;
  pending: boolean;
}

function UserMediaForm({
  mediaId,
  mediaName,
  onCancel,
  onSubmit,
  pending,
}: UserMediaFormProps) {
  // 목록 검색어로 좁히면 후보가 비어 보일 수 있다. 검색 없이 받은 후보에서
  // 고른다. 목록도 검색 전이면 같은 캐시를 쓴다.
  const list = useUserList(mediaId, '');
  const candidates = list.data?.candidates ?? [];
  const [userId, setUserId] = useState('');

  const placeholder = list.data
    ? candidates.length > 0
      ? '사용자 선택'
      : '추가할 사용자가 없습니다.'
    : list.isError
      ? '사용자 목록을 불러오지 못했습니다.'
      : '불러오는 중...';

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        if (userId) onSubmit(Number(userId));
      }}
    >
      <DialogHeader>
        <DialogTitle>기존 사용자 추가</DialogTitle>
        <DialogDescription>
          다른 매체의 사용자가 {mediaName}도 볼 수 있게 합니다.
        </DialogDescription>
      </DialogHeader>
      <div className="grid gap-2 py-4">
        <Label htmlFor="user-media-user">사용자</Label>
        <Select
          value={userId}
          onValueChange={setUserId}
          disabled={pending || candidates.length === 0}
        >
          <SelectTrigger id="user-media-user">
            <SelectValue placeholder={placeholder} />
          </SelectTrigger>
          <SelectContent>
            {/* 이름이 같은 사용자가 있을 수 있어 이메일을 함께 보인다. */}
            {candidates.map((user) => (
              <SelectItem key={user.id} value={String(user.id)}>
                {user.name}
                <span className="ms-2 text-muted-foreground">{user.email}</span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <DialogFooter>
        <Button
          type="button"
          variant="outline"
          disabled={pending}
          onClick={onCancel}
        >
          취소
        </Button>
        <Button type="submit" disabled={pending || !userId}>
          {pending ? '추가 중...' : '추가'}
        </Button>
      </DialogFooter>
    </form>
  );
}
