import { expect, test, type Page } from '@playwright/test';

async function login(page: Page, role: 'admin' | 'viewer' = 'admin') {
  await page.goto('/');
  if (role === 'viewer')
    await page.getByText('조회 전용', { exact: true }).click();
  await page.getByRole('button', { name: '데모 시작하기' }).click();
  await expect(
    page.getByRole('heading', { name: '워크스페이스 한눈에 보기' }),
  ).toBeVisible();
}
test('목록 검색, 상세, 등록·수정·삭제, 조건 복귀', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await login(page);
  await expect(page.locator('.recharts-surface').first()).toBeVisible();
  await page.screenshot({ path: 'test-results/dashboard.png', fullPage: true });
  await page
    .getByRole('navigation', { name: '주 메뉴' })
    .getByRole('link', { name: '콘텐츠 관리', exact: true })
    .click();
  await page.getByRole('textbox', { name: '검색어' }).fill('서비스');
  await page.getByRole('button', { name: '검색', exact: true }).click();
  await expect(page).toHaveURL(/search=/);
  await page
    .getByRole('button', { name: '서비스 이용 안내', exact: false })
    .first()
    .click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page
    .getByRole('dialog')
    .getByRole('button', { name: '닫기', exact: true })
    .first()
    .click();
  await expect(page.getByRole('textbox', { name: '검색어' })).toHaveValue(
    '서비스',
  );
  await page.getByRole('button', { name: '검색 조건 초기화' }).click();
  await page.screenshot({ path: 'test-results/entries.png', fullPage: true });
  await page.getByRole('link', { name: '콘텐츠 등록', exact: true }).click();
  await page.getByRole('button', { name: '저장하기' }).click();
  await expect(
    page.getByText('제목을 입력해 주세요.', { exact: true }),
  ).toBeVisible();
  await page
    .getByRole('textbox', { name: '제목', exact: false })
    .fill('테스트 콘텐츠');
  await page
    .getByRole('textbox', { name: '내용', exact: true })
    .fill('브라우저에서 작성한 예제입니다.');
  await page.getByRole('button', { name: '저장하기' }).click();
  await expect(
    page.getByRole('button', { name: '테스트 콘텐츠', exact: false }).first(),
  ).toBeVisible();
  await page
    .getByRole('button', { name: '테스트 콘텐츠', exact: false })
    .first()
    .click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.screenshot({
    path: 'test-results/detail.png',
    fullPage: true,
    animations: 'disabled',
  });
  await page.getByRole('link', { name: '수정하기' }).click();
  await page
    .getByRole('textbox', { name: '제목', exact: false })
    .fill('수정한 콘텐츠');
  await page.getByRole('button', { name: '저장하기' }).click();
  await expect(
    page
      .getByRole('dialog')
      .getByRole('heading', { name: '수정한 콘텐츠', exact: true }),
  ).toBeVisible();
  await page
    .getByRole('dialog')
    .getByRole('button', { name: '닫기', exact: true })
    .first()
    .click();
  await page
    .getByRole('checkbox', { name: '수정한 콘텐츠 선택', exact: true })
    .check();
  await page.getByRole('button', { name: '선택 삭제' }).click();
  await page
    .getByRole('dialog')
    .getByRole('button', { name: '삭제', exact: true })
    .click();
  await expect(
    page.getByRole('button', { name: '수정한 콘텐츠', exact: false }),
  ).toHaveCount(0);
  expect(errors).toEqual([]);
});
test('미저장 변경 확인, 브라우저 뒤로 가기와 페이지 선택 해제', async ({
  page,
}) => {
  await login(page);
  await page.goto('/entries/new');
  await page
    .getByRole('textbox', { name: '제목', exact: false })
    .fill('저장하지 않음');
  await page.getByRole('button', { name: '취소', exact: true }).click();
  await expect(
    page
      .getByRole('dialog')
      .getByRole('heading', { name: '작성을 그만둘까요?' }),
  ).toBeVisible();
  await page
    .getByRole('dialog')
    .getByRole('button', { name: '취소', exact: true })
    .click();
  await expect(
    page.getByRole('textbox', { name: '제목', exact: false }),
  ).toHaveValue('저장하지 않음');
  await page.getByRole('button', { name: '취소', exact: true }).click();
  await page
    .getByRole('dialog')
    .getByRole('button', { name: '나가기' })
    .click();
  await page.getByRole('checkbox', { name: '현재 페이지 전체 선택' }).check();
  await page.getByRole('button', { name: '다음 페이지' }).click();
  await expect(page.getByRole('button', { name: '선택 삭제' })).toHaveCount(0);
  await page.goBack();
  await expect(
    page.getByRole('checkbox', { name: '현재 페이지 전체 선택' }),
  ).not.toBeChecked();
});
test('조회 전용 계정과 직접 주소의 쓰기 권한 제한', async ({ page }) => {
  await login(page, 'viewer');
  await page.goto('/entries');
  await expect(
    page.getByRole('link', { name: '콘텐츠 등록', exact: true }),
  ).toHaveCount(0);
  await expect(page.getByRole('checkbox')).toHaveCount(0);
  await page.goto('/entries/new');
  await expect(
    page.getByRole('heading', { name: '수정 권한이 없습니다' }),
  ).toBeVisible();
  await page.getByRole('button', { name: '로그아웃' }).click();
  await expect(page).toHaveURL(/login/);
  await page.goto('/entries');
  await expect(page).toHaveURL(/login/);
});
test('모바일 메뉴와 컴포넌트 예제', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await login(page);
  await page.getByRole('button', { name: '메뉴 열기' }).click();
  await page
    .getByRole('dialog')
    .getByRole('link', { name: 'UI 컴포넌트' })
    .click();
  await expect(
    page.getByRole('heading', { name: 'UI 컴포넌트' }),
  ).toBeVisible();
  await page.getByRole('button', { name: '상세 패널 열기' }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  const fits = await page.evaluate(
    () => document.documentElement.scrollWidth <= innerWidth,
  );
  expect(fits).toBe(true);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({
    path: 'test-results/mobile.png',
    fullPage: true,
    animations: 'disabled',
  });
});

