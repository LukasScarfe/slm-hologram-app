import { test, expect } from '@playwright/test';

// ─── helpers ────────────────────────────────────────────────────────────────

async function goto(page) {
  await page.goto('/');
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(300);
}

async function addLGMode(page) {
  await page.locator('[data-testid="add-mode-button"]').click();
  await page.waitForSelector('[role="listbox"]');
  await page.getByRole('option', { name: 'Laguerre-Gaussian' }).click();
  await page.waitForSelector('[data-testid="mode-card-0"]');
}

async function addGaussianMode(page) {
  await page.locator('[data-testid="add-mode-button"]').click();
  await page.waitForSelector('[role="listbox"]');
  await page.getByRole('option', { name: 'Gaussian', exact: true }).click();
  await page.waitForSelector('[data-testid="mode-card-0"]');
}

async function canvasChecksum(page) {
  return page.evaluate(() => {
    const canvas = document.querySelector('[data-testid^="hologram-preview-"]');
    if (!canvas || canvas.width === 0) return -1;
    const ctx = canvas.getContext('2d');
    const d = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    let s = 0;
    for (let i = 0; i < d.length; i += 4) s += d[i] + d[i + 1] + d[i + 2];
    return s;
  });
}

async function waitForChecksumChange(page, before, ms = 6000) {
  const deadline = Date.now() + ms;
  while (Date.now() < deadline) {
    const after = await canvasChecksum(page);
    if (after !== before && after !== -1) return after;
    await page.waitForTimeout(150);
  }
  throw new Error(`Canvas checksum stuck at ${before}`);
}

// ─── Colormap toggle ─────────────────────────────────────────────────────────

test('43. Phase view: CET C06 button is aria-pressed=true by default', async ({ page }) => {
  await goto(page);
  await page.locator('[data-testid="preview-mode-phase"]').click();
  await expect(page.locator('[data-testid="colormap-cet_c6"]')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('[data-testid="colormap-hsv"]')).toHaveAttribute('aria-pressed', 'false');
});

test('44. Colormap toggle only visible in Phase and Field views, hidden in Hologram and Intensity', async ({ page }) => {
  await goto(page);

  // Hologram (default) — toggle not present
  await expect(page.locator('[data-testid="colormap-cet_c6"]')).not.toBeVisible();

  // Intensity — toggle not present
  await page.locator('[data-testid="preview-mode-intensity"]').click();
  await expect(page.locator('[data-testid="colormap-cet_c6"]')).not.toBeVisible();

  // Phase — toggle present
  await page.locator('[data-testid="preview-mode-phase"]').click();
  await expect(page.locator('[data-testid="colormap-cet_c6"]')).toBeVisible();
  await expect(page.locator('[data-testid="colormap-hsv"]')).toBeVisible();

  // Field — toggle present
  await page.locator('[data-testid="preview-mode-field"]').click();
  await expect(page.locator('[data-testid="colormap-cet_c6"]')).toBeVisible();
  await expect(page.locator('[data-testid="colormap-hsv"]')).toBeVisible();
});

test('45. Switching to HSV colormap changes Phase canvas content', async ({ page }) => {
  await goto(page);
  await addLGMode(page);
  await page.locator('[data-testid="preview-mode-phase"]').click();
  await page.waitForTimeout(1000);

  const before = await canvasChecksum(page);

  // Switch to HSV
  await page.locator('[data-testid="colormap-hsv"]').click();
  await expect(page.locator('[data-testid="colormap-hsv"]')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('[data-testid="colormap-cet_c6"]')).toHaveAttribute('aria-pressed', 'false');

  await waitForChecksumChange(page, before);
  expect(true).toBe(true); // canvas changed
});

test('46. Legend data-colormap attribute updates when colormap changes', async ({ page }) => {
  await goto(page);
  const bar = page.locator('[data-testid="preview-legend-bar"]');

  await page.locator('[data-testid="preview-mode-phase"]').click();
  await expect(bar).toHaveAttribute('data-colormap', 'cet_c6');

  await page.locator('[data-testid="colormap-hsv"]').click();
  await expect(bar).toHaveAttribute('data-colormap', 'hsv');

  await page.locator('[data-testid="colormap-cet_c6"]').click();
  await expect(bar).toHaveAttribute('data-colormap', 'cet_c6');
});

// ─── SLM tab renaming ────────────────────────────────────────────────────────

test('51. Double-clicking SLM tab label opens inline rename input', async ({ page }) => {
  await goto(page);
  const tab = page.locator('[data-testid="slm-tab-0"]');
  // Double-click the label span inside the tab (not the tab button itself)
  await tab.locator('span').first().dblclick();
  await expect(page.locator('[data-testid="slm-tab-rename-input"]')).toBeVisible();
});

test('52. Typing a new name and pressing Enter renames the tab', async ({ page }) => {
  await goto(page);
  const tab = page.locator('[data-testid="slm-tab-0"]');
  await tab.locator('span').first().dblclick();
  const input = page.locator('[data-testid="slm-tab-rename-input"]');
  await input.fill('My SLM');
  await input.press('Enter');
  await expect(input).not.toBeVisible();
  await expect(tab).toContainText('My SLM');
});

