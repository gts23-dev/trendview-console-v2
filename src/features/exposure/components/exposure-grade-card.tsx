import { zodResolver } from '@hookform/resolvers/zod';
import { Info } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { cn } from '@/shared/utils/class-name';
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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Slider, SliderThumb } from '@/components/ui/slider';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ErrorState } from '@/components/common/empty-state';
import { useExposureGrade, useSaveExposureGrade } from '../hooks/use-exposure';
import {
  gradeReferenceRanges,
  GRADES,
  toGradeCuts,
  toGradeWeights,
} from '../model/grades';
import type { ExposureGrade } from '../model/types';

const days = z.string().regex(/^\d+$/, '0 이상의 정수를 입력해 주세요.');

const schema = z.object({
  cuts: z.array(z.number()),
  referenceDay: days,
  term: days,
});

type GradeFormValues = z.infer<typeof schema>;

const DAY_FIELDS = [
  { name: 'referenceDay', label: '기준일' },
  { name: 'term', label: '주기' },
] as const;

// 등급마다 다른 색을 쓴다. 게시물 가중치의 파랑·보라와 겹치면 두 값이
// 이어진 것처럼 보여 다른 계열로 고른다.
const GRADE_COLORS = [
  { bar: 'bg-exposure-grade-1/30', dot: 'bg-exposure-grade-1' },
  { bar: 'bg-exposure-grade-2/30', dot: 'bg-exposure-grade-2' },
  { bar: 'bg-exposure-grade-3/30', dot: 'bg-exposure-grade-3' },
  { bar: 'bg-exposure-grade-4/30', dot: 'bg-exposure-grade-4' },
];

export function ExposureGradeCard() {
  const { mediaId } = useMediaScope();
  const grade = useExposureGrade(mediaId);

  return (
    <Card>
      <CardHeader>
        <CardHeading>
          <CardTitle>개인화</CardTitle>
          <CardDescription>
            등급별 할당율과 등급을 나누는 기간입니다.
          </CardDescription>
        </CardHeading>
      </CardHeader>
      {/* 다시 받기가 실패해도 받아 둔 값이 있으면 폼을 그대로 둔다. 설정이
          없으면 data가 null이라 undefined와 구분된다. */}
      {grade.data !== undefined && mediaId !== null ? (
        // 매체가 바뀌면 그 매체 값으로 새로 시작한다.
        <GradeForm key={mediaId} mediaId={mediaId} grade={grade.data} />
      ) : grade.isError ? (
        <ErrorState retry={() => grade.refetch()} />
      ) : (
        <CardContent className="space-y-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-40 w-full" />
        </CardContent>
      )}
    </Card>
  );
}

interface GradeFormProps {
  mediaId: number;
  /** 서버에 설정이 없으면 null이다. */
  grade: ExposureGrade | null;
}

