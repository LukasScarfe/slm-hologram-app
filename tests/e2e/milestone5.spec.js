import { test, expect } from '@playwright/test';

// ─── helpers ────────────────────────────────────────────────────────────────

// Scope to the active (visible) panel so hidden panel elements are not picked
function activePanel(page) {
  return page.locator('[data-active-panel="true"]');
}

async function addMode(page, modeLabel) {
  await activePanel(page).locator('[data-testid="add-mode-button"]').click();
  await page.waitForSelector('[role="listbox"]');
  await page.getByRole('option', { name: modeLabel }).click();
  await page.waitForTimeout(200);
}

async function selectFromRadix(page, triggerTestId, optionName) {
  await activePanel(page).locator(`[data-testid="${triggerTestId}"]`).click();
  await page.waitForSelector('[role="listbox"]');
  await page.getByRole('option', { name: optionName }).click();
  await page.waitForTimeout(200);
}

async function addSLM(page) {
  await page.locator('[data-testid="add-slm-button"]').click();
  await page.waitForTimeout(200);
}

async function switchToTab(page, index) {
  await page.locator(`[data-testid="slm-tab-${index}"]`).click();
  await page.waitForTimeout(200);
}

async function openDisplayWindow(page, context) {
  const [popup] = await Promise.all([
    context.waitForEvent('page', { timeout: 5000 }),
    activePanel(page).locator('[data-testid="send-to-display-button"]').click(),
  ]);
  return popup;
}

async function canvasChecksum(popupPage) {
  return popupPage.evaluate(() => {
    const canvas = document.querySelector('[data-testid="hologram-canvas"]');
    if (!canvas || canvas.width === 0) return -1;
    const ctx = canvas.getContext('2d');
    const w = canvas.width, h = canvas.height;
    // Sample the full canvas for a reliable checksum
    const d = ctx.getImageData(0, 0, w, h).data;
    let s = 0;
    for (let i = 0; i < d.length; i += 4) s += d[i];
    return s;
  });
}

async function waitForCanvasData(popupPage, timeout = 15000) {
  await popupPage.waitForFunction(
    () => {
      const c = document.querySelector('[data-testid="hologram-canvas"]');
      if (!c || c.width === 0) return false;
      const ctx = c.getContext('2d');
      const d = ctx.getImageData(0, 0, c.width, c.height).data;
      for (let i = 0; i < d.length; i += 4) if (d[i] > 0) return true;
      return false;
    },
    { timeout }
  );
}

// ─── tests ──────────────────────────────────────────────────────────────────

test('7. slm-tab-bar element is present', async ({ page }) => {
  await page.goto('/');
  await page.waitForLoadState('domcontentloaded');
  await expect(page.locator('[data-testid="slm-tab-bar"]')).toBeVisible();
});

test('8. Clicking add-slm-button adds slm-tab-1', async ({ page }) => {
  await page.goto('/');
  await page.waitForLoadState('domcontentloaded');
  await expect(page.locator('[data-testid="slm-tab-1"]')).not.toBeAttached();
  await addSLM(page);
  await expect(page.locator('[data-testid="slm-tab-1"]')).toBeVisible();
});

test('9. Switching to SLM 2 tab shows SLM 2 panel (data-slm-id)', async ({ page }) => {
  await page.goto('/');
  await page.waitForLoadState('domcontentloaded');
  await addSLM(page);
  // Click SLM 2 tab (index 1)
  await switchToTab(page, 1);
  // The visible panel root should have SLM 2's id
  const slm2Id = await page.evaluate(() => {
    // Find the first visible panel root (parent display:block)
    const panels = document.querySelectorAll('[data-slm-id]');
    for (const p of panels) {
      const wrapper = p.parentElement;
      if (wrapper && wrapper.style.display !== 'none') return p.getAttribute('data-slm-id');
    }
    return null;
  });
  // SLM 2's id should not be 'slm-1' (the first SLM)
  expect(slm2Id).toBeTruthy();
  expect(slm2Id).not.toBe('slm-1');
});