test('53. Pressing Escape during rename reverts the label', async ({ page }) => {
  await goto(page);
  const tab = page.locator('[data-testid="slm-tab-0"]');
  const originalText = await tab.locator('span').first().textContent();
  await tab.locator('span').first().dblclick();
  const input = page.locator('[data-testid="slm-tab-rename-input"]');
  await input.fill('SHOULD_NOT_SAVE');
  await input.press('Escape');
  await expect(input).not.toBeVisible();
  await expect(tab).toContainText(originalText);
});

// ─── Mode nicknames ───────────────────────────────────────────────────────────

test('54. Double-clicking mode title opens nickname input', async ({ page }) => {
  await goto(page);
  await addLGMode(page);
  await page.locator('[data-testid="mode-title-0"]').dblclick();
  await expect(page.locator('[data-testid="mode-nickname-input-0"]')).toBeVisible();
});

test('55. Setting a nickname shows it as primary label with type suffix', async ({ page }) => {
  await goto(page);
  await addLGMode(page);
  await page.locator('[data-testid="mode-title-0"]').dblclick();
  const input = page.locator('[data-testid="mode-nickname-input-0"]');
  await input.fill('Vortex');
  await input.press('Enter');
  // The title span should show "Vortex" and still contain "LG" as the type suffix
  const titleEl = page.locator('[data-testid="mode-title-0"]');
  await expect(titleEl).toContainText('Vortex');
  await expect(titleEl).toContainText('LG');
});

test('56. Pressing Escape during nickname edit reverts to previous label', async ({ page }) => {
  await goto(page);
  await addLGMode(page);
  // Default display is the type label "LG"
  await page.locator('[data-testid="mode-title-0"]').dblclick();
  const input = page.locator('[data-testid="mode-nickname-input-0"]');
  await input.fill('DISCARD');
  await input.press('Escape');
  await expect(input).not.toBeVisible();
  // Nickname should still be empty → display shows type label
  await expect(page.locator('[data-testid="mode-title-0"]')).toContainText('LG');
  await expect(page.locator('[data-testid="mode-title-0"]')).not.toContainText('DISCARD');
});

// ─── Hologram shift ───────────────────────────────────────────────────────────

test('57. Hologram shift X and Y slider controls are present', async ({ page }) => {
  await goto(page);
  await expect(page.locator('[data-testid="holo-shift-x-slider"]')).toBeVisible();
  await expect(page.locator('[data-testid="holo-shift-y-slider"]')).toBeVisible();
});

test('58. Changing hologram shift X triggers canvas recompute', async ({ page }) => {
  await goto(page);
  await addLGMode(page);
  await page.waitForTimeout(800);
  const before = await canvasChecksum(page);
  const input = page.locator('[data-testid="holo-shift-x-input"]');
  await input.fill('50');
  await input.press('Enter');
  await waitForChecksumChange(page, before);
  expect(true).toBe(true);
});

// ─── Clear Stack button ───────────────────────────────────────────────────────

test('59. Clear Stack button hidden with no modes, visible after adding a mode', async ({ page }) => {
  await goto(page);
  await expect(page.locator('[data-testid="clear-stack-button"]')).not.toBeVisible();
  await addLGMode(page);
  await expect(page.locator('[data-testid="clear-stack-button"]')).toBeVisible();
});

test('60. Clicking Clear Stack removes all modes and hides the button', async ({ page }) => {
  await goto(page);
  await addLGMode(page);
  await expect(page.locator('[data-testid="mode-card-0"]')).toBeVisible();
  await page.locator('[data-testid="clear-stack-button"]').click();
  await expect(page.locator('[data-testid="mode-card-0"]')).not.toBeAttached();
  await expect(page.locator('[data-testid="clear-stack-button"]')).not.toBeVisible();
});

// ─── Mode prepend order ───────────────────────────────────────────────────────

test('61. New modes are prepended: second added mode becomes mode-card-0', async ({ page }) => {
  await goto(page);
  // Add Gaussian first
  await addGaussianMode(page);
  // Gaussian is now mode-card-0; it has no lg-l-slider
  await expect(page.locator('[data-testid="mode-card-0"] [data-testid="lg-l-slider"]')).not.toBeAttached();

  // Add LG second → it should become the new mode-card-0
  await addLGMode(page);
  // LG should now be mode-card-0 (has lg-l-slider)
  await expect(page.locator('[data-testid="mode-card-0"] [data-testid="lg-l-slider"]')).toBeVisible();
  // Gaussian should now be mode-card-1 (no lg-l-slider at index 1)
  await expect(page.locator('[data-testid="mode-card-1"] [data-testid="lg-l-slider"]')).not.toBeAttached();
});

// ─── Preset preserves wavelength ─────────────────────────────────────────────

test('62. Selecting a preset does not change the wavelength', async ({ page }) => {
  await goto(page);
  // Record current wavelength
  const waveInput = page.locator('[data-testid="wavelength-input"]');
  const initialWave = await waveInput.inputValue();

  // Select a different preset
  await page.locator('[data-testid="preset-select"]').click();
  await page.waitForSelector('[role="listbox"]');
  await page.getByRole('option', { name: 'Meadowlark 512', exact: true }).click();
  await page.waitForTimeout(200);

  // Wavelength should be unchanged; resolution should have updated
  await expect(waveInput).toHaveValue(initialWave);
  await expect(page.locator('text=512 × 512')).toBeVisible();
});
