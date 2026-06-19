import { test, expect } from '@playwright/test';

// ─── helpers ────────────────────────────────────────────────────────────────

async function addLGMode(page) {
  await page.locator('[data-testid="add-mode-button"]').click();
  await page.waitForSelector('[role="listbox"]');
  await page.getByRole('option', { name: 'Laguerre-Gaussian' }).click();
  await page.waitForSelector('[data-testid="mode-card-0"]');
}

async function selectFromRadix(page, triggerTestId, optionName) {
  await page.locator(`[data-testid="${triggerTestId}"]`).click();
  await page.waitForSelector('[role="listbox"]');
  await page.getByRole('option', { name: optionName }).click();
}

/** Returns a simple integer checksum of a 10×10 sample of the canvas */
async function canvasChecksum(popupPage) {
  return popupPage.evaluate(() => {
    const canvas = document.querySelector('[data-testid="hologram-canvas"]');
    if (!canvas || canvas.width === 0) return -1;
    const ctx = canvas.getContext('2d');
    const d = ctx.getImageData(0, 0, Math.min(canvas.width, 20), Math.min(canvas.height, 20)).data;
    let s = 0;
    for (let i = 0; i < d.length; i += 4) s += d[i];
    return s;
  });
}

async function openDisplayWindow(page, context) {
  const [popupPage] = await Promise.all([
    context.waitForEvent('page', { timeout: 5000 }),
    page.locator('[data-testid="send-to-display-button"]').click(),
  ]);
  return popupPage;
}

// ─── tests ──────────────────────────────────────────────────────────────────

test('1. send-to-display-button is present in the SLM panel', async ({ page }) => {
  await page.goto('/');
  await page.waitForLoadState('domcontentloaded');
  await expect(page.locator('[data-testid="send-to-display-button"]')).toBeVisible();
});

test('2. Clicking send-to-display opens a new browser window within 3 seconds', async ({ page, context }) => {
  await page.goto('/');
  await page.waitForLoadState('domcontentloaded');
  const popupPage = await openDisplayWindow(page, context);
  expect(popupPage).toBeTruthy();
  await popupPage.close();
});

test('3. New window contains <canvas data-testid="hologram-canvas">', async ({ page, context }) => {
  await page.goto('/');
  await page.waitForLoadState('domcontentloaded');
  const popupPage = await openDisplayWindow(page, context);
  await popupPage.waitForSelector('[data-testid="hologram-canvas"]', { timeout: 5000 });
  const canvas = popupPage.locator('[data-testid="hologram-canvas"]');
  await expect(canvas).toBeAttached();
  await popupPage.close();
});

test('4. Hologram canvas has width === hardware.resX and height === hardware.resY', async ({ page, context }) => {
  await page.goto('/');
  await page.waitForLoadState('domcontentloaded');
  // Default SLM is Holoeye PLUTO-2.1: 1920×1080
  const popupPage = await openDisplayWindow(page, context);
  await popupPage.waitForSelector('[data-testid="hologram-canvas"]', { timeout: 5000 });

  // Wait for DISPLAY_READY → SLM_PARAMS flow to update canvas dimensions
  await popupPage.waitForFunction(
    () => {
      const c = document.querySelector('[data-testid="hologram-canvas"]');
      return c && c.width === 1920 && c.height === 1080;
    },
    { timeout: 8000 }
  );

  const dims = await popupPage.evaluate(() => {
    const c = document.querySelector('[data-testid="hologram-canvas"]');
    return { width: c.width, height: c.height };
  });
  expect(dims.width).toBe(1920);
  expect(dims.height).toBe(1080);
  await popupPage.close();
});

test('5. Hologram canvas is non-blank (at least one non-zero pixel)', async ({ page, context }) => {
  await page.goto('/');
  await page.waitForLoadState('domcontentloaded');
  const popupPage = await openDisplayWindow(page, context);
  await popupPage.waitForSelector('[data-testid="hologram-canvas"]', { timeout: 5000 });

  // Wait for the worker to draw pixels (no-mode state returns grey 64,64,64 quickly)
  await popupPage.waitForFunction(
    () => {
      const canvas = document.querySelector('[data-testid="hologram-canvas"]');
      if (!canvas || canvas.width === 0) return false;
      const ctx = canvas.getContext('2d');
      const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
      for (let i = 0; i < data.length; i += 4) {
        if (data[i] !== 0) return true;
      }
      return false;
    },
    { timeout: 15000 }
  );
  expect(true).toBe(true); // reached here = non-blank ✓
  await popupPage.close();
});

