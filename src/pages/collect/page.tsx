import { ARTICLE_STATE, ArticleListView } from '@/features/articles';

// 수동 수집 버튼은 기존 콘솔에서도 주석 처리된 상태였다(Home.vue:52).
// 되살릴 때는 아래 import와 headerAction 두 줄의 주석을 푼다.
// import { ScrapButton } from '@/features/articles';

export function CollectPage() {
  return (
    <ArticleListView
      state={ARTICLE_STATE.collected}
      title="수집정보"
      description="플랫폼에서 수집한 콘텐츠입니다. 활성하면 게시정보로 이동합니다."
      actionLabel="활성"
      actionDescription={(count) => `${count}개가 게시정보로 이동합니다.`}
      emptyTitle="수집된 콘텐츠가 없습니다"
      // headerAction={<ScrapButton />}
    />
  );
}
