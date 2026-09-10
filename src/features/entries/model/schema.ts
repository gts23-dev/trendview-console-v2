import { z } from 'zod';
import type { EntryInput } from './types';

export const entryInputSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, '제목을 입력해 주세요.')
    .max(100, '100자 이내로 입력해 주세요.'),
  category: z.enum(['공지', '가이드', '업데이트']),
  status: z.enum(['published', 'draft', 'archived']),
  description: z.string().max(3000, '3,000자 이내로 입력해 주세요.'),
}) satisfies z.ZodType<EntryInput>;
