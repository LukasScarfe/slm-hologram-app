import { test, expect } from '@playwright/test';

// ─── helpers ────────────────────────────────────────────────────────────────

async function addLGMode(page) {
  await page.locator('[data-testid="add-mode-button"]').click();
  await page.waitForSelector('[role="listbox"]');
  await page.getByRole('option', { name: 'Laguerre-Gaussian' }).click();
  await page.waitForSelector('[data-testid="mode-card-0"]');
}

/** Checksums the full canvas pixel data (sum of R+G+B per pixel) */
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

/** Returns true if any pixel has R ≠ G (indicating a colour, not greyscale) */
async function canvasHasColor(page) {
  return page.evaluate(() => {
    const canvas = document.querySelector('[data-testid^="hologram-preview-"]');
    if (!canvas || canvas.width === 0) return false;
    const ctx = canvas.getContext('2d');
    const d = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    for (let i = 0; i < d.length; i += 4) {
      if (d[i] !== d[i + 1]) return true;
    }
    return false;
  });
}

/** Poll until canvas checksum changes from `before`, max `ms` milliseconds */
async function waitForChecksumChange(page, before, ms = 5000) {
  const deadline = Date.now() + ms;
  while (Date.now() < deadline) {
    const after = await canvasChecksum(page);
    if (after !== before && after !== -1) return after;
    await page.waitForTimeout(150);
  }
  throw new Error(`Canvas checksum stuck at ${before}`);
}

// ─── tests ──────────────────────────────────────────────────────────────────

test('34. Four view-mode toggle buttons are present in order: Hologram, Field, Intensity, Phase', async ({ page }) => {
  await page.goto('/');
  await page.waitForLoadState('domcontentloaded');

  await expect(page.locator('[data-testid="preview-mode-hologram"]')).toBeVisible();
  await expect(page.locator('[data-testid="preview-mode-field"]')).toBeVisible();
  await expect(page.locator('[data-testid="preview-mode-intensity"]')).toBeVisible();
  await expect(page.locator('[data-testid="preview-mode-phase"]')).toBeVisible();

  // Verify DOM order: Hologram → Field → Intensity → Phase
  const buttons = page.locator('[data-testid^="preview-mode-"]');
  await expect(buttons.nth(0)).toHaveAttribute('data-testid', 'preview-mode-hologram');
  await expect(buttons.nth(1)).toHaveAttribute('data-testid', 'preview-mode-field');
  await expect(buttons.nth(2)).toHaveAttribute('data-testid', 'preview-mode-intensity');
  await expect(buttons.nth(3)).toHaveAttribute('data-testid', 'preview-mode-phase');
});

test('35. Hologram button is selected by default; others are not', async ({ page }) => {
  await page.goto('/');
  await page.waitForLoadState('domcontentloaded');

  await expect(page.locator('[data-testid="preview-mode-hologram"]')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('[data-testid="preview-mode-field"]')).toHaveAttribute('aria-pressed', 'false');
  await expect(page.locator('[data-testid="preview-mode-intensity"]')).toHaveAttribute('aria-pressed', 'false');
  await expect(page.locator('[data-testid="preview-mode-phase"]')).toHaveAttribute('aria-pressed', 'false');
});

test('36. Switching to intensity mode updates aria-pressed and changes canvas content', async ({ page }) => {
  await page.goto('/');
  await page.waitForLoadState('domcontentloaded');
  await addLGMode(page);

  // Wait for initial hologram compute
  await page.waitForTimeout(800);
  const hologramSum = await canvasChecksum(page);

  await page.locator('[data-testid="preview-mode-intensity"]').click();

  // aria-pressed should flip immediately
  await expect(page.locator('[data-testid="preview-mode-intensity"]')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('[data-testid="preview-mode-hologram"]')).toHaveAttribute('aria-pressed', 'false');

  // Canvas should show different data (intensity ≠ hologram grey levels)
  const intensitySum = await canvasChecksum(page);
  expect(intensitySum).not.toBe(hologramSum);
});

test('37. Phase mode shows colour pixels (R ≠ G somewhere)', async ({ page }) => {
  await page.goto('/');
  await page.waitForLoadState('domcontentloaded');
  await addLGMode(page);
  await page.waitForTimeout(800);

  await page.locator('[data-testid="preview-mode-phase"]').click();
  await expect(page.locator('[data-testid="preview-mode-phase"]')).toHaveAttribute('aria-pressed', 'true');

  // Phase uses HSV colormap — at least some pixels must be non-greyscale
  const hasColor = await canvasHasColor(page);
  expect(hasColor).toBe(true);
});

test('38. Switching back to hologram restores original canvas data', async ({ page }) => {
  await page.goto('/');
  await page.waitForLoadState('domcontentloaded');
  await addLGMode(page);
  await page.waitForTimeout(800);

  const hologramSum = await canvasChecksum(page);

  // Go to intensity, then back
  await page.locator('[data-testid="preview-mode-intensity"]').click();
  await page.locator('[data-testid="preview-mode-hologram"]').click();

  await expect(page.locator('[data-testid="preview-mode-hologram"]')).toHaveAttribute('aria-pressed', 'true');
  const restoredSum = await canvasChecksum(page);
  expect(restoredSum).toBe(hologramSum);
});

