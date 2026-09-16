import { useState } from 'react';
import { DatabaseBackup } from 'lucide-react';
import { toast } from 'sonner';
import { useMediaScope } from '@/features/medias';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/common/confirm-dialog';

/**
 * 선택한 매체의 등록 키워드로 즉시 수집을 돌린다. 평소에는 예약 작업이 돌고,
 * 이 버튼은 키워드를 새로 넣었을 때처럼 기다리지 않고 채우고 싶을 때 쓴다.
 * 기존 콘솔에서는 주석 처리된 상태였다.
 */
export function ScrapButton() {
  const { mediaId } = useMediaScope();
  const [confirming, setConfirming] = useState(false);
  return (
    <>
      <Button
        variant="outline"
        size="sm"
        disabled={mediaId === null}
        onClick={() => setConfirming(true)}
      >
        <DatabaseBackup className="size-4" />
        수집 실행
      </Button>
      <ConfirmDialog
        open={confirming}
        title="지금 수집을 실행하시겠습니까?"
        description="선택한 매체의 등록 키워드로 수집을 시작합니다. 키워드가 많을수록 오래 걸리며, 결과는 바로 보이지 않습니다."
        confirmLabel="실행"
        onOpenChange={setConfirming}
        onConfirm={() => {
          // TODO(Phase 5): POST api/v1/admin/article/scrap { media_id } 연결.
          // 지금은 변경 요청이 차단된 상태다. 서버에서 일괄 작업을 돌리는
          // 요청이라 다른 쓰기보다 영향이 크다. 연결할 때 따로 확인한다.
          toast.success('수집을 시작했습니다.');
          setConfirming(false);
        }}
      />
    </>
  );
}
