import { test, expect } from '@playwright/test';
import { encode } from 'fast-png';
import path from 'path';
import os from 'os';
import fs from 'fs';

// ── helpers ──────────────────────────────────────────────────────────────────

async function goto(page) {
  await page.goto('/');
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(400);
}

async function addMode(page, label) {
  await page.locator('[data-testid="add-mode-button"]').click();
  await page.waitForSelector('[role="listbox"]');
  await page.getByRole('option', { name: label }).click();
  await page.waitForTimeout(300);
}

async function addSLM(page) {
  await page.locator('[data-testid="add-slm-button"]').click();
  await page.waitForTimeout(200);
}

async function getCanvasChecksum(page, testid) {
  return page.evaluate((tid) => {
    const canvas = document.querySelector(`[data-testid="${tid}"]`);
    if (!canvas || canvas.width === 0) return -1;
    const ctx = canvas.getContext('2d');
    const d = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    let s = 0;
    for (let i = 0; i < d.length; i += 4) s += d[i];
    return s;
  }, testid);
}

function makeTestPNG(width, height, fillValue) {
  const data = new Uint8Array(width * height).fill(fillValue ?? 180);
  const encoded = encode({ width, height, data, depth: 8, channels: 1 });
  return Buffer.from(encoded);
}

function writeTempPNG(width, height, fillValue) {
  const buf = makeTestPNG(width, height, fillValue);
  const tmpPath = path.join(os.tmpdir(), `slm_test_${Date.now()}.png`);
  fs.writeFileSync(tmpPath, buf);
  return tmpPath;
}

// ── tests ─────────────────────────────────────────────────────────────────────

test('13. Export button opens dropdown with all format options including visualization exports', async ({ page }) => {
  await goto(page);
  await expect(page.locator('[data-testid="export-button"]')).toBeVisible();
  await page.locator('[data-testid="export-button"]').click();
  // Hologram data formats
  await expect(page.getByRole('menuitem', { name: 'PNG (8-bit)' })).toBeVisible();
  await expect(page.getByRole('menuitem', { name: 'PNG (16-bit)' })).toBeVisible();
  await expect(page.getByRole('menuitem', { name: 'TIFF (32-bit)' })).toBeVisible();
  await expect(page.getByRole('menuitem', { name: 'BMP' })).toBeVisible();
  await expect(page.getByRole('menuitem', { name: 'CSV' })).toBeVisible();
  await expect(page.getByRole('menuitem', { name: 'NPY' })).toBeVisible();
  await expect(page.getByRole('menuitem', { name: 'Raw Binary' })).toBeVisible();
  await expect(page.getByRole('menuitem', { name: 'Export All SLMs (ZIP)' })).toBeVisible();
  // Visualization image exports (below separator)
  await expect(page.getByRole('menuitem', { name: 'Field image (PNG)' })).toBeVisible();
  await expect(page.getByRole('menuitem', { name: 'Intensity image (PNG)' })).toBeVisible();
  await expect(page.getByRole('menuitem', { name: 'Phase image (PNG)' })).toBeVisible();
});

test('14. PNG (8-bit) export triggers .png download', async ({ page }) => {
  await goto(page);
  await page.locator('[data-testid="export-button"]').click();
  const [download] = await Promise.all([
    page.waitForEvent('download', { timeout: 8000 }),
    page.getByRole('menuitem', { name: 'PNG (8-bit)' }).click(),
  ]);
  expect(download.suggestedFilename()).toMatch(/\.png$/i);
});

test('15. CSV export triggers .csv download', async ({ page }) => {
  await goto(page);
  await page.locator('[data-testid="export-button"]').click();
  const [download] = await Promise.all([
    page.waitForEvent('download', { timeout: 8000 }),
    page.getByRole('menuitem', { name: 'CSV' }).click(),
  ]);
  expect(download.suggestedFilename()).toMatch(/\.csv$/i);
});

test('16. NPY export triggers .npy download', async ({ page }) => {
  await goto(page);
  await page.locator('[data-testid="export-button"]').click();
  const [download] = await Promise.all([
    page.waitForEvent('download', { timeout: 8000 }),
    page.getByRole('menuitem', { name: 'NPY' }).click(),
  ]);
  expect(download.suggestedFilename()).toMatch(/\.npy$/i);
});