test('39. Toggle buttons are hidden when an imported hologram is active', async ({ page }) => {
  await page.goto('/');
  await page.waitForLoadState('domcontentloaded');

  // Confirm buttons are visible initially
  await expect(page.locator('[data-testid="preview-mode-hologram"]')).toBeVisible();

  // Create a minimal 4×4 greyscale PNG and import it
  const pngBytes = await page.evaluate(() => {
    // Minimal valid 4×4 greyscale PNG (hand-constructed)
    const w = 4, h = 4;
    const canvas = document.createElement('canvas');
    canvas.width = w; canvas.height = h;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#888';
    ctx.fillRect(0, 0, w, h);
    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(Array.from(new Uint8Array(e.target.result)));
        reader.readAsArrayBuffer(blob);
      }, 'image/png');
    });
  });

  const fileInput = page.locator('[data-testid="import-file-input"]');
  await fileInput.setInputFiles({
    name: 'test.png',
    mimeType: 'image/png',
    buffer: Buffer.from(pngBytes),
  });

  // After import, toggle should be hidden
  await page.waitForSelector('[data-testid="clear-import-button"]', { timeout: 3000 });
  await expect(page.locator('[data-testid="preview-mode-hologram"]')).not.toBeVisible();

  // After clearing import, toggle should reappear
  await page.locator('[data-testid="clear-import-button"]').click();
  await expect(page.locator('[data-testid="preview-mode-hologram"]')).toBeVisible();
});

test('41. Legend bar is visible by default and has data-mode="hologram"', async ({ page }) => {
  await page.goto('/');
  await page.waitForLoadState('domcontentloaded');

  const bar = page.locator('[data-testid="preview-legend-bar"]');
  await expect(bar).toBeVisible();
  await expect(bar).toHaveAttribute('data-mode', 'hologram');
});

test('42. Legend bar data-mode updates when switching view modes', async ({ page }) => {
  await page.goto('/');
  await page.waitForLoadState('domcontentloaded');

  const bar = page.locator('[data-testid="preview-legend-bar"]');

  await page.locator('[data-testid="preview-mode-phase"]').click();
  await expect(bar).toHaveAttribute('data-mode', 'phase');

  await page.locator('[data-testid="preview-mode-field"]').click();
  await expect(bar).toHaveAttribute('data-mode', 'field');

  await page.locator('[data-testid="preview-mode-intensity"]').click();
  await expect(bar).toHaveAttribute('data-mode', 'intensity');

  await page.locator('[data-testid="preview-mode-hologram"]').click();
  await expect(bar).toHaveAttribute('data-mode', 'hologram');

  // Legend must be hidden when import is active
  const pngBytes = await page.evaluate(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 4; canvas.height = 4;
    canvas.getContext('2d').fillStyle = '#888';
    canvas.getContext('2d').fillRect(0, 0, 4, 4);
    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(Array.from(new Uint8Array(e.target.result)));
        reader.readAsArrayBuffer(blob);
      }, 'image/png');
    });
  });
  await page.locator('[data-testid="import-file-input"]').setInputFiles({
    name: 'test.png', mimeType: 'image/png', buffer: Buffer.from(pngBytes),
  });
  await page.waitForSelector('[data-testid="clear-import-button"]', { timeout: 3000 });
  await expect(bar).not.toBeVisible();
});

test('40. Field mode shows intensity-weighted phase: coloured, distinct from Phase and Intensity alone', async ({ page }) => {
  await page.goto('/');
  await page.waitForLoadState('domcontentloaded');

  // LG l=1 has a vortex: zero intensity at centre, ring of intensity with 2π phase winding
  await addLGMode(page);
  await page.waitForTimeout(800);

  // Capture pure phase checksum
  await page.locator('[data-testid="preview-mode-phase"]').click();
  const phaseSum = await canvasChecksum(page);

  // Capture pure intensity checksum
  await page.locator('[data-testid="preview-mode-intensity"]').click();
  const intensitySum = await canvasChecksum(page);

  // Switch to Field
  await expect(page.locator('[data-testid="preview-mode-field"]')).toBeVisible();
  await page.locator('[data-testid="preview-mode-field"]').click();
  await expect(page.locator('[data-testid="preview-mode-field"]')).toHaveAttribute('aria-pressed', 'true');

  // Field must be coloured (phase hue applied)
  const hasColor = await canvasHasColor(page);
  expect(hasColor).toBe(true);

  // Field checksum must differ from pure phase (intensity modulates value → darker)
  const fieldSum = await canvasChecksum(page);
  expect(fieldSum).not.toBe(phaseSum);

  // Field checksum must differ from pure intensity (field has colour channels)
  expect(fieldSum).not.toBe(intensitySum);
});
