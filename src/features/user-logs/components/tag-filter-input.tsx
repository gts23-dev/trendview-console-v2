import { useState } from 'react';
import { X } from 'lucide-react';
import { Badge, BadgeButton } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';

interface TagFilterInputProps {
  tags: string[];
  onChange: (tags: string[]) => void;
}

/**
 * 태그는 'OR(또는)' 검색이라 여러 개를 담을 수 있다(기존 콘솔의
 * v-combobox multiple을 대체). Enter로 추가하고 배지의 x로 뺀다.
 */
export function TagFilterInput({ tags, onChange }: TagFilterInputProps) {
  const [draft, setDraft] = useState('');

  function add() {
    const value = draft.trim();
    if (value && !tags.includes(value)) onChange([...tags, value]);
    setDraft('');
  }

  return (
    <div className="flex min-h-8.5 flex-wrap items-center gap-1.5 rounded-md border border-input px-2 py-1">
      {tags.map((tag) => (
        <Badge key={tag} variant="secondary" appearance="outline">
          {tag}
          <BadgeButton onClick={() => onChange(tags.filter((t) => t !== tag))}>
            <X />
          </BadgeButton>
        </Badge>
      ))}
      <Input
        variant="sm"
        className="min-w-[100px] flex-1 border-0 shadow-none focus-visible:ring-0"
        placeholder={tags.length === 0 ? '태그 (OR 검색, Enter로 추가)' : ''}
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onKeyDown={(event) => {
          if (event.key !== 'Enter') return;
          event.preventDefault();
          add();
        }}
      />
    </div>
  );
}
