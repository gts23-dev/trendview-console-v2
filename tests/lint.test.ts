import assert from 'node:assert/strict';
import { it } from 'node:test';
import { ESLint } from 'eslint';

const eslint = new ESLint();

async function lint(source: string, filePath: string) {
  const [result] = await eslint.lintText(source, { filePath });
  return result;
}

function hasBoundaryError(result: Awaited<ReturnType<typeof lint>>) {
  return result.messages.some(
    (message) => message.ruleId === 'project/boundaries',
  );
}

it('페이지는 공개 feature API로 화면만 조립한다', async () => {
  for (const source of [
    "import { request } from '@/shared/api/http-client';",
    "import { queryClient } from '@/shared/query/query-client';",
    "import { useQuery } from '@tanstack/react-query';",
    "import { useArticleList } from '@/features/articles/hooks/use-articles';",
    "import { useArticleList } from '../../features/articles';",
    "import { OtherPage } from '@/pages/other/page';",
  ]) {
    assert.equal(
      hasBoundaryError(await lint(source, 'src/pages/collect/page.tsx')),
      true,
      source,
    );
  }

  const allowed = await lint(
    "import { useArticleList } from '@/features/articles'; import { PageHeader } from '@/components/common/page-header'; export function CollectPage() { useArticleList(); return PageHeader ? null : null; }",
    'src/pages/collect/page.tsx',
  );
  assert.equal(allowed.errorCount, 0, JSON.stringify(allowed.messages));
});

it('feature는 pages와 routing에 의존하지 않는다', async () => {
  for (const source of [
    "import { CollectPage } from '@/pages/collect/page';",
    "import { router } from '@/routing/app-router';",
  ]) {
    assert.equal(
      hasBoundaryError(
        await lint(source, 'src/features/articles/hooks/use-articles.ts'),
      ),
      true,
      source,
    );
  }
});

it('다른 feature는 공개 진입점으로만 참조한다', async () => {
  const internal = await lint(
    "import { isAdminGrade } from '@/features/auth/model';",
    'src/features/articles/api/articles.ts',
  );
  assert.equal(hasBoundaryError(internal), true);

  const publicApi = await lint(
    "import { isAdminGrade } from '@/features/auth'; export const editable = isAdminGrade(null);",
    'src/features/articles/api/articles.ts',
  );
  assert.equal(publicApi.errorCount, 0, JSON.stringify(publicApi.messages));
});

it('shared는 업무와 화면 계층을 알지 못한다', async () => {
  for (const source of [
    "import { useArticleList } from '@/features/articles';",
    "import { Button } from '@/components/ui/button';",
    "import { CollectPage } from '@/pages/stats/counts/page';",
  ]) {
    assert.equal(
      hasBoundaryError(await lint(source, 'src/shared/utils/example.ts')),
      true,
      source,
    );
  }

  for (const filePath of [
    'src/shared/api/example.ts',
    'src/shared/errors/example.ts',
    'src/shared/utils/example.ts',
  ]) {
    assert.equal(
      hasBoundaryError(await lint("import { toast } from 'sonner';", filePath)),
      true,
      filePath,
    );
  }
});

it('기본 UI와 공통 조합 UI에는 업무 기능을 넣지 않는다', async () => {
  for (const filePath of [
    'src/components/ui/example.tsx',
    'src/components/common/example.tsx',
  ]) {
    assert.equal(
      hasBoundaryError(
        await lint(
          "import { useArticleList } from '@/features/articles';",
          filePath,
        ),
      ),
      true,
      filePath,
    );
  }
});

it('feature 내부 상대 참조와 layout의 공개 auth 참조는 허용한다', async () => {
  const feature = await lint(
    "import type { Entry } from '../model/types'; export const item: Entry | null = null;",
    'src/features/articles/components/article-detail.tsx',
  );
  assert.equal(feature.errorCount, 0, JSON.stringify(feature.messages));

  const layout = await lint(
    "import { useAuth } from '@/features/auth'; export function AppLayout() { useAuth(); return null; }",
    'src/components/layouts/app-layout.tsx',
  );
  assert.equal(layout.errorCount, 0, JSON.stringify(layout.messages));
});

it('layout도 feature 공개 진입점만 사용하며 page를 참조하지 않는다', async () => {
  for (const source of [
    "import { useAuth } from '@/features/auth/context';",
    "import { LoginPage } from '@/pages/login/page';",
  ]) {
    assert.equal(
      hasBoundaryError(
        await lint(source, 'src/components/layouts/app-layout.tsx'),
      ),
      true,
      source,
    );
  }
});

it('명명·named export·직접 console 사용을 검사한다', async () => {
  const result = await lint(
    'export default function ExamplePage() { console.log("debug"); return null; }',
    'src/pages/example/ExamplePage.tsx',
  );
  const rules = result.messages.map((message) => message.ruleId);
  assert.ok(rules.includes('project/file-name'));
  assert.ok(rules.includes('no-restricted-syntax'));
  assert.ok(rules.includes('no-console'));
});

it('화면·훅의 실패 토스트 중복과 화살표 컴포넌트를 검사한다', async () => {
  const result = await lint(
    "import { toast } from 'sonner'; export const ExamplePage = () => { toast.error('실패'); return null; };",
    'src/pages/example/page.tsx',
  );
  assert.ok(
    result.messages.some((message) => message.ruleId === 'project/error-toast'),
  );
  assert.ok(
    result.messages.some(
      (message) => message.ruleId === 'no-restricted-syntax',
    ),
  );
});

it('오류 토스트는 사용 위치에서만 예외로 둔다', async () => {
  const source = "import { toast } from 'sonner'; toast.error('시연');";
  const result = await lint(source, 'src/pages/components/page.tsx');
  assert.ok(
    result.messages.some((message) => message.ruleId === 'project/error-toast'),
  );

  const localException = [
    "import { toast } from 'sonner';",
    '// UI 컴포넌트의 오류 알림 모양을 시연한다.',
    '// eslint-disable-next-line project/error-toast',
    "toast.error('시연');",
  ].join('\n');
  const allowed = await lint(localException, 'src/pages/components/page.tsx');
  assert.equal(allowed.errorCount, 0, JSON.stringify(allowed.messages));
});
