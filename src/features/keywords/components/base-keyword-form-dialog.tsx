import { useEffect, useMemo } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { cn } from '@/shared/utils/class-name';
import { getPlatformLabel } from '@/features/articles';
import { useMediaTopics } from '@/features/medias';
import { useActivePlatforms } from '@/features/platforms';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { splitKeywords } from '../model/filters';
import type { BaseKeyword } from '../model/types';

const NO_TOPIC = '__none__';

const schema = z.object({
  topic: z.string(),
  keyword: z.string().trim().min(1, '키워드를 입력해 주세요.'),
  platforms: z.array(z.string()).min(1, '플랫폼을 하나 이상 선택해 주세요.'),
});

export type BaseKeywordFormValues = z.infer<typeof schema>;

interface BaseKeywordFormDialogProps {
  open: boolean;
  /** 수정 대상. 없으면 등록이다. */
  keyword: BaseKeyword | null;
  mediaId: number | null;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: BaseKeywordFormValues) => void;
  pending: boolean;
}

export function BaseKeywordFormDialog({
  open,
  keyword,
  mediaId,
  onOpenChange,
  onSubmit,
  pending,
}: BaseKeywordFormDialogProps) {
  const topics = useMediaTopics(open ? mediaId : null);
  const platforms = useActivePlatforms();
  const form = useForm<BaseKeywordFormValues>({
    resolver: zodResolver(schema),
    defaultValues: { topic: '', keyword: '', platforms: [] },
  });

  // 다이얼로그는 등록과 수정이 공유한다. 열 때마다 대상 값으로 되돌린다.
  useEffect(() => {
    if (!open) return;
    form.reset({
      topic: keyword?.topic ?? '',
      keyword: keyword?.keyword ?? '',
      platforms: keyword?.platforms ?? [],
    });
  }, [open, keyword, form]);

  // 카테고리 이름이 바뀌면 행의 topic이 매체 카테고리 목록에 없을 수 있다.
  // 선택지에 없는 값은 Select가 빈칸으로 보여 설정이 풀린 것처럼 읽힌다.
  const topicOptions = useMemo(() => {
    const list = topics.data ?? [];
    const current = keyword?.topic;
    return current && !list.includes(current) ? [current, ...list] : list;
  }, [topics.data, keyword]);

  const count = splitKeywords(form.watch('keyword')).length;

  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        if (!pending) onOpenChange(value);
      }}
    >
      <DialogContent className="sm:max-w-xl">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <DialogHeader>
              <DialogTitle>
                {keyword ? '키워드(PK) 수정' : '키워드(PK) 등록'}
              </DialogTitle>
              <DialogDescription>
                등록한 키워드로 플랫폼에서 콘텐츠를 수집합니다.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-5 py-4">
              <FormField
                control={form.control}
                name="topic"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>카테고리</FormLabel>
                    <Select
                      value={field.value || NO_TOPIC}
                      onValueChange={(value) =>
                        field.onChange(value === NO_TOPIC ? '' : value)
                      }
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="선택 안 함" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value={NO_TOPIC}>선택 안 함</SelectItem>
                        {topicOptions.map((topic) => (
                          <SelectItem key={topic} value={topic}>
                            {topic}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="keyword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      키워드(PK)
                      {!keyword && count > 1 && (
                        <span className="ms-1 text-xs font-normal text-muted-foreground">
                          {count}개
                        </span>
                      )}
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        rows={3}
                        placeholder={
                          keyword
                            ? '키워드'
                            : '여러 개일 경우 쉼표로 구분합니다. 예: 골프, 스크린골프'
                        }
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="platforms"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>플랫폼</FormLabel>
                    <div className="flex flex-wrap gap-1.5">
                      {(platforms.data ?? []).map((platform) => {
                        const selected = field.value.includes(platform.name);
                        return (
                          <Button
                            key={platform.name}
                            type="button"
                            size="sm"
                            variant={selected ? 'primary' : 'outline'}
                            aria-pressed={selected}
                            className={cn(!selected && 'text-muted-foreground')}
                            onClick={() =>
                              field.onChange(
                                selected
                                  ? field.value.filter(
                                      (name) => name !== platform.name,
                                    )
                                  : [...field.value, platform.name],
                              )
                            }
                          >
                            {platform.label || getPlatformLabel(platform.name)}
                          </Button>
                        );
                      })}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
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
              <Button type="submit" disabled={pending}>
                {pending ? '저장 중...' : '저장'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