function GradeForm({ mediaId, grade }: GradeFormProps) {
  const save = useSaveExposureGrade();
  const form = useForm<GradeFormValues>({
    resolver: zodResolver(schema),
    // 서버 값이 바뀌면(저장 후 다시 받은 값 포함) 폼을 그 값으로 맞춘다.
    // 설정이 없으면 경계가 모두 0이라 4등급이 100을 가진다.
    values: {
      cuts: toGradeCuts(grade?.weights ?? []),
      referenceDay: String(grade?.referenceDay ?? 0),
      term: String(grade?.term ?? 0),
    },
  });

  const cuts = form.watch('cuts');
  const weights = toGradeWeights(cuts);
  const referenceDay = days.safeParse(form.watch('referenceDay'));
  const term = days.safeParse(form.watch('term'));
  const ranges =
    referenceDay.success && term.success
      ? gradeReferenceRanges(Number(referenceDay.data), Number(term.data))
      : null;

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit((values) =>
          save.mutate(
            {
              mediaId,
              referenceDay: Number(values.referenceDay),
              term: Number(values.term),
              weights: toGradeWeights(values.cuts),
            },
            { onSuccess: () => toast.success('저장했습니다.') },
          ),
        )}
      >
        <CardContent className="space-y-6">
          {!grade && (
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <Info className="size-4" />
              저장된 등급 설정이 없습니다.
            </p>
          )}

          <div className="space-y-4">
            <p className="text-sm font-medium">등급별 할당율</p>
            {/* 손잡이는 등급 사이 경계다. 앞 등급이 끝나는 곳에서 다음 등급이
                시작하므로 합이 항상 100이다. */}
            <Slider
              value={cuts}
              onValueChange={(value) =>
                form.setValue('cuts', value, { shouldDirty: true })
              }
              max={100}
              step={1}
              disabled={save.isPending}
              className="h-9"
            >
              {/* 킷 슬라이더는 구간을 한 색으로만 칠해 네 등급 색을 위에
                  덮는다. 바탕을 불투명하게 해 아래 색이 비치지 않게 한다.
                  칸이 좁으면 등급 이름, 더 좁으면 %까지 뺀다. 같은 값도 화면
                  폭에 따라 칸 폭이 달라 값이 아닌 칸 폭으로 정한다. */}
              <div
                aria-hidden
                className="pointer-events-none absolute inset-x-0 top-1/2 flex h-7 -translate-y-1/2 overflow-hidden rounded-lg bg-card text-xs font-medium whitespace-nowrap tabular-nums"
              >
                {weights.map((weight, index) => (
                  <div
                    key={GRADES[index]}
                    className={cn(
                      '@container flex items-center justify-center gap-1',
                      GRADE_COLORS[index].bar,
                    )}
                    style={{ width: `${weight}%` }}
                  >
                    <span className="hidden @min-[4.5rem]:inline">
                      {GRADES[index]}등급
                    </span>
                    <span className="hidden @min-[2.25rem]:inline">
                      {weight}%
                    </span>
                  </div>
                ))}
              </div>
              {cuts.map((_, index) => (
                <SliderThumb
                  key={GRADES[index]}
                  aria-label={`${GRADES[index]}등급과 ${GRADES[index + 1]}등급 경계`}
                  aria-valuetext={`${GRADES[index]}등급 ${weights[index]}%, ${GRADES[index + 1]}등급 ${weights[index + 1]}%`}
                  className="box-border h-9 w-2 rounded-full border-[1.5px] border-foreground/30"
                />
              ))}
            </Slider>
          </div>

          <div className="flex flex-wrap gap-6">
            {DAY_FIELDS.map(({ name, label }) => (
              <FormField
                key={name}
                control={form.control}
                name={name}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{label}</FormLabel>
                    {/* InputGroup은 쓰지 않는다. FormControl이 입력칸의
                        data-slot을 바꿔 붙임표 모서리 규칙이 걸리지 않는다. */}
                    <div className="flex items-center gap-2 text-sm">
                      <FormControl>
                        <Input
                          className="w-24"
                          inputMode="numeric"
                          autoComplete="off"
                          {...field}
                          disabled={save.isPending}
                        />
                      </FormControl>
                      일
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ))}
          </div>

          {/* 입력 중 기간 칸이 '-'로 바뀌어도 열 폭이 흔들리지 않게 고정한다. */}
          <Table className="table-fixed">
            <TableHeader>
              <TableRow>
                <TableHead className="w-24">등급</TableHead>
                <TableHead className="w-20 text-center">할당율</TableHead>
                <TableHead className="text-center">기간</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {GRADES.map((level, index) => (
                <TableRow key={level}>
                  <TableCell>
                    <span className="flex items-center gap-2">
                      <span
                        className={cn(
                          'size-2.5 rounded-full',
                          GRADE_COLORS[index].dot,
                        )}
                      />
                      {level}등급
                    </span>
                  </TableCell>
                  <TableCell className="text-center tabular-nums">
                    {weights[index]}%
                  </TableCell>
                  <TableCell className="text-center tabular-nums">
                    {ranges
                      ? `${ranges[index].from}~${ranges[index].to}일 전`
                      : '-'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
        <CardFooter className="justify-end">
          <Button
            type="submit"
            disabled={save.isPending || !form.formState.isDirty}
          >
            {save.isPending ? '저장 중...' : '저장'}
          </Button>
        </CardFooter>
      </form>
    </Form>
  );
}
