import { useState } from 'react';
import { toast } from 'sonner';
import { useMediaScope } from '@/features/medias';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardHeading,
  CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Slider, SliderThumb } from '@/components/ui/slider';
import { ErrorState } from '@/components/common/empty-state';
import {
  useExposureWeight,
  useSaveExposureWeight,
} from '../hooks/use-exposure';

export function ExposureWeightCard() {
  const { mediaId } = useMediaScope();
  const weight = useExposureWeight(mediaId);

  return (
    <Card>
      <CardHeader>
        <CardHeading>
          <CardTitle>게시물 가중치</CardTitle>
          <CardDescription>
            추천 게시물과 일반 게시물을 노출하는 비율입니다.
          </CardDescription>
        </CardHeading>
      </CardHeader>
      {/* 다시 받기가 실패해도 받아 둔 값이 있으면 폼을 그대로 둔다. isSuccess로
          가르면 편집 중인 폼이 오류 화면으로 바뀐다. */}
      {weight.data !== undefined && mediaId !== null ? (
        // 매체가 바뀌면 그 매체 값으로 새로 시작한다.
        <WeightForm
          key={mediaId}
          mediaId={mediaId}
          saved={weight.data.recommendWeight}
        />
      ) : weight.isError ? (
        <ErrorState retry={() => weight.refetch()} />
      ) : (
        <CardContent className="space-y-4">
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-4 w-full" />
        </CardContent>
      )}
    </Card>
  );
}

/** 좁은 쪽은 이름을 빼고 숫자만, 0%는 비운다. 칸에 글자가 넘치지 않게 한다. */
function splitLabel(name: string, value: number) {
  if (value === 0) return null;
  return value < 20 ? `${value}%` : `${name} ${value}%`;
}

interface WeightFormProps {
  mediaId: number;
  /** 서버에 저장된 추천 비율. 일반은 나머지다. */
  saved: number;
}

function WeightForm({ mediaId, saved }: WeightFormProps) {
  const save = useSaveExposureWeight();
  // 손대지 않은 동안과 저장이 끝난 뒤에는 서버 값을 그대로 보여 준다.
  const [draft, setDraft] = useState<number | null>(null);
  const recommend = draft ?? saved;

  return (
    <>
      <CardContent>
        {/* 합이 100이라 값 하나로 둘을 정한다. 킷 슬라이더는 채운 양처럼 보여
            한쪽만 켜는 조작으로 읽히므로, 전체를 둘로 가르는 막대를 위에 덮고
            손잡이는 경계선 모양으로 둔다. */}
        <Slider
          value={[recommend]}
          onValueChange={([value]) => setDraft(value)}
          max={100}
          step={10}
          disabled={save.isPending}
          className="h-9"
        >
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-1/2 flex h-7 -translate-y-1/2 overflow-hidden rounded-lg bg-card text-xs font-medium whitespace-nowrap tabular-nums"
          >
            <div
              className="flex items-center justify-center bg-primary/30"
              style={{ width: `${recommend}%` }}
            >
              {splitLabel('추천', recommend)}
            </div>
            <div className="flex flex-1 items-center justify-center bg-chart-3/30">
              {splitLabel('일반', 100 - recommend)}
            </div>
          </div>
          <SliderThumb
            aria-label="추천 비율"
            aria-valuetext={`추천 ${recommend}%, 일반 ${100 - recommend}%`}
            className="box-border h-9 w-2 rounded-full border-[1.5px] border-foreground/30"
          />
        </Slider>
      </CardContent>
      <CardFooter className="justify-end">
        <Button
          disabled={save.isPending || recommend === saved}
          onClick={() =>
            save.mutate(
              {
                mediaId,
                recommendWeight: recommend,
                normalWeight: 100 - recommend,
              },
              {
                onSuccess: () => {
                  setDraft(null);
                  toast.success('저장했습니다.');
                },
              },
            )
          }
        >
          {save.isPending ? '저장 중...' : '저장'}
        </Button>
      </CardFooter>
    </>
  );
}
