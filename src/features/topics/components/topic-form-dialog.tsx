import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { Topic } from '../model/types';

interface TopicFormDialogProps {
  open: boolean;
  /** 수정 대상. 없으면 등록이다. */
  topic: Topic | null;
  onOpenChange: (open: boolean) => void;
  onSubmit: (name: string) => void;
  pending: boolean;
}

export function TopicFormDialog({
  open,
  topic,
  onOpenChange,
  onSubmit,
  pending,
}: TopicFormDialogProps) {
  const [name, setName] = useState('');
  // 다이얼로그는 등록과 수정이 공유한다. 열 때마다 대상 값으로 되돌린다.
  useEffect(() => {
    if (open) setName(topic?.topic ?? '');
  }, [open, topic]);

  const trimmed = name.trim();
  const unchanged = !!topic && trimmed === topic.topic;

  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        if (!pending) onOpenChange(value);
      }}
    >
      <DialogContent>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            if (trimmed && !unchanged) onSubmit(trimmed);
          }}
        >
          <DialogHeader>
            <DialogTitle>
              {topic ? '카테고리 수정' : '카테고리 추가'}
            </DialogTitle>
            <DialogDescription>
              {topic
                ? '이름을 바꾸면 이 카테고리로 등록한 키워드(PK)의 표시도 함께 바뀝니다.'
                : '현재 선택한 매체에 카테고리를 추가합니다.'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-2 py-4">
            <Label htmlFor="topic-name">카테고리</Label>
            <Input
              id="topic-name"
              value={name}
              maxLength={50}
              autoComplete="off"
              placeholder="예: 골프"
              onChange={(event) => setName(event.target.value)}
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={pending}
              onClick={() => onOpenChange(false)}
            >
              취소
            </Button>
            <Button type="submit" disabled={pending || !trimmed || unchanged}>
              {pending ? '저장 중...' : '저장'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
