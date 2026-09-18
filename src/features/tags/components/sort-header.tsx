import { ArrowDown, ArrowUp } from 'lucide-react';

interface SortHeaderProps {
  label: string;
  active: boolean;
  onToggle: () => void;
}

/** 표 헤더에 다는 정렬 토글 버튼. 화살표는 현재 방향을 보여주고 클릭하면
 * 뒤집힌다(기존 콘솔의 헤더 아이콘과 같은 동작). */
export function SortHeader({ label, active, onToggle }: SortHeaderProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="inline-flex items-center gap-1 hover:text-foreground"
    >
      {label}
      {active ? (
        <ArrowUp className="size-3.5" />
      ) : (
        <ArrowDown className="size-3.5" />
      )}
    </button>
  );
}