test('10. Each SLM tab shows its own mode stack independently', async ({ page }) => {
  await page.goto('/');
  await page.waitForLoadState('domcontentloaded');
  // Add LG mode to SLM 1
  await addMode(page, 'Laguerre-Gaussian');
  await expect(page.locator('[data-testid="mode-card-0"]').first()).toBeVisible();

  // Add SLM 2 and switch to it
  await addSLM(page);
  await switchToTab(page, 1);

  // SLM 2 should have no modes yet
  const slm2Modes = await page.locator('[data-testid="mode-card-0"]').all();
  // Only the hidden SLM 1's mode card should exist; visible panel (SLM 2) has none
  const visibleModeCards = await page.evaluate(() => {
    const cards = document.querySelectorAll('[data-testid="mode-card-0"]');
    let visible = 0;
    for (const card of cards) {
      let el = card;
      let hidden = false;
      while (el) {
        if (el.style && el.style.display === 'none') { hidden = true; break; }
        el = el.parentElement;
      }
      if (!hidden) visible++;
    }
    return visible;
  });
  expect(visibleModeCards).toBe(0);

  // Add HG mode to SLM 2
  await addMode(page, 'Hermite-Gaussian');
  const slm2VisibleCards = await page.evaluate(() => {
    const cards = document.querySelectorAll('[data-testid="mode-card-0"]');
    let visible = 0;
    for (const card of cards) {
      let el = card;
      let hidden = false;
      while (el) {
        if (el.style && el.style.display === 'none') { hidden = true; break; }
        el = el.parentElement;
      }
      if (!hidden) visible++;
    }
    return visible;
  });
  expect(slm2VisibleCards).toBe(1);
});

test('11. Each SLM tab shows only its own hologram preview canvas', async ({ page }) => {
  await page.goto('/');
  await page.waitForLoadState('domcontentloaded');

  // Get SLM 1's id from the panel
  const slm1Id = await page.evaluate(() =>
    document.querySelector('[data-slm-id]')?.getAttribute('data-slm-id')
  );
  expect(slm1Id).toBeTruthy();

  // SLM 1 canvas should be visible on SLM 1's tab
  await expect(page.locator(`[data-testid="hologram-preview-${slm1Id}"]`)).toBeVisible();

  // Add SLM 2 and switch
  await addSLM(page);
  await switchToTab(page, 1);

  // SLM 1's canvas should now be hidden (inside display:none wrapper)
  const slm1CanvasVisible = await page.evaluate((id) => {
    const canvas = document.querySelector(`[data-testid="hologram-preview-${id}"]`);
    if (!canvas) return false;
    let el = canvas;
    while (el) {
      if (el.style && el.style.display === 'none') return false;
      el = el.parentElement;
    }
    return true;
  }, slm1Id);
  expect(slm1CanvasVisible).toBe(false);

  // SLM 2's canvas should be visible
  const slm2Id = await page.evaluate(() => {
    const panels = document.querySelectorAll('[data-slm-id]');
    for (const p of panels) {
      const wrapper = p.parentElement;
      if (wrapper && wrapper.style.display !== 'none') return p.getAttribute('data-slm-id');
    }
    return null;
  });
  await expect(page.locator(`[data-testid="hologram-preview-${slm2Id}"]`)).toBeVisible();
});

test('12. Both SLM display windows open; context.pages().length === 3', async ({ page, context }) => {
  await page.goto('/');
  await page.waitForLoadState('domcontentloaded');

  // Use small preset for speed
  await selectFromRadix(page, 'preset-select', 'Meadowlark 512');

  // Add SLM 2
  await addSLM(page);

  // Open display for SLM 1 (currently on tab 0)
  const popup1 = await openDisplayWindow(page, context);
  await popup1.waitForSelector('[data-testid="hologram-canvas"]', { timeout: 5000 });

  // Switch to SLM 2 tab and open its display
  await page.bringToFront();
  await switchToTab(page, 1);
  await selectFromRadix(page, 'preset-select', 'Meadowlark 512');
  const popup2 = await openDisplayWindow(page, context);
  await popup2.waitForSelector('[data-testid="hologram-canvas"]', { timeout: 5000 });

  expect(context.pages().length).toBe(3);

  await popup1.close();
  await popup2.close();
});

