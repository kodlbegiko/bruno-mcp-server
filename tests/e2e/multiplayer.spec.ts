import { test, expect } from '@playwright/test';

test.describe('多人連線房間 (Multiplayer Online Room) E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      window.localStorage.clear();
    });
    await page.reload();
  });

  test('Host can create online room and view room code and QR modal', async ({ page }) => {
    // 1. Click Online Room from Home
    await page.click('button:has-text("多人連線")');

    // 2. Online Lobby is visible
    await expect(page.locator('h2:has-text("多人連線大廳")')).toBeVisible();
    await expect(page.locator('button:has-text("建立房間 (房主)")')).toBeVisible();

    // 3. Fill host nickname and click create
    await page.fill('input[placeholder="房主"]', 'Sean (Host)');
    await page.click('button:has-text("確認建立房間")');

    // 4. Waiting room opens
    await expect(page.locator('text=房間邀請碼')).toBeVisible();
    await expect(page.locator('text=Sean (Host)')).toBeVisible();

    // 5. Open QR Code modal
    await page.click('button:has-text("QR Code 掃描")');
    await expect(page.locator('h3:has-text("邀請朋友加入房間")')).toBeVisible();
    await expect(page.locator('button:has-text("複製分享連結")')).toBeVisible();

    // Close modal
    await page.click('button:has-text("關閉")');
    await expect(page.locator('h3:has-text("邀請朋友加入房間")')).not.toBeVisible();
  });

  test('Guest can navigate via direct room URL parameter', async ({ page }) => {
    // Visit with ?room=ABC123
    await page.goto('/?room=TEST88');

    // Should automatically navigate to Join Room tab with room code pre-filled
    await expect(page.locator('h2:has-text("多人連線大廳")')).toBeVisible();
    const roomInput = page.locator('input[placeholder="例如：B8K2X9"]');
    await expect(roomInput).toHaveValue('TEST88');
  });
});
