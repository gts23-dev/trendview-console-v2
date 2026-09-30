import { z } from 'zod';
import { request } from '@/shared/api/client';
import { ApiError, AppError } from '@/shared/errors/app-error';
import { mediaHeaders } from '@/features/medias';
import { GRADES } from '../model/grades';
import type {
  ExposureGrade,
  ExposureGradeInput,
  ExposureWeight,
  ExposureWeightInput,
} from '../model/types';

const weightSchema = z.object({
  // 설정이 없는 매체는 객체 대신 빈 배열이 온다.
  data: z.union([
    z.object({ recommend_weight: z.number(), normal_weight: z.number() }),
    z.array(z.unknown()),
  ]),
});

const gradeSchema = z.object({
  data: z.object({
    reference_day: z.number(),
    term: z.number(),
    config: z.array(z.object({ grade: z.number(), weight: z.number() })),
  }),
});

function invalidResponse() {
  return new AppError(
    '노출 가중치 응답을 확인하지 못했습니다.',
    'INVALID_RESPONSE',
  );
}

/** 설정이 없으면 기존 콘솔처럼 50:50으로 시작한다. */
export async function getExposureWeight(
  mediaId: number,
  signal?: AbortSignal,
): Promise<ExposureWeight> {
  const data = await request<unknown>(`api/v1/exposure/${mediaId}`, {
    headers: await mediaHeaders(mediaId, 'c9'),
    signal,
  });
  const parsed = weightSchema.safeParse(data);
  if (!parsed.success) throw invalidResponse();
  const weight = parsed.data.data;
  if (Array.isArray(weight)) return { recommendWeight: 50, normalWeight: 50 };
  return {
    recommendWeight: weight.recommend_weight,
    normalWeight: weight.normal_weight,
  };
}

/**
 * 설정이 없는 매체는 404가 온다. 실패가 아니라 아직 저장하지 않은 상태이므로
 * null로 돌려준다. 기존 콘솔은 c9 헤더 없이 부른다.
 */
export async function getExposureGrade(
  mediaId: number,
  signal?: AbortSignal,
): Promise<ExposureGrade | null> {
  let data: unknown;
  try {
    data = await request<unknown>(`api/v1/exposure/grade/${mediaId}`, {
      signal,
    });
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
  const parsed = gradeSchema.safeParse(data);
  if (!parsed.success) throw invalidResponse();
  const { reference_day, term, config } = parsed.data.data;
  return {
    referenceDay: reference_day,
    term,
    // 배열 순서가 아니라 등급 번호로 찾는다. 없는 등급은 0이다.
    weights: GRADES.map(
      (grade) => config.find((item) => item.grade === grade)?.weight ?? 0,
    ),
  };
}

export async function saveExposureWeight({
  mediaId,
  recommendWeight,
  normalWeight,
}: ExposureWeightInput) {
  await request('api/v1/exposure', {
    method: 'POST',
    body: JSON.stringify({
      media_id: mediaId,
      recommend_weight: recommendWeight,
      normal_weight: normalWeight,
    }),
  });
}

export async function saveExposureGrade({
  mediaId,
  referenceDay,
  term,
  weights,
}: ExposureGradeInput) {
  await request(`api/v1/exposure/grade/${mediaId}`, {
    method: 'PUT',
    body: JSON.stringify({
      reference_day: referenceDay,
      term,
      config: weights.map((weight, index) => ({
        grade: GRADES[index],
        weight,
      })),
    }),
  });
}
