import { ExposureGradeCard, ExposureWeightCard } from '@/features/exposure';
import { PageHeader } from '@/components/common/page-header';

export function ExposurePage() {
  return (
    <div className="space-y-5 px-5 py-6 sm:px-8 lg:px-10">
      <PageHeader
        title="노출 가중치 관리"
        description="게시물 노출 비율과 개인화 등급을 매체마다 정합니다."
      />
      <ExposureWeightCard />
      <ExposureGradeCard />
    </div>
  );
}
