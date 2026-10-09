import { test, expect } from '@playwright/test';

test.describe('深刻認識一個人 (Deeply Know Someone) E2E Test Suite', () => {
  test.beforeEach(async ({ page }) => {
    // Visit home page and clear localStorage once
    await page.goto('/');
    await page.evaluate(() => {
      window.localStorage.clear();
    });
    await page.reload();
  });

  test('Scenario A: Complete 2-player game start & card flip & next card flow', async ({ page }) => {
    // 1. Visit Home
    await expect(page.locator('h1')).toContainText('深刻認識一個人');
    await expect(page.locator('text=Deeply Know Someone')).toBeVisible();

    // 2. Click Start Game
    await page.click('button:has-text("開始遊戲")');

    // 3. Setup screen
    await expect(page.locator('h2:has-text("建立新對話")')).toBeVisible();

    // Enter player names
    const playerInputs = page.locator('input[placeholder^="玩家"]');
    await expect(playerInputs).toHaveCount(2);
    await playerInputs.nth(0).fill('小明');
    await playerInputs.nth(1).fill('小華');

    // Start dialogue
    await page.click('button:has-text("開始對話")');

    // 4. Game screen
    await expect(page.locator('text=小明 抽牌')).toBeVisible();
    await expect(page.locator('button[aria-label="查看牌組資訊"]').getByText('暖身破冰')).toBeVisible();

    // Card should have back visible initially
    const flipButton = page.locator('button:has-text("翻開卡牌")');
    await expect(flipButton).toBeVisible();

    // Flip card
    await flipButton.click();

    // After flip, front content is visible and "換一題" & "下一張" buttons appear
    await expect(page.locator('button:has-text("換一題")')).toBeVisible();
    await expect(page.locator('button:has-text("下一張")')).toBeVisible();

    // Click "下一張" to advance drawer
    await page.click('button:has-text("下一張")');

    // Drawer should rotate to "小華 抽牌"
    await expect(page.locator('text=小華 抽牌')).toBeVisible();
  });

  test('Scenario B: Skip Card ("換一題") burns card without penalty', async ({ page }) => {
    await page.click('button:has-text("開始遊戲")');

    // Start with default names (玩家 1, 玩家 2)
    await page.click('button:has-text("開始對話")');

    await expect(page.locator('text=玩家 1 抽牌')).toBeVisible();

    // Flip card
    await page.click('button:has-text("翻開卡牌")');

    // Click "換一題"
    await page.click('button:has-text("換一題")');

    // Drawer stays with Player 1 for replacement question, presented face down
    await expect(page.locator('text=玩家 1 抽牌')).toBeVisible();
    await expect(page.locator('button:has-text("翻開卡牌")')).toBeVisible();
  });

  test('Scenario C: Settings Drawer displays deck progress, card history, and audio toggles', async ({ page }) => {
    await page.click('button:has-text("開始遊戲")');
    await page.click('button:has-text("開始對話")');

    // Flip card so at least one card is recorded
    await page.click('button:has-text("翻開卡牌")');

    // Open menu
    await page.click('button[aria-label="開啟選單"]');

    // Verify Settings Drawer is visible
    await expect(page.locator('h2:has-text("遊戲選單")')).toBeVisible();

    // Check deck progress tab
    const drawerPanel = page.locator('div.shadow-2xl');
    await expect(drawerPanel.getByText('暖身破冰')).toBeVisible();
    await expect(drawerPanel.getByText('一星連結')).toBeVisible();
    await expect(drawerPanel.getByText('二星連結')).toBeVisible();
    await expect(drawerPanel.getByText('三星連結')).toBeVisible();

    // Switch to history tab
    await page.click('button:has-text("本局歷程")');
    await expect(page.locator('text=隱私保護原則')).toBeVisible();
    await expect(page.locator('text=#1')).toBeVisible();

    // Switch to settings tab
    await page.click('button:has-text("設定與控制")');
    await expect(page.locator('text=雙語題卡')).toBeVisible();
    await expect(page.locator('text=音效回饋')).toBeVisible();

    // Close menu
    await page.click('button:has-text("返回遊戲")');
    await expect(page.locator('h2:has-text("遊戲選單")')).not.toBeVisible();
  });

  test('Scenario D: Three-Star Consent Gate protection', async ({ page }) => {
    await page.click('button:has-text("開始遊戲")');
    await page.click('button:has-text("開始對話")');

    // Open menu to jump to three-star directly
    await page.click('button[aria-label="開啟選單"]');
    const drawerPanel = page.locator('div.shadow-2xl');
    await drawerPanel.locator('button:has-text("三星連結")').click();

    // Gentle consent screen must appear
    await expect(page.locator('text=接下來的問題可能涉及比較私人的經驗')).toBeVisible();
    await expect(page.locator('text=任何人都可以換一題，不需要說明原因')).toBeVisible();

    // Click cancel first
    await page.click('button:has-text("先留在二星")');
    await expect(page.locator('text=接下來的問題可能涉及比較私人的經驗')).not.toBeVisible();

    // Try again and confirm
    await page.click('button[aria-label="開啟選單"]');
    await drawerPanel.locator('button:has-text("三星連結")').click();
    await page.click('button:has-text("繼續")');

    // Now in Three Star
    await expect(page.locator('button[aria-label="查看牌組資訊"]').getByText('三星連結')).toBeVisible();
  });

  test('Scenario E: State Persistence & Resuming on page reload', async ({ page }) => {
    await page.click('button:has-text("開始遊戲")');

    const playerInputs = page.locator('input[placeholder^="玩家"]');
    await playerInputs.nth(0).fill('阿強');
    await playerInputs.nth(1).fill('阿美');
    await page.click('button:has-text("開始對話")');

    await expect(page.locator('text=阿強 抽牌')).toBeVisible();

    // Reload page
    await page.reload();

    // Home page should now prioritize "繼續上次遊戲"
    await expect(page.locator('button:has-text("繼續上次遊戲")')).toBeVisible();
    await page.click('button:has-text("繼續上次遊戲")');

    // Game is resumed with exact players and drawer
    await expect(page.locator('text=阿強 抽牌')).toBeVisible();
  });

  test('Scenario F: Ending session brings warm reflection and stats', async ({ page }) => {
    await page.click('button:has-text("開始遊戲")');
    await page.click('button:has-text("開始對話")');

    // Flip card
    await page.click('button:has-text("翻開卡牌")');

    // Open menu and end game
    await page.click('button[aria-label="開啟選單"]');
    await page.click('button:has-text("設定與控制")');
    await page.click('button:has-text("結束這局遊戲")');

    // Ending page
    await expect(page.locator('h1:has-text("謝謝彼此的坦誠與聆聽")')).toBeVisible();
    await expect(page.locator('text=本次對話紀錄')).toBeVisible();
    await expect(page.locator('text=翻開卡牌')).toBeVisible();
    await expect(page.locator('text=最高深度')).toBeVisible();
    await expect(page.locator('button:has-text("再玩一次")')).toBeVisible();
    await expect(page.locator('button:has-text("返回首頁")')).toBeVisible();
  });
});
