import { ARTICLE_STATE, ArticleListView } from '@/features/articles';

export function ArticlesPage() {
  return (
    <ArticleListView
      state={ARTICLE_STATE.posted}
      title="게시정보"
      description="앱에 노출 중인 콘텐츠입니다. 비활성하면 수집정보로 돌아갑니다."
      actionLabel="비활성"
      actionDescription={(count) => `${count}개가 수집정보로 돌아갑니다.`}
      emptyTitle="게시 중인 콘텐츠가 없습니다"
    />
  );
}