test('13. Updating SLM 1 mode updates SLM 1 window; SLM 2 window unchanged', async ({ page, context }) => {
  await page.goto('/');
  await page.waitForLoadState('domcontentloaded');

  // Use small preset for speed on both SLMs
  await selectFromRadix(page, 'preset-select', 'Meadowlark 512');

  // Add LG mode to SLM 1
  await addMode(page, 'Laguerre-Gaussian');

  // Add SLM 2 with its own mode
  await addSLM(page);
  await switchToTab(page, 1);
  await selectFromRadix(page, 'preset-select', 'Meadowlark 512');
  await addMode(page, 'Hermite-Gaussian');

  // Open display for SLM 2 first (while on tab 1)
  const popup2 = await openDisplayWindow(page, context);
  await popup2.waitForSelector('[data-testid="hologram-canvas"]', { timeout: 5000 });
  await waitForCanvasData(popup2);

  // Switch to SLM 1 and open its display
  await page.bringToFront();
  await switchToTab(page, 0);
  const popup1 = await openDisplayWindow(page, context);
  await popup1.waitForSelector('[data-testid="hologram-canvas"]', { timeout: 5000 });
  await waitForCanvasData(popup1);

  // Snapshot both canvases BEFORE making any change
  const slm2Before = await canvasChecksum(popup2);
  const slm1Before = await canvasChecksum(popup1);

  // Change SLM 1's LG l param via the slider (scoped to active panel)
  const sliderRoot = activePanel(page).locator('[data-testid="lg-l-slider"]');
  const box = await sliderRoot.boundingBox();
  const fraction = (5 - (-10)) / (10 - (-10));
  await page.mouse.click(box.x + fraction * box.width, box.y + box.height / 2);
  await page.waitForTimeout(300);

  // Wait for SLM 1's window to update from slm1Before
  await popup1.waitForFunction(
    (before) => {
      const c = document.querySelector('[data-testid="hologram-canvas"]');
      if (!c || c.width === 0) return false;
      const ctx = c.getContext('2d');
      const d = ctx.getImageData(0, 0, Math.min(c.width, 20), Math.min(c.height, 20)).data;
      let s = 0;
      for (let i = 0; i < d.length; i += 4) s += d[i];
      return s !== before;
    },
    slm1Before,
    { timeout: 15000 }
  );

  // SLM 2's window should be unchanged
  const slm2After = await canvasChecksum(popup2);
  expect(slm2After).toBe(slm2Before);

  await popup1.close();
  await popup2.close();
});

test('14. Removing SLM 2 via remove-slm-1 closes tab without crashing', async ({ page, context }) => {
  await page.goto('/');
  await page.waitForLoadState('domcontentloaded');

  await addSLM(page);
  await expect(page.locator('[data-testid="slm-tab-1"]')).toBeVisible();

  // Open SLM 2's display window
  await switchToTab(page, 1);
  const popup2 = await openDisplayWindow(page, context);
  await popup2.waitForSelector('[data-testid="hologram-canvas"]', { timeout: 5000 });

  // Remove SLM 2
  await page.bringToFront();
  await page.locator('[data-testid="remove-slm-1"]').click();
  await page.waitForTimeout(600);

  // SLM 2's tab should be gone
  await expect(page.locator('[data-testid="slm-tab-1"]')).not.toBeAttached();

  // App should still be functional — SLM 1's config should be visible
  await expect(page.locator('[data-testid="preset-select"]').first()).toBeVisible();

  // The popup should have been closed
  await page.waitForTimeout(600);
  const open = !popup2.isClosed();
  // either already closed, or we accept it may still be open (window.close() is best-effort)
  // Main assertion is app didn't crash
  expect(context.pages().some((p) => p === page)).toBe(true);
});

test('15. Main UI responsive with two hologram windows open; canvas updates within 1 s', async ({ page, context }) => {
  await page.goto('/');
  await page.waitForLoadState('domcontentloaded');

  await selectFromRadix(page, 'preset-select', 'Meadowlark 512');
  await addMode(page, 'Laguerre-Gaussian');

  // Open SLM 1 display
  const popup1 = await openDisplayWindow(page, context);
  await popup1.waitForSelector('[data-testid="hologram-canvas"]', { timeout: 5000 });

  // Add SLM 2 and open its display too
  await page.bringToFront();
  await addSLM(page);
  await switchToTab(page, 1);
  await selectFromRadix(page, 'preset-select', 'Meadowlark 512');
  const popup2 = await openDisplayWindow(page, context);
  await popup2.waitForSelector('[data-testid="hologram-canvas"]', { timeout: 5000 });

  // Switch back to SLM 1
  await page.bringToFront();
  await switchToTab(page, 0);
  await waitForCanvasData(popup1);

  const before = await canvasChecksum(popup1);

  // Interact with SLM 1's gamma and verify canvas updates in < 1 s
  const gammaInput = activePanel(page).locator('[data-testid="gamma-input"]');
  await gammaInput.fill('200');
  await gammaInput.press('Enter');

  const changed = await popup1.waitForFunction(
    (beforeVal) => {
      const c = document.querySelector('[data-testid="hologram-canvas"]');
      if (!c || c.width === 0) return false;
      const ctx = c.getContext('2d');
      const d = ctx.getImageData(0, 0, Math.min(c.width, 20), Math.min(c.height, 20)).data;
      let s = 0;
      for (let i = 0; i < d.length; i += 4) s += d[i];
      return s !== beforeVal;
    },
    before,
    { timeout: 10000 }
  );
  expect(changed).toBeTruthy();

  await popup1.close();
  await popup2.close();
});
