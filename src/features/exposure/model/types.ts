/** 추천·일반 게시물의 노출 비율(%). 합은 100이다. */
export interface ExposureWeight {
  recommendWeight: number;
  normalWeight: number;
}

/** 개인화 설정. 가중치는 1~4등급 순서다. */
export interface ExposureGrade {
  referenceDay: number;
  term: number;
  weights: number[];
}

export interface ExposureWeightInput extends ExposureWeight {
  mediaId: number;
}

export interface ExposureGradeInput extends ExposureGrade {
  mediaId: number;
}
