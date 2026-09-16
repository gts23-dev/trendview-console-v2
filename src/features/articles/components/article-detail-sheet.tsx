import { useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, ExternalLink, Trash2 } from 'lucide-react';
import { cn } from '@/shared/utils/class-name';
import { formatCount } from '@/shared/utils/format';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from '@/components/ui/sheet';
import { useArticleReports } from '../hooks/use-article-reports';
import { getPlatformBadge, getPlatformLabel } from '../model/platforms';
import type { ArticleListItem, ArticleMedia } from '../model/types';
import {
  getYoutubeEmbedUrl,
  getYoutubeId,
  isYoutubeShorts,
} from '../model/video';
import { PlatformMark } from './platform-mark';

interface ArticleDetailSheetProps {
  mediaId: number | null;
  /** 목록에서 고른 콘텐츠. null이면 시트를 닫는다. */
  article: ArticleListItem | null;
  /** 주 동작 이름. 수집정보는 활성, 게시정보는 비활성이다. */
  actionLabel: string;
  /** 판단한 자리에서 바로 실행할 수 있게 목록의 확인 절차를 받아 쓴다. */
  onAction: (id: number) => void;
  onDelete: (id: number) => void;
  onClose: () => void;
}

/**
 * 인스타그램처럼 여러 장인 경우가 있다. 한 장씩 가로폭을 꽉 채우고 옆으로
 * 넘긴다. 세로형이 섞여 있어 박스는 정사각으로 두고 전체를 보여준다.
 * 콘텐츠가 바뀌면 key로 다시 마운트되어 현재 장이 첫 장으로 돌아간다.
 */
