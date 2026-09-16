import { expect, test } from '@playwright/test';

// 로그인 이후 흐름은 실제 운영 계정이 필요하므로 자동 검사에 넣지 않는다.
// Phase 1부터 화면이 붙으면 테스트 계정 정책을 정해 확장한다.
test('로그인하지 않으면 보호된 화면 대신 로그인 화면을 보여준다', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/collect');
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole('heading', { name: '로그인' })).toBeVisible();
  expect(errors).toEqual([]);
});

test('빈 값으로 로그인하면 입력별 오류를 표시한다', async ({ page }) => {
  await page.goto('/login');
  await page.getByRole('button', { name: '로그인' }).click();
  await expect(page.getByText('아이디를 입력해 주세요.')).toBeVisible();
  await expect(page.getByText('비밀번호를 입력해 주세요.')).toBeVisible();
  await page.getByLabel('아이디').fill('operator');
  await page.getByRole('button', { name: '로그인' }).click();
  await expect(page.getByText('아이디를 입력해 주세요.')).toBeHidden();
  await expect(page.getByText('비밀번호를 입력해 주세요.')).toBeVisible();
});

test('모바일 폭에서도 로그인 폼이 보인다', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 780 });
  await page.goto('/login');
  await expect(page.getByLabel('아이디')).toBeVisible();
  await expect(page.getByLabel('비밀번호')).toBeVisible();
  await page.screenshot({ path: 'test-results/login-mobile.png' });
});
