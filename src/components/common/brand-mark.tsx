import { cn } from '@/shared/utils/class-name';

interface BrandMarkProps {
  className?: string;
}

/**
 * 트렌드뷰 심볼. 링은 브랜드 색으로 고정하고 꺾은선은 글자색을 따른다.
 * 어두운 바탕에서는 `text-white`를 줘서 선이 바탕에 묻히지 않게 한다.
 * `public/favicon.svg`와 같은 도형이므로 모양을 바꾸면 둘 다 고친다.
 */
export function BrandMark({ className }: BrandMarkProps) {
  return (
    <svg
      viewBox="0 0 30 30"
      aria-hidden
      className={cn('shrink-0 text-[#1550B2]', className)}
    >
      <path
        fill="#31A0FF"
        d="M26.2 5.02A15 15 0 1 0 26.2 24.98V22.2H22.98A10.75 10.75 0 1 1 22.98 7.8H26.2Z"
      />
      <rect
        fill="#31A0FF"
        x="22.1"
        y="22.2"
        width="4.1"
        height="7.8"
        rx="1.95"
      />
      <path
        d="M7.9 14.45 14.95 18.25 21.25 11.8 26.95 16.3"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <g fill="currentColor">
        <circle cx="7.9" cy="14.45" r="2.2" />
        <circle cx="14.95" cy="18.25" r="3.5" />
        <circle cx="21.25" cy="11.8" r="2.65" />
        <circle cx="26.95" cy="16.3" r="1.65" />
      </g>
    </svg>
  );
}