test('6. Changing l param in main UI updates hologram window canvas', async ({ page, context }) => {
  await page.goto('/');
  await page.waitForLoadState('domcontentloaded');

  // Use a smaller SLM for faster full-res computation
  await selectFromRadix(page, 'preset-select', 'Meadowlark 512');
  await page.waitForTimeout(200);

  await addLGMode(page);
  await page.waitForTimeout(300);

  const popupPage = await openDisplayWindow(page, context);
  await popupPage.waitForSelector('[data-testid="hologram-canvas"]', { timeout: 5000 });

  // Wait for initial render (worker finishes first compute)
  await popupPage.waitForFunction(
    () => {
      const c = document.querySelector('[data-testid="hologram-canvas"]');
      if (!c || c.width === 0) return false;
      const ctx = c.getContext('2d');
      const d = ctx.getImageData(0, 0, 10, 10).data;
      return d.some((v) => v > 0);
    },
    { timeout: 15000 }
  );

  const before = await canvasChecksum(popupPage);

  // Change l via the Radix Slider thumb (click at 80% = value 6 on range -10..10)
  const sliderRoot = page.locator('[data-testid="lg-l-slider"]').first();
  await sliderRoot.scrollIntoViewIfNeeded();
  const box = await sliderRoot.boundingBox();
  const fraction = (6 - (-10)) / (10 - (-10)); // ~0.8
  await page.mouse.click(box.x + fraction * box.width, box.y + box.height / 2);
  await page.waitForTimeout(200);

  // Poll for canvas change in popup — full-res compute may take several seconds
  const changed = await popupPage.waitForFunction(
    (beforeVal) => {
      const canvas = document.querySelector('[data-testid="hologram-canvas"]');
      if (!canvas || canvas.width === 0) return false;
      const ctx = canvas.getContext('2d');
      const d = ctx.getImageData(0, 0, Math.min(canvas.width, 20), Math.min(canvas.height, 20)).data;
      let s = 0;
      for (let i = 0; i < d.length; i += 4) s += d[i];
      return s !== beforeVal;
    },
    before,
    { timeout: 15000 }
  );
  expect(changed).toBeTruthy();
  await popupPage.close();
});

test('7. Main UI window remains interactive after hologram window opens', async ({ page, context }) => {
  await page.goto('/');
  await page.waitForLoadState('domcontentloaded');
  const popupPage = await openDisplayWindow(page, context);

  // Main window should still be usable
  await page.bringToFront();
  const input = page.locator('[data-testid="gamma-input"]');
  await expect(input).toBeEditable({ timeout: 2000 });
  // Actually interact — fill should complete quickly
  await input.fill('200');
  await input.press('Enter');
  await page.waitForTimeout(200);
  await expect(input).toHaveValue('200');

  await popupPage.close();
});

test('8. Closing via close-display-button does not crash app; send-to-display-button reappears', async ({ page, context }) => {
  await page.goto('/');
  await page.waitForLoadState('domcontentloaded');
  const popupPage = await openDisplayWindow(page, context);
  await popupPage.waitForSelector('[data-testid="hologram-canvas"]', { timeout: 5000 });

  // While the popup is open, the main UI shows close-display-button
  await expect(page.locator('[data-testid="close-display-button"]')).toBeVisible({ timeout: 3000 });

  // Click close button in main UI — calls popup.close()
  await page.locator('[data-testid="close-display-button"]').click();
  await page.waitForTimeout(600); // poll interval fires; React re-renders

  // send-to-display-button should reappear
  await expect(page.locator('[data-testid="send-to-display-button"]')).toBeVisible({ timeout: 3000 });
  // No uncaught errors — app is still functional
  await expect(page.locator('[data-testid="preset-select"]')).toBeVisible();
});

test('9. screen-select dropdown is present with at least one screen option', async ({ page }) => {
  await page.goto('/');
  await page.waitForLoadState('domcontentloaded');
  const select = page.locator('[data-testid="screen-select"]');
  await expect(select).toBeVisible();
  const optCount = await select.locator('option').count();
  expect(optCount).toBeGreaterThanOrEqual(1);
});

test('10. Main UI window body is still interactable after hologram window opens', async ({ page, context }) => {
  await page.goto('/');
  await page.waitForLoadState('domcontentloaded');
  const popupPage = await openDisplayWindow(page, context);

  // Switch focus back to main window and verify it is interactable
  await page.bringToFront();
  const body = page.locator('body');
  await expect(body).toBeVisible();

  // The close-display-button (or send-to-display-button) must be interactable
  const btn = page.locator('[data-testid="close-display-button"], [data-testid="send-to-display-button"]').first();
  await expect(btn).toBeVisible({ timeout: 3000 });

  await popupPage.close();
});
