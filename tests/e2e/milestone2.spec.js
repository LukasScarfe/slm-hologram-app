import { test, expect } from '@playwright/test';

// --- helpers ---

/** Sum of all R+G+B values across the canvas — changes whenever any pixel changes */
async function getCanvasChecksum(page) {
  return page.evaluate(() => {
    // testid is hologram-preview-<slmId>, so match by prefix
    const canvas = document.querySelector('[data-testid^="hologram-preview-"]');
    if (!canvas || canvas.width === 0 || canvas.height === 0) return -1;
    const ctx = canvas.getContext('2d');
    const d = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    let s = 0;
    for (let i = 0; i < d.length; i += 4) s += d[i] + d[i + 1] + d[i + 2];
    return s;
  });
}

async function waitForChecksumChange(page, before, timeout = 5000) {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    const after = await getCanvasChecksum(page);
    if (after !== before && after !== -1) return after;
    await page.waitForTimeout(150);
  }
  throw new Error(`Canvas checksum did not change (stuck at ${before})`);
}

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

async function setSliderValue(page, sliderTestId, value, min, max) {
  const root = page.locator(`[data-testid="${sliderTestId}"]`).first();
  const box = await root.boundingBox();
  const fraction = Math.max(0, Math.min(1, (value - min) / (max - min)));
  await page.mouse.click(box.x + fraction * box.width, box.y + box.height / 2);
  await page.waitForTimeout(100);
}

// --- tests ---

test('12. App loads without console errors; title is "SLM Hologram Studio"', async ({ page }) => {
  const errors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  await page.goto('/');
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(500);
  // Exclude known benign network errors (font loading etc.)
  const jsErrors = errors.filter(
    (e) => !e.includes('favicon') && !e.includes('fonts.googleapis') && !e.includes('net::ERR')
  );
  expect(jsErrors).toHaveLength(0);
  await expect(page).toHaveTitle('SLM Hologram Studio');
});

test('13. Preset selector is visible', async ({ page }) => {
  await page.goto('/');
  await page.waitForLoadState('domcontentloaded');
  await expect(page.locator('[data-testid="preset-select"]')).toBeVisible();
});

test('14. Selecting Meadowlark 1920 updates resolution to 1920 × 1152', async ({ page }) => {
  await page.goto('/');
  await page.waitForLoadState('domcontentloaded');
  await selectFromRadix(page, 'preset-select', 'Meadowlark 1920');
  await expect(page.locator('text=1920 × 1152')).toBeVisible();
});

test('15. Adding Laguerre-Gaussian mode creates mode-card-0', async ({ page }) => {
  await page.goto('/');
  await page.waitForLoadState('domcontentloaded');
  await addLGMode(page);
  await expect(page.locator('[data-testid="mode-card-0"]')).toBeVisible();
});

test('16. LG mode card contains sliders labelled l and p', async ({ page }) => {
  await page.goto('/');
  await page.waitForLoadState('domcontentloaded');
  await addLGMode(page);
  await expect(page.locator('[data-testid="lg-l-slider"]')).toBeVisible();
  await expect(page.locator('[data-testid="lg-p-slider"]')).toBeVisible();
});

test('17. Dragging l slider from 0 to 2 updates displayed value to 2', async ({ page }) => {
  await page.goto('/');
  await page.waitForLoadState('domcontentloaded');
  await addLGMode(page);
  const thumb = page.locator('[data-testid="lg-l-slider"] [role="slider"]');
  await expect(thumb).toHaveAttribute('aria-valuenow', '0');
  // Click at 60% of slider → value=2 (range -10 to 10, step=1)
  await setSliderValue(page, 'lg-l-slider', 2, -10, 10);
  await page.waitForTimeout(200);
  await expect(thumb).toHaveAttribute('aria-valuenow', '2');
});

test('18. Hologram preview canvas is present with width > 0 and height > 0', async ({ page }) => {
  await page.goto('/');
  await page.waitForLoadState('domcontentloaded');
  // testid is hologram-preview-<slmId>
  const canvas = page.locator('[data-testid^="hologram-preview-"]').first();
  await expect(canvas).toBeVisible();
  const w = await canvas.evaluate((el) => el.width);
  const h = await canvas.evaluate((el) => el.height);
  expect(w).toBeGreaterThan(0);
  expect(h).toBeGreaterThan(0);
});

