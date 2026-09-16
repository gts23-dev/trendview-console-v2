import { useState } from 'react';
import { ExternalLink, ImageOff } from 'lucide-react';
import { cn } from '@/shared/utils/class-name';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import { getPlatformBadge, getPlatformLabel } from '../model/platforms';
import type { ArticleListItem } from '../model/types';
import { isYoutubeShorts } from '../model/video';
import { PlatformMark } from './platform-mark';

interface ArticleCardProps {
  article: ArticleListItem;
  selected: boolean;
  onSelect: (selected: boolean) => void;
  onOpen: () => void;
  /** 카드 오른쪽 아래 주 동작. 수집정보는 활성, 게시정보는 비활성이다. */
  action: React.ReactNode;
  /** 게시정보에서만 비즈니스 태그를 보여준다. 수집 단계에서는 대부분 비어 있다. */
  showBusinessTag?: boolean;
}

export function ArticleCard({
  article,
  selected,
  onSelect,
  onOpen,
  action,
  showBusinessTag = false,
}: ArticleCardProps) {
  // 스토리지에 아직 안 올라간 이미지는 404가 난다. 그때 플랫폼 원본으로 한 번
  // 더 시도하고, 그것도 실패하면 자리표시자를 보여준다.
  const [src, setSrc] = useState(article.imageUrl);
  const imageFailed = !src;
  function handleError() {
    setSrc(src !== article.originImageUrl ? article.originImageUrl : '');
  }
  const badge = getPlatformBadge(article.platform);
  // 쇼츠는 길이도 소비 방식도 달라 일반 영상과 같은 기준으로 보지 않는다.
  const badgeText =
    badge.mark === 'youtube' &&
    isYoutubeShorts(article.url, article.imageWidth, article.imageHeight)
      ? '쇼츠'
      : badge.text;
  return (
    <article
      className={cn(
        'flex flex-col overflow-hidden rounded-lg border bg-card transition-shadow',
        selected ? 'border-primary ring-1 ring-primary' : 'hover:shadow-sm',
      )}
    >
      {/* 세로형 쇼츠(268x480)와 가로형(320x180)이 섞여 있다. 어느 쪽도 심하게
          치우치지 않는 정사각 박스로 고정한다. 상세 시트와 같은 규칙이다. */}
      <div className="relative bg-muted">
        <button
          type="button"
          onClick={onOpen}
          className="block aspect-square w-full cursor-pointer"
          aria-label={`${article.title} 상세 보기`}
        >
          {!imageFailed ? (
            <img
              src={src}
              alt=""
              loading="lazy"
              className="size-full object-cover"
              onError={handleError}
            />
          ) : (
            <span className="flex size-full items-center justify-center text-muted-foreground">
              <ImageOff className="size-6" />
            </span>
          )}
        </button>
        {/* 썸네일 위라 밝기를 알 수 없다. 반투명 검정 바탕에 흰 테두리로 둔다. */}
        <Checkbox
          checked={selected}
          onCheckedChange={(value) => onSelect(value === true)}
          aria-label={`${article.title} 선택`}
          // before로 클릭 영역만 바깥으로 넓힌다. 보이는 크기는 그대로다.
          className="absolute top-2 left-2 size-6 cursor-pointer border-white/80 bg-black/40 shadow-sm backdrop-blur-sm before:absolute before:-inset-2 before:content-[''] [&_svg]:size-4"
        />
        {/* 어느 플랫폼의 콘텐츠인지는 활성 판단에 쓰는 정보라 썸네일 위에서
            바로 읽히게 둔다. 썸네일 밝기를 알 수 없어 바탕은 반투명 검정이다. */}
        <span
          className={cn(
            'absolute top-2 right-2 inline-flex items-center gap-1.5 rounded-md bg-black/65 py-1 text-xs font-medium text-white shadow-sm backdrop-blur-sm',
            // 마크가 없는 플랫폼은 글자만 남아 좌우 여백을 맞춰야 한다.
            badge.mark ? 'pr-2 pl-1' : 'px-2',
          )}
          title={getPlatformLabel(article.platform)}
        >
          <PlatformMark mark={badge.mark} className="size-5 shrink-0" />
          <span className="leading-none">{badgeText}</span>
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-2 p-3">
        <button
          type="button"
          onClick={onOpen}
          className="cursor-pointer text-left text-[13px] leading-5 font-medium"
        >
          {/* 제목 길이와 무관하게 두 줄을 확보해 카드 높이를 맞춘다. */}
          <span className="line-clamp-2 min-h-10">
            {article.title || '제목 없음'}
          </span>
        </button>
        <dl className="mt-auto space-y-0.5 text-[11px] text-muted-foreground">
          <div className="flex gap-1">
            <dt className="shrink-0">
              {article.type === 'channel' ? '채널' : '키워드'}
            </dt>
            <dd className="truncate">{article.source || '-'}</dd>
          </div>
          <div className="flex gap-1">
            <dt className="shrink-0">{article.primaryDateLabel}</dt>
            <dd>{article.primaryDate || '-'}</dd>
          </div>
          {showBusinessTag && (
            <div className="flex gap-1">
              <dt className="shrink-0">태그</dt>
              <dd className="truncate">{article.businessTag || '태그없음'}</dd>
            </div>
          )}
        </dl>
        <div className="flex items-center justify-between gap-2 border-t pt-2">
          {article.url ? (
            <a
              href={article.url}
              target="_blank"
              rel="noreferrer noopener"
              className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground"
            >
              원문
              <ExternalLink className="size-3" />
            </a>
          ) : (
            <span />
          )}
          {action}
        </div>
      </div>
    </article>
  );
}

/**
 * 카드와 같은 골격이다. 테두리와 여백은 실제 카드처럼 고정해 두고 내용이 들어갈
 * 자리만 깜빡인다. 카드 한 장을 큰 덩어리 하나로 칠하면 화면 전체가 번쩍인다.
 * 카드 구조가 바뀌면 여기도 같이 고친다.
 */
export function ArticleCardSkeleton() {
  return (
    <div className="flex flex-col overflow-hidden rounded-lg border bg-card">
      <Skeleton className="aspect-square rounded-none" />
      <div className="flex flex-1 flex-col gap-2 p-3">
        <div className="space-y-1.5">
          <Skeleton className="h-3.5 w-full" />
          <Skeleton className="h-3.5 w-3/5" />
        </div>
        <div className="mt-auto space-y-1">
          <Skeleton className="h-2.5 w-2/3" />
          <Skeleton className="h-2.5 w-1/2" />
        </div>
        <div className="flex items-center justify-between border-t pt-2">
          <Skeleton className="h-2.5 w-8" />
          <Skeleton className="h-7 w-12 rounded-md" />
        </div>
      </div>
    </div>
  );
}
