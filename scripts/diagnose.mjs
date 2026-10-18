import puppeteer from 'puppeteer-core';

const EXE =
  process.env.CHROME_PATH ||
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const url = process.argv[2] || 'http://localhost:4180/ravan-vadh/';
const outPrefix = process.argv[3] || 'scripts/diag';
const standardWait = Number(process.argv[4] || 11500); // reach a character scene
const ultraWait = Number(process.argv[5] || 3200);

const logs = [];

const browser = await puppeteer.launch({
  executablePath: EXE,
  headless: 'new',
  args: [
    '--use-gl=angle',
    '--use-angle=swiftshader',
    '--enable-webgl',
    '--ignore-gpu-blocklist',
    '--enable-unsafe-swiftshader',
    '--no-sandbox',
    '--disable-gpu-sandbox',
  ],
});

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

try {
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 720, deviceScaleFactor: 1 });

  page.on('console', (m) => logs.push(`[${m.type()}] ${m.text()}`));
  page.on('pageerror', (e) => logs.push(`[PAGEERROR] ${e.message}`));
  page.on('requestfailed', (r) =>
    logs.push(`[REQFAIL] ${r.url()} :: ${r.failure()?.errorText}`)
  );

  await page
    .goto(url, { waitUntil: 'networkidle2', timeout: 30000 })
    .catch((e) => logs.push(`[NAV] ${e.message}`));

  await sleep(1200);

  const clicked = await page.evaluate(() => {
    const btn = [...document.querySelectorAll('button')].find((b) =>
      /Start Cinematic/i.test(b.textContent || '')
    );
    if (btn) {
      btn.click();
      return true;
    }
    return false;
  });
  logs.push(`[START] clicked=${clicked}`);

  // ---- Standard view: wait until we reach a character scene ----
  await sleep(standardWait);
  const stateStd = await sceneState(page);
  logs.push(`[STD] ${JSON.stringify(stateStd)}`);
  await page.screenshot({ path: `${outPrefix}_standard.png` });
  logs.push(`[SHOT] ${outPrefix}_standard.png`);

  // ---- Toggle Ultra View (reveals HUD, then clicks the chip) ----
  await page.mouse.move(640, 360); // reveal HUD
  await sleep(300);
  const ultraClicked = await page.evaluate(() => {
    const btn = document.querySelector('button[title*="Ultra View"]');
    if (btn) {
      btn.click();
      return btn.textContent.trim();
    }
    return null;
  });
  logs.push(`[ULTRA] toggled -> chip="${ultraClicked}"`);

  await sleep(ultraWait);
  const stateUltra = await sceneState(page);
  logs.push(`[ULTRA] ${JSON.stringify(stateUltra)}`);
  await page.screenshot({ path: `${outPrefix}_ultra.png` });
  logs.push(`[SHOT] ${outPrefix}_ultra.png`);
} catch (e) {
  logs.push(`[FATAL] ${e.message}`);
} finally {
  await browser.close();
}

console.log(logs.join('\n'));

async function sceneState(page) {
  return page.evaluate(() => {
    const c = document.querySelector('canvas');
    const chip = document.querySelector('button[title*="Ultra View"]');
    const sceneTitle = document.querySelector('.scene-title__en');
    const gl = c ? c.getContext('webgl2') || c.getContext('webgl') : null;
    return {
      scene: sceneTitle ? sceneTitle.textContent : null,
      chip: chip ? chip.textContent.trim() : null,
      buf: c ? `${c.width}x${c.height}` : 'none',
      context: gl ? 'yes' : 'no',
    };
  });
}