test('19. After adding LG mode, canvas becomes non-blank', async ({ page }) => {
  await page.goto('/');
  await page.waitForLoadState('domcontentloaded');
  // Wait for initial render (no modes → flat grey canvas)
  await page.waitForTimeout(700);
  const before = await getCanvasChecksum(page);
  await addLGMode(page);
  // Wait for worker to compute hologram; checksum should change
  await waitForChecksumChange(page, before);
  expect(true).toBe(true); // reached here = canvas changed
});

test('20. Mode weight slider has initial value 1.0; changing to 0.5 triggers recompute', async ({ page }) => {
  await page.goto('/');
  await page.waitForLoadState('domcontentloaded');
  // Add LG mode (l=0 default), then set l=2 to make it a vortex beam
  await addLGMode(page);
  await setSliderValue(page, 'lg-l-slider', 2, -10, 10);
  await page.waitForTimeout(200);
  // Add a second LG mode (l=0) — two distinct modes so weight ratio matters
  await page.locator('[data-testid="add-mode-button"]').click();
  await page.waitForSelector('[role="listbox"]');
  await page.getByRole('option', { name: 'Laguerre-Gaussian' }).click();
  await page.waitForSelector('[data-testid="mode-card-1"]');
  // Verify initial weight of mode-0 is 1.0
  const thumb = page.locator('[data-testid="mode-card-0"] [data-testid="mode-weight-slider"] [role="slider"]');
  await expect(thumb).toHaveAttribute('aria-valuenow', '1');
  await page.waitForTimeout(800);
  const before = await getCanvasChecksum(page);
  // Set weight of mode-0 to 0.5 via number input — changes relative balance of LG(l=2) vs LG(l=0)
  const weightInput = page.locator('[data-testid="mode-card-0"]').locator('[data-testid="mode-weight-input"]');
  await weightInput.fill('0.5');
  await weightInput.press('Enter');
  await waitForChecksumChange(page, before);
  expect(true).toBe(true);
});

test('21. Phase offset input starts at 0; setting to 3.14159 triggers recompute', async ({ page }) => {
  await page.goto('/');
  await page.waitForLoadState('domcontentloaded');
  await addLGMode(page);
  const phaseInput = page.locator('[data-testid="mode-phase-offset"]');
  await expect(phaseInput).toHaveValue('0');
  await page.waitForTimeout(700);
  const before = await getCanvasChecksum(page);
  await phaseInput.fill('3.14159');
  await phaseInput.press('Enter');
  // Phase offset of π changes the hologram phase pattern for all pixels
  await waitForChecksumChange(page, before);
  expect(true).toBe(true);
});

test('22. Adding two modes creates mode-card-0 and mode-card-1', async ({ page }) => {
  await page.goto('/');
  await page.waitForLoadState('domcontentloaded');
  await addLGMode(page);
  await page.locator('[data-testid="add-mode-button"]').click();
  await page.waitForSelector('[role="listbox"]');
  await page.getByRole('option', { name: 'Hermite-Gaussian' }).click();
  await expect(page.locator('[data-testid="mode-card-0"]')).toBeVisible();
  await expect(page.locator('[data-testid="mode-card-1"]')).toBeVisible();
});

test('23. Toggling mode enable checkbox changes canvas', async ({ page }) => {
  await page.goto('/');
  await page.waitForLoadState('domcontentloaded');
  await addLGMode(page);
  await page.waitForTimeout(700);
  const before = await getCanvasChecksum(page);
  // Disabling the only mode → canvas goes dark grey
  await page.locator('[data-testid="mode-enable-0"]').click();
  await waitForChecksumChange(page, before);
  expect(true).toBe(true);
});

test('24. Gamma input has initial value 255; changing to 200 triggers recompute', async ({ page }) => {
  await page.goto('/');
  await page.waitForLoadState('domcontentloaded');
  await addLGMode(page);
  const gammaInput = page.locator('[data-testid="gamma-input"]');
  await expect(gammaInput).toHaveValue('255');
  await page.waitForTimeout(700);
  const before = await getCanvasChecksum(page);
  await gammaInput.fill('200');
  await gammaInput.press('Enter');
  // Gamma=200 vs 255 shifts grey levels → brightness changes in rendering
  await waitForChecksumChange(page, before);
  expect(true).toBe(true);
});