test('저장 실패는 한 번 알리고 재저장과 가이드 초기화 후 목록을 갱신한다', async ({
  page,
}) => {
  await login(page);
  await page.goto('/entries/new');
  await page
    .getByRole('textbox', { name: '제목', exact: false })
    .fill('재시도 콘텐츠');
  await page.evaluate(() => {
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = function (key, value) {
      if (key === 'console-boilerplate.entries.v1') {
        Storage.prototype.setItem = original;
        throw new DOMException('내부 저장소 오류 원문', 'QuotaExceededError');
      }
      original.call(this, key, value);
    };
  });
  await page.getByRole('button', { name: '저장하기' }).click();
  const failure = page.locator('[data-sonner-toast][data-type="error"]');
  await expect(failure).toHaveCount(1);
  await expect(failure).toContainText(
    '요청을 처리하지 못했습니다. 다시 시도해 주세요.',
  );
  await expect(
    page.getByRole('textbox', { name: '제목', exact: false }),
  ).toHaveValue('재시도 콘텐츠');
  await expect(page.getByText('내부 저장소 오류 원문')).toHaveCount(0);
  await page.getByRole('button', { name: '저장하기' }).click();
  await expect(
    page.getByRole('button', { name: '재시도 콘텐츠', exact: false }).first(),
  ).toBeVisible();
  await page
    .getByRole('navigation', { name: '주 메뉴' })
    .getByRole('link', { name: '개발 가이드' })
    .click();
  await expect(
    page.getByRole('heading', { name: '코드 작성 기본 규칙' }),
  ).toBeVisible();
  await page.getByRole('button', { name: '예제 데이터 초기화' }).click();
  await page
    .getByRole('dialog')
    .getByRole('button', { name: '초기화', exact: true })
    .click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.getByRole('link', { name: '목록 예제 살펴보기' }).click();
  await expect(
    page.getByRole('button', { name: '재시도 콘텐츠', exact: false }),
  ).toHaveCount(0);
  await expect(page.getByText('총 24건', { exact: false })).toBeVisible();
});
