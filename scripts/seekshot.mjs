import puppeteer from 'puppeteer-core';

const EXE =
  process.env.CHROME_PATH ||
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const url = process.argv[2] || 'http://localhost:4181/ravan-vadh/';
const outPng = process.argv[3] || 'scripts/seek.png';
const sceneIndex = Number(process.argv[4] || 4);
const useUltra = process.argv[5] === 'ultra';
const settleMs = Number(process.argv[6] || 15000);

const logs = [];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

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

try {
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 720, deviceScaleFactor: 1 });
  page.on('console', (m) => logs.push(`[${m.type()}] ${m.text()}`));
  page.on('pageerror', (e) => logs.push(`[PAGEERROR] ${e.message}`));

  await page
    .goto(url, { waitUntil: 'networkidle2', timeout: 30000 })
    .catch((e) => logs.push(`[NAV] ${e.message}`));
  await sleep(1200);

  await page.evaluate(() => {
    const btn = [...document.querySelectorAll('button')].find((b) =>
      /Start Cinematic/i.test(b.textContent || '')
    );
    btn && btn.click();
  });
  await sleep(1500); // let it enter 'playing' so playback is bound

  if (useUltra) {
    await page.mouse.move(640, 360);
    await sleep(250);
    await page.evaluate(() => {
      const b = document.querySelector('button[title*="Ultra View"]');
      b && b.click();
    });
    await sleep(400);
  }

  const seeked = await page.evaluate((arg) => {
    if (!window.__playback) return 'NO __playback';
    if (String(arg).includes('.')) {
      window.__playback.scrubTo(parseFloat(arg));
      return `scrubbed to ${arg}, time=${window.__playback.time.toFixed(2)}`;
    }
    window.__playback.seekScene(arg, { play: false });
    return `seeked scene ${arg}, time=${window.__playback.time.toFixed(2)}`;
  }, sceneIndex);
  logs.push(`[SEEK] ${seeked}`);

  // Let the camera damp toward the new track target (slow under software GL).
  await sleep(settleMs);

  const info = await page.evaluate(() => ({
    body: (document.body.innerText || '').replace(/\s+/g, ' ').slice(0, 200),
    time: window.__playback ? window.__playback.time.toFixed(2) : null,
  }));
  logs.push(`[INFO] ${JSON.stringify(info)}`);

  await page.screenshot({ path: outPng });
  logs.push(`[SHOT] ${outPng}`);
} catch (e) {
  logs.push(`[FATAL] ${e.message}`);
} finally {
  await browser.close();
}

console.log(logs.join('\n'));