test('25. Setting gamma to 300 on 8-bit SLM clamps to 255', async ({ page }) => {
  await page.goto('/');
  await page.waitForLoadState('domcontentloaded');
  const gammaInput = page.locator('[data-testid="gamma-input"]');
  await gammaInput.fill('300');
  await gammaInput.press('Enter');
  await page.waitForTimeout(200);
  await expect(gammaInput).toHaveValue('255');
});

test('26. Setting gamma to 0 clamps to 1', async ({ page }) => {
  await page.goto('/');
  await page.waitForLoadState('domcontentloaded');
  const gammaInput = page.locator('[data-testid="gamma-input"]');
  await gammaInput.fill('0');
  await gammaInput.press('Enter');
  await page.waitForTimeout(200);
  await expect(gammaInput).toHaveValue('1');
});

test('27. Grating fx and fy inputs present; changing fx triggers recompute', async ({ page }) => {
  await page.goto('/');
  await page.waitForLoadState('domcontentloaded');
  await addLGMode(page);
  await expect(page.locator('[data-testid="grating-fx"]')).toBeVisible();
  await expect(page.locator('[data-testid="grating-fy"]')).toBeVisible();
  await page.waitForTimeout(700);
  const before = await getCanvasChecksum(page);
  await page.locator('[data-testid="grating-fx"]').fill('0.5');
  await page.locator('[data-testid="grating-fx"]').press('Enter');
  // Grating carrier changes Psi pattern throughout the canvas
  await waitForChecksumChange(page, before);
  expect(true).toBe(true);
});

test('28. Bit depth selector has 8 and 10 options; selecting 10 updates gamma max to 1023', async ({ page }) => {
  await page.goto('/');
  await page.waitForLoadState('domcontentloaded');
  await page.locator('[data-testid="bit-depth-select"]').click();
  await page.waitForSelector('[role="listbox"]');
  const options = await page.getByRole('option').allTextContents();
  expect(options).toContain('8');
  expect(options).toContain('10');
  await page.getByRole('option', { name: '10' }).click();
  await page.waitForTimeout(200);
  const gammaInput = page.locator('[data-testid="gamma-input"]');
  await expect(gammaInput).toHaveAttribute('max', '1023');
});

test('29. Encoding method selector is not present (encoding is always exact)', async ({ page }) => {
  await page.goto('/');
  await page.waitForLoadState('domcontentloaded');
  const encSelect = page.locator('[data-testid="encoding-method-select"]');
  await expect(encSelect).not.toBeVisible();
});

test('30. Hovering gamma label shows tooltip with non-empty text', async ({ page }) => {
  await page.goto('/');
  await page.waitForLoadState('domcontentloaded');
  await page.locator('[data-testid="gamma-label"]').hover();
  await page.waitForTimeout(400);
  const tooltip = page.locator('[role="tooltip"]');
  await expect(tooltip).toBeVisible();
  const text = await tooltip.textContent();
  expect(text.trim().length).toBeGreaterThan(0);
});

test('31. Hovering mode-weight-label shows tooltip containing "superposition"', async ({ page }) => {
  await page.goto('/');
  await page.waitForLoadState('domcontentloaded');
  await addLGMode(page);
  await page.locator('[data-testid="mode-weight-label"]').hover();
  await page.waitForTimeout(400);
  const tooltip = page.locator('[role="tooltip"]');
  await expect(tooltip).toBeVisible();
  await expect(tooltip).toContainText('superposition');
});

test('32. Hovering grating-fx-label shows tooltip containing "diffraction"', async ({ page }) => {
  await page.goto('/');
  await page.waitForLoadState('domcontentloaded');
  await page.locator('[data-testid="grating-fx-label"]').hover();
  await page.waitForTimeout(400);
  const tooltip = page.locator('[role="tooltip"]');
  await expect(tooltip).toBeVisible();
  await expect(tooltip).toContainText('diffraction');
});

test('33. Encoding method label is not present in the config UI', async ({ page }) => {
  await page.goto('/');
  await page.waitForLoadState('domcontentloaded');
  const encLabel = page.locator('[data-testid="encoding-method-label"]');
  await expect(encLabel).not.toBeVisible();
});
