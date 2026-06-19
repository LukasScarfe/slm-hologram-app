import { test, expect } from '@playwright/test';

// ─── helpers ────────────────────────────────────────────────────────────────

async function openModeDropdown(page) {
  await page.locator('[data-testid="add-mode-button"]').click();
  await page.waitForSelector('[role="listbox"]');
}

async function addMode(page, label) {
  await openModeDropdown(page);
  // Use exact: true to avoid substring matches (e.g. 'Gaussian' ⊂ 'Laguerre-Gaussian')
  await page.getByRole('option', { name: label, exact: true }).click();
  // Wait for at least one mode card to appear
  await page.waitForSelector('[data-testid^="mode-card-"]', { timeout: 3000 });
}

async function removeAllModes(page) {
  let buttons = await page.locator('[aria-label^="Remove mode"]').all();
  while (buttons.length > 0) {
    await buttons[0].click();
    await page.waitForTimeout(100);
    buttons = await page.locator('[aria-label^="Remove mode"]').all();
  }
}

// ─── tests ──────────────────────────────────────────────────────────────────

test('1. All 14 mode types appear in the Add Mode dropdown', async ({ page }) => {
  await page.goto('/');
  await page.waitForLoadState('domcontentloaded');
  await openModeDropdown(page);

  const expectedLabels = [
    'Gaussian', 'Laguerre-Gaussian', 'Hermite-Gaussian', 'Bessel',
    'Airy Beam', 'Ince-Gaussian', 'Mathieu Beam', 'Parabolic Beam',
    'Vector Vortex', 'Axicon', 'Spiral Phase',
    'Lens', 'Zernike', 'Custom Equation',
  ];

  // Check total option count first
  const allOptions = page.locator('[role="listbox"] [role="option"]');
  await expect(allOptions).toHaveCount(14, { timeout: 2000 });

  // Spot-check a few labels (exact: true avoids substring matches)
  for (const label of expectedLabels) {
    await expect(page.getByRole('option', { name: label, exact: true })).toBeAttached({ timeout: 2000 });
  }

  await page.keyboard.press('Escape');
});

test('2. Adding Airy Beam shows the airy-scale param control', async ({ page }) => {
  await page.goto('/');
  await page.waitForLoadState('domcontentloaded');
  await addMode(page, 'Airy Beam');
  await expect(page.locator('[data-testid="airy-scale"]')).toBeVisible({ timeout: 2000 });
});

test('3. Custom Equation: invalid input shows equation-error element', async ({ page }) => {
  await page.goto('/');
  await page.waitForLoadState('domcontentloaded');
  await addMode(page, 'Custom Equation');

  const textarea = page.locator('[data-testid="custom-equation-input"]');
  await expect(textarea).toBeVisible();
  await textarea.fill('@@invalid@@');
  await textarea.press('Tab'); // blur → commit → math.js throws → error stored

  await expect(page.locator('[data-testid="equation-error"]')).toBeVisible({ timeout: 2000 });
});

test('4. Adding Axicon shows axicon-angle param control', async ({ page }) => {
  await page.goto('/');
  await page.waitForLoadState('domcontentloaded');
  await addMode(page, 'Axicon');
  await expect(page.locator('[data-testid="axicon-angle"]')).toBeVisible({ timeout: 2000 });
});

test('5. Adding Spiral Phase shows spiral-l param control', async ({ page }) => {
  await page.goto('/');
  await page.waitForLoadState('domcontentloaded');
  await addMode(page, 'Spiral Phase');
  await expect(page.locator('[data-testid="spiral-l"]')).toBeVisible({ timeout: 2000 });
});

test('6. Adding Ince-Gaussian shows ince-p param control', async ({ page }) => {
  await page.goto('/');
  await page.waitForLoadState('domcontentloaded');
  await addMode(page, 'Ince-Gaussian');
  await expect(page.locator('[data-testid="ince-p"]')).toBeVisible({ timeout: 2000 });
});

test('7. Canvas becomes non-blank after adding Spiral Phase mode', async ({ page }) => {
  await page.goto('/');
  await page.waitForLoadState('domcontentloaded');
  await addMode(page, 'Spiral Phase');

  await page.waitForFunction(
    () => {
      const canvas = document.querySelector('[data-testid^="hologram-preview-"]');
      if (!canvas) return false;
      const ctx = canvas.getContext('2d');
      const d = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
      for (let i = 0; i < d.length; i += 4) {
        if (d[i] !== 64 || d[i + 1] !== 64 || d[i + 2] !== 64) return true;
      }
      return false;
    },
    { timeout: 10000 }
  );
  expect(true).toBe(true); // reached here = non-blank ✓
});

test('8. All 14 modes can be added sequentially without console errors', async ({ page }) => {
  const consoleErrors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });
  page.on('pageerror', (err) => consoleErrors.push(err.message));

  await page.goto('/');
  await page.waitForLoadState('domcontentloaded');

  const modeLabels = [
    'Gaussian', 'Laguerre-Gaussian', 'Hermite-Gaussian', 'Bessel',
    'Airy Beam', 'Ince-Gaussian', 'Mathieu Beam', 'Parabolic Beam',
    'Vector Vortex', 'Axicon', 'Spiral Phase',
    'Lens', 'Zernike', 'Custom Equation',
  ];

  for (const label of modeLabels) {
    await openModeDropdown(page);
    await page.getByRole('option', { name: label, exact: true }).click();
    await page.waitForTimeout(150);
  }

  // All 14 mode cards should be present
  const cards = page.locator('[data-testid^="mode-card-"]');
  await expect(cards).toHaveCount(14, { timeout: 3000 });

  // No React/JS errors during the adds
  expect(consoleErrors.filter(e => !e.includes('ResizeObserver'))).toHaveLength(0);

  // Remove all and verify send-to-display-button still works
  await removeAllModes(page);
  await expect(page.locator('[data-testid="send-to-display-button"]')).toBeVisible({ timeout: 2000 });
});