function ImageSlider({ images }: { images: ArticleMedia[] }) {
  const [index, setIndex] = useState(0);
  const track = useRef<HTMLDivElement>(null);
  const current = images[index] ?? images[0];
  function go(slide: number) {
    const el = track.current;
    if (!el) return;
    el.scrollTo({ left: slide * el.clientWidth, behavior: 'smooth' });
  }
  return (
    <section className="space-y-2">
      <div className="group relative">
        <div
          ref={track}
          // 슬라이드가 정확히 한 폭이라 스크롤 위치를 폭으로 나누면 현재 장이다.
          onScroll={(event) =>
            setIndex(
              Math.round(
                event.currentTarget.scrollLeft /
                  event.currentTarget.clientWidth,
              ),
            )
          }
          className="flex snap-x snap-mandatory overflow-x-auto rounded-md border bg-muted"
        >
          {images.map((media) => (
            <img
              key={media.id}
              src={media.imageUrl}
              alt=""
              loading="lazy"
              className="aspect-square w-full shrink-0 snap-center object-contain"
            />
          ))}
        </div>
        {images.length > 1 && (
          <>
            {/* 마우스 사용자는 스와이프를 못 한다. 화살표로 넘긴다. */}
            <button
              type="button"
              aria-label="이전 이미지"
              disabled={index === 0}
              onClick={() => go(index - 1)}
              className="absolute top-1/2 left-2 grid size-8 -translate-y-1/2 cursor-pointer place-items-center rounded-full bg-black/55 text-white opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100 disabled:pointer-events-none disabled:opacity-0"
            >
              <ChevronLeft className="size-4" />
            </button>
            <button
              type="button"
              aria-label="다음 이미지"
              disabled={index === images.length - 1}
              onClick={() => go(index + 1)}
              className="absolute top-1/2 right-2 grid size-8 -translate-y-1/2 cursor-pointer place-items-center rounded-full bg-black/55 text-white opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100 disabled:pointer-events-none disabled:opacity-0"
            >
              <ChevronRight className="size-4" />
            </button>
          </>
        )}
      </div>
      <div className="flex items-center justify-between gap-2">
        {/* 기존 콘솔은 타입·크기를 표의 칸으로 보여줬다. */}
        <span className="text-[11px] text-muted-foreground">
          {current.type || '-'} · {current.width}×{current.height}
        </span>
        {images.length > 1 && (
          <div className="flex items-center gap-1.5">
            {images.map((media, slide) => (
              <button
                key={media.id}
                type="button"
                aria-label={`${slide + 1}번째 이미지 보기`}
                aria-current={slide === index}
                onClick={() => go(slide)}
                className={cn(
                  'size-1.5 cursor-pointer rounded-full transition-colors',
                  slide === index ? 'bg-foreground' : 'bg-muted-foreground/30',
                )}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

/**
 * 콘텐츠는 DB 레코드가 아니라 기사·영상이다. 출처와 제목을 먼저 두고 본문은
 * 라벨 없는 글로 읽히게 한다. 수집 메타는 아래로 내린다.
 *
 * 본문이 길어질 수 있어 신고내역을 그 위에 둔다. 이 화면에서 하는 판단은
 * 활성·삭제이고, 신고가 있다는 사실이 본문보다 먼저 보여야 한다.
 *
 * 목록 응답이 본문·첨부·메타를 모두 담고 있어 상세를 따로 조회하지 않는다.
 */
export function ArticleDetailSheet({
  mediaId,
  article,
  actionLabel,
  onAction,
  onDelete,
  onClose,
}: ArticleDetailSheetProps) {
  const reports = useArticleReports(mediaId, article?.id ?? null);
  const badge = getPlatformBadge(article?.platform ?? '');
  const images = (article?.medias ?? []).filter((media) => media.imageUrl);
  // 유튜브는 첨부가 썸네일뿐이라 재생기로 바꾼다. 제목만으로 판단하기 어려운
  // 영상을 시트 안에서 바로 확인할 수 있다.
  const youtubeId =
    article?.platform === 'youtube' ? getYoutubeId(article.url) : '';
  const shorts =
    !!article &&
    isYoutubeShorts(article.url, article.imageWidth, article.imageHeight);
  // 색과 테두리로 나누면 무엇이 다른지는 알려주지 못한다. 이름을 붙이면
  // 구분이 명확해지고 배지 모양은 하나로 통일할 수 있다.
  const tagGroups = [
    {
      label: '키워드(PK)',
      tags: article?.businessTag ? [article.businessTag] : [],
    },
    { label: '해시태그', tags: article?.hashtags ?? [] },
  ].filter((group) => group.tags.length > 0);
  return (
    <Sheet open={article !== null} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="flex w-full flex-col gap-0 p-0 sm:max-w-xl">
        <SheetDescription className="sr-only">
          선택한 콘텐츠의 본문과 수집 정보
        </SheetDescription>
        {article && (
          <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-5 py-5">
            <div className="space-y-2">
              <div className="flex items-center gap-2 pe-12 text-xs text-muted-foreground">
                <PlatformMark mark={badge.mark} className="size-4 shrink-0" />
                <span>{getPlatformLabel(article.platform)}</span>
                {article.source && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span className="truncate">{article.source}</span>
                  </>
                )}
                <span aria-hidden="true">·</span>
                <span className="shrink-0">{article.writtenDate || '-'}</span>
              </div>
              <SheetTitle className="text-left text-lg leading-snug font-semibold">
                {article.title || '제목 없음'}
              </SheetTitle>
            </div>

            {youtubeId ? (
              <iframe
                key={youtubeId}
                src={getYoutubeEmbedUrl(youtubeId)}
                title={article.title || '유튜브 영상'}
                loading="lazy"
                allow="accelerometer; clipboard-write; encrypted-media; picture-in-picture"
                allowFullScreen
                className={cn(
                  'rounded-md border bg-black',
                  // 쇼츠는 세로다. 폭을 꽉 채우면 시트가 900px 넘게 길어지므로
                  // 높이를 고정하고 폭을 비율로 맞춘다.
                  shorts
                    ? 'mx-auto aspect-[9/16] h-[34rem]'
                    : 'aspect-video w-full',
                )}
              />
            ) : (
              images.length > 0 && (
                <ImageSlider key={article.id} images={images} />
              )
            )}

            {reports.data && reports.data.length > 0 && (
              <section className="space-y-2 rounded-md border border-destructive/30 bg-destructive/5 p-3">
                <h3 className="text-xs font-medium text-destructive">
                  신고 {reports.data.length}건
                </h3>
                <ul className="space-y-2 text-sm">
                  {reports.data.map((report) => (
                    <li key={report.id} className="space-y-0.5">
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="font-medium">{report.type}</span>
                        <span className="text-xs text-muted-foreground">
                          {report.date}
                        </span>
                      </div>
                      {report.description && (
                        <p className="whitespace-pre-wrap">
                          {report.description}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        {report.userName} ({report.userId})
                      </p>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* 본문 길이를 알 수 없어 아래에 두면 늦게 보인다. 판단에 쓰는
                값은 모두 본문 위에 모은다. 구분선 대신 옅은 바탕으로 묶어
                표처럼 보이지 않게 한다. */}
            <dl className="flex flex-wrap gap-x-6 gap-y-2 rounded-md bg-muted/60 px-3 py-2.5 text-xs">
              {[
                { label: '주제', value: article.topic },
                { label: '수집', value: article.collectedDate },
                { label: '게시', value: article.postedDate },
                { label: '조회', value: formatCount(article.viewCount) },
              ].map((meta) => (
                <div key={meta.label} className="flex items-baseline gap-1.5">
                  <dt className="text-muted-foreground">{meta.label}</dt>
                  <dd className="font-medium">{meta.value || '-'}</dd>
                </div>
              ))}
            </dl>
            {tagGroups.map((group) => (
              <div
                key={group.label}
                className="flex flex-wrap items-baseline gap-x-2 gap-y-1 text-xs"
              >
                <span className="text-muted-foreground">{group.label}</span>
                {group.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-accent px-2 py-0.5 font-medium"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            ))}

            {article.contents && (
              <p className="text-sm leading-6 whitespace-pre-wrap text-foreground/90">
                {article.contents}
              </p>
            )}
          </div>
        )}
        {article && (
          <div className="flex items-center justify-between gap-3 border-t px-5 py-3">
            {article.url ? (
              <a
                href={article.url}
                target="_blank"
                rel="noreferrer noopener"
                className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
              >
                원문 열기
                <ExternalLink className="size-3.5" />
              </a>
            ) : (
              <span />
            )}
            {/* 내용을 보고 판단한 자리에서 바로 실행한다. 시트를 닫고 카드를
                다시 찾아 누르게 하면 판단과 실행이 끊긴다. */}
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => onDelete(article.id)}
              >
                <Trash2 className="size-4" />
                삭제
              </Button>
              <Button size="sm" onClick={() => onAction(article.id)}>
                {actionLabel}
              </Button>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
