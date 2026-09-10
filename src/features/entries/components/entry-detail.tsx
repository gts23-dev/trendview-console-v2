import { FileText, Pencil } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { DetailSheet } from '@/components/common/detail-sheet';
import type { Entry } from '../model/types';
import { EntryStatusBadge } from './entry-status-badge';

interface EntryDetailProps {
  entry?: Entry;
  editable: boolean;
  onClose: () => void;
  returnTo: string;
  onCloseFocus: () => void;
}

export function EntryDetail({
  entry,
  editable,
  onClose,
  returnTo,
  onCloseFocus,
}: EntryDetailProps) {
  return (
    <DetailSheet
      open={!!entry}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      title="콘텐츠 상세"
      description={entry?.id ?? '콘텐츠 정보'}
      onCloseFocus={onCloseFocus}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            닫기
          </Button>
          {entry && editable && (
            <Button asChild>
              <Link to={`/entries/${entry.id}/edit`} state={{ returnTo }}>
                <Pencil />
                수정하기
              </Link>
            </Button>
          )}
        </>
      }
    >
      {entry && (
        <div className="space-y-7">
          <div>
            <span className="mb-5 inline-flex rounded-lg border bg-muted p-3">
              <FileText className="size-6 text-primary" />
            </span>
            <h2 className="text-2xl leading-snug font-semibold">
              {entry.title}
            </h2>
            <div className="mt-4">
              <EntryStatusBadge status={entry.status} />
            </div>
          </div>
          <dl className="grid grid-cols-[100px_1fr] gap-x-4 gap-y-4 rounded-lg bg-muted/60 p-5 text-sm">
            <dt className="text-muted-foreground">카테고리</dt>
            <dd>{entry.category}</dd>
            <dt className="text-muted-foreground">작성자</dt>
            <dd>{entry.author}</dd>
            <dt className="text-muted-foreground">수정일</dt>
            <dd>{new Date(entry.updatedAt).toLocaleString('ko-KR')}</dd>
          </dl>
          <section>
            <h3 className="mb-3 font-semibold">내용</h3>
            <p className="text-sm leading-7 whitespace-pre-wrap text-muted-foreground">
              {entry.description || '입력된 내용이 없습니다.'}
            </p>
          </section>
        </div>
      )}
    </DetailSheet>
  );
}
