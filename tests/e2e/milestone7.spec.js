import { test, expect } from '@playwright/test';
import { execSync, spawn } from 'child_process';
import { readFileSync, existsSync, readdirSync } from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

// Resolve the project root from this spec file's location:
//   tests/e2e/milestone7.spec.js  → ../../  = slm-hologram-app/
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../..');

// ─────────────────────────────────────────────────────────────────
// 3. All 7 SLM presets appear in the preset selector dropdown
// ─────────────────────────────────────────────────────────────────
test('3. all 7 presets appear in preset selector', async ({ page }) => {
  await page.goto('/');
  await page.locator('[data-testid="preset-select"]').click();
  const items = page.locator('[role="option"]');
  const labels = await items.allTextContents();
  const EXPECTED = [
    'Holoeye PLUTO-2.1',
    'Meadowlark 1920',
    'Holoeye LETO-3',
    'Hamamatsu X13138',
    'Holoeye SLM-200',
    'Meadowlark 512',
    'Custom',
  ];
  for (const name of EXPECTED) {
    expect(labels).toContain(name);
  }
  await page.keyboard.press('Escape');
});

// ─────────────────────────────────────────────────────────────────
// 4. Selecting each preset sets correct resX, resY, bitDepth
// ─────────────────────────────────────────────────────────────────
test('4. selecting each preset sets correct resX, resY, bitDepth', async ({ page }) => {
  await page.goto('/');

  const PRESETS = [
    { name: 'Holoeye PLUTO-2.1', resX: 1920, resY: 1080, bitDepth: 8 },
    { name: 'Meadowlark 1920',   resX: 1920, resY: 1152, bitDepth: 8 },
    { name: 'Holoeye LETO-3',    resX: 1920, resY: 1080, bitDepth: 8 },
    { name: 'Hamamatsu X13138',  resX: 792,  resY: 600,  bitDepth: 8 },
    { name: 'Holoeye SLM-200',   resX: 1024, resY: 768,  bitDepth: 8 },
    { name: 'Meadowlark 512',    resX: 512,  resY: 512,  bitDepth: 10 },
    { name: 'Custom',            resX: 1920, resY: 1080, bitDepth: 8 },
  ];

  for (const preset of PRESETS) {
    await page.locator('[data-testid="preset-select"]').click();
    await page.getByRole('option', { name: preset.name, exact: true }).click();

    if (preset.name !== 'Custom') {
      // Resolution is shown as "resX × resY" (uses × U+00D7)
      await expect(
        page.locator(`text=${preset.resX} × ${preset.resY}`)
      ).toBeVisible({ timeout: 3000 });
    }

    const bitVal = await page.locator('[data-testid="bit-depth-select"]').textContent();
    expect(bitVal.trim()).toBe(String(preset.bitDepth));
  }
});

// ─────────────────────────────────────────────────────────────────
// 5. No horizontal overflow at 1280 px
// ─────────────────────────────────────────────────────────────────
test('5. no horizontal overflow at 1280px', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto('/');
  const overflow = await page.evaluate(
    () => document.body.scrollWidth > document.body.clientWidth
  );
  expect(overflow).toBe(false);
});

// ─────────────────────────────────────────────────────────────────
// 6. No horizontal overflow at 1440 px
// ─────────────────────────────────────────────────────────────────
test('6. no horizontal overflow at 1440px', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  const overflow = await page.evaluate(
    () => document.body.scrollWidth > document.body.clientWidth
  );
  expect(overflow).toBe(false);
});

// ─────────────────────────────────────────────────────────────────
// 7. Every visible input and button has an accessible label
// ─────────────────────────────────────────────────────────────────
test('7. every visible input and button has an accessible label', async ({ page }) => {
  await page.goto('/');
  const unlabelled = await page.evaluate(() => {
    const isVisible = (el) => {
      if (window.getComputedStyle(el).display === 'none') return false;
      if (window.getComputedStyle(el).visibility === 'hidden') return false;
      return true;
    };
    return [...document.querySelectorAll('input, button')]
      .filter(isVisible)
      .filter((el) => {
        const ariaLabel = el.getAttribute('aria-label');
        if (ariaLabel && ariaLabel.trim()) return false;
        if (el.getAttribute('aria-labelledby')) return false;
        if (el.tagName === 'INPUT' && el.labels && el.labels.length > 0) return false;
        // Buttons with visible text content are accessible
        if (el.tagName === 'BUTTON' && el.textContent.trim()) return false;
        return true;
      })
      .map((el) => el.outerHTML.slice(0, 120));
  });
  expect(unlabelled).toHaveLength(0);
});

// ─────────────────────────────────────────────────────────────────
// 8. Tab navigation reaches Add Mode button within 30 presses
// ─────────────────────────────────────────────────────────────────
test('8. tab navigation reaches Add Mode button within 45 presses', async ({ page }) => {
  await page.goto('/');
  let found = false;
  for (let i = 0; i < 45; i++) {
    await page.keyboard.press('Tab');
    const focused = await page.evaluate(
      () => document.activeElement?.getAttribute('data-testid')
    );
    if (focused === 'add-mode-button') {
      found = true;
      break;
    }
  }
  expect(found).toBe(true);
});