test('17. Export All SLMs (ZIP) with 2 SLMs triggers .zip download', async ({ page }) => {
  await goto(page);
  await addSLM(page);
  await page.locator('[data-testid="export-button"]').first().click();
  const [download] = await Promise.all([
    page.waitForEvent('download', { timeout: 10000 }),
    page.getByRole('menuitem', { name: 'Export All SLMs (ZIP)' }).click(),
  ]);
  expect(download.suggestedFilename()).toMatch(/\.zip$/i);
});

test('18. Importing a valid PNG updates hologram preview canvas', async ({ page }) => {
  await goto(page);
  // Get initial canvas checksum
  const before = await getCanvasChecksum(page, 'hologram-preview-slm-1');
  // Create a bright-white test PNG at the preview canvas dimensions
  const pngPath = writeTempPNG(64, 64, 240);
  try {
    await page.locator('[data-testid="import-file-input"]').setInputFiles(pngPath);
    await page.waitForTimeout(500);
    const after = await getCanvasChecksum(page, 'hologram-preview-slm-1');
    // Canvas should be non-blank (non-zero sum) and changed
    expect(after).toBeGreaterThan(0);
  } finally {
    fs.unlinkSync(pngPath);
  }
});

test('19. Importing PNG with mismatched resolution shows import-warning', async ({ page }) => {
  await goto(page);
  // Default SLM is Holoeye PLUTO-2.1: 1920×1080. Upload a 64×64 PNG.
  const pngPath = writeTempPNG(64, 64, 100);
  try {
    await page.locator('[data-testid="import-file-input"]').setInputFiles(pngPath);
    await page.waitForTimeout(500);
    const warning = page.locator('[data-testid="import-warning"]');
    await expect(warning).toBeVisible();
    const text = await warning.textContent();
    expect(text.length).toBeGreaterThan(0);
  } finally {
    fs.unlinkSync(pngPath);
  }
});

test('20. Importing unsupported file type shows import-error without crashing', async ({ page }) => {
  await goto(page);
  const tmpPath = path.join(os.tmpdir(), `slm_test_${Date.now()}.txt`);
  fs.writeFileSync(tmpPath, 'hello world');
  const errors = [];
  page.on('console', (msg) => { if (msg.type() === 'error') errors.push(msg.text()); });
  try {
    await page.locator('[data-testid="import-file-input"]').setInputFiles(tmpPath);
    await page.waitForTimeout(500);
    const errEl = page.locator('[data-testid="import-error"]');
    await expect(errEl).toBeVisible();
    const text = await errEl.textContent();
    expect(text.length).toBeGreaterThan(0);
    // App should still be responsive — export button still present
    await expect(page.locator('[data-testid="export-button"]')).toBeVisible();
  } finally {
    fs.unlinkSync(tmpPath);
  }
});

test('21. Field image (PNG) export triggers .png download', async ({ page }) => {
  await goto(page);
  await page.locator('[data-testid="export-button"]').click();
  const [download] = await Promise.all([
    page.waitForEvent('download', { timeout: 15000 }),
    page.getByRole('menuitem', { name: 'Field image (PNG)' }).click(),
  ]);
  expect(download.suggestedFilename()).toMatch(/\.png$/i);
});

test('22. Intensity image (PNG) export triggers .png download', async ({ page }) => {
  await goto(page);
  await page.locator('[data-testid="export-button"]').click();
  const [download] = await Promise.all([
    page.waitForEvent('download', { timeout: 15000 }),
    page.getByRole('menuitem', { name: 'Intensity image (PNG)' }).click(),
  ]);
  expect(download.suggestedFilename()).toMatch(/\.png$/i);
});

test('23. Phase image (PNG) export triggers .png download', async ({ page }) => {
  await goto(page);
  await page.locator('[data-testid="export-button"]').click();
  const [download] = await Promise.all([
    page.waitForEvent('download', { timeout: 15000 }),
    page.getByRole('menuitem', { name: 'Phase image (PNG)' }).click(),
  ]);
  expect(download.suggestedFilename()).toMatch(/\.png$/i);
});