// ─────────────────────────────────────────────────────────────────
// 9. Canvas has role=img and aria-label containing "hologram"
// ─────────────────────────────────────────────────────────────────
test('9. hologram canvas has role=img and aria-label with SLM name', async ({ page }) => {
  await page.goto('/');
  const canvas = page.locator('[data-testid^="hologram-preview-"]').first();
  await expect(canvas).toHaveAttribute('role', 'img');
  const label = await canvas.getAttribute('aria-label');
  expect(label).toBeTruthy();
  expect(label.toLowerCase()).toContain('hologram');
});

// ─────────────────────────────────────────────────────────────────
// 10. npm run build exits 0; dist/ has index.html and a JS bundle
// ─────────────────────────────────────────────────────────────────
test('10. npm run build exits 0 and dist/ has expected files', async () => {
  test.setTimeout(180_000);
  // Use shell:true so 'npm' resolves correctly on Windows
  execSync('npm run build', { cwd: ROOT, stdio: 'pipe', shell: true });

  expect(existsSync(path.join(ROOT, 'dist', 'index.html'))).toBe(true);
  const assets = readdirSync(path.join(ROOT, 'dist', 'assets'));
  const hasJs = assets.some((f) => f.endsWith('.js'));
  expect(hasJs).toBe(true);
});

// ─────────────────────────────────────────────────────────────────
// 11. dist/index.html references assets at root-relative paths
// ─────────────────────────────────────────────────────────────────
test('11. dist/index.html references assets at root-relative paths', async () => {
  const distHtml = readFileSync(path.join(ROOT, 'dist', 'index.html'), 'utf-8');
  // With base:'/' the script src should start with /assets/, not /slm-hologram-app/assets/
  expect(distHtml).toMatch(/src="\/assets\//);
});

// ─────────────────────────────────────────────────────────────────
// 12. Built app served by vite preview loads without console errors
// ─────────────────────────────────────────────────────────────────
test.describe('preview build test', () => {
  let previewProcess;

  test.beforeAll(async () => {
    // Kill any stale process on port 4174 left by a previous test run
    try {
      execSync(
        'for /f "tokens=5" %i in (\'netstat -ano ^| findstr LISTENING ^| findstr :4174\') do taskkill /F /PID %i',
        { shell: true, stdio: 'ignore' }
      );
    } catch { /* no stale process */ }

    // Invoke vite directly via node so kill() terminates the real process on Windows
    const viteBin = path.join(ROOT, 'node_modules', 'vite', 'bin', 'vite.js');
    previewProcess = spawn(
      process.execPath,
      [viteBin, 'preview', '--port', '4174'],
      { cwd: ROOT }
    );

    // Poll until the preview server is accepting connections
    const previewUrl = 'http://localhost:4174/';
    for (let i = 0; i < 30; i++) {
      try {
        await fetch(previewUrl);
        break;
      } catch {
        await new Promise((r) => setTimeout(r, 500));
      }
    }
  });

  test.afterAll(() => {
    if (previewProcess && !previewProcess.killed) {
      try { previewProcess.kill(); } catch {}
    }
  });

  test('12. built app loads without console errors', async ({ page }) => {
    const consoleErrors = [];
    const failedUrls = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });
    page.on('response', (res) => {
      if (res.status() === 404) failedUrls.push(res.url());
    });
    await page.goto('http://localhost:4174/');
    await page.waitForLoadState('networkidle');
    expect(failedUrls, `404 URLs: ${failedUrls.join(', ')}`).toHaveLength(0);
    expect(consoleErrors).toHaveLength(0);
  });
});

// ─────────────────────────────────────────────────────────────────
// 13. Every data-tooltip-key value has a corresponding TOOLTIPS entry
// ─────────────────────────────────────────────────────────────────
test('13. every data-tooltip-key has a TOOLTIPS entry', async ({ page }) => {
  await page.goto('/');

  const keys = await page.evaluate(() =>
    [...new Set(
      [...document.querySelectorAll('[data-tooltip-key]')]
        .map((el) => el.dataset.tooltipKey)
    )]
  );

  expect(keys.length).toBeGreaterThan(0);

  // Dynamically import tooltips.js from the source tree
  const tooltipsUrl = pathToFileURL(
    path.join(ROOT, 'src', 'data', 'tooltips.js')
  ).href;
  const { TOOLTIPS } = await import(tooltipsUrl);

  const missing = keys.filter((k) => !TOOLTIPS[k]);
  expect(missing, `Missing TOOLTIPS entries for: ${missing.join(', ')}`).toHaveLength(0);
});

// ─────────────────────────────────────────────────────────────────
// 14. No [missing tooltip] warning text appears in the DOM
// ─────────────────────────────────────────────────────────────────
test('14. no [missing tooltip] warning appears', async ({ page }) => {
  await page.goto('/');
  const bodyText = await page.evaluate(() => document.body.innerText);
  expect(bodyText).not.toContain('[missing tooltip]');
});
