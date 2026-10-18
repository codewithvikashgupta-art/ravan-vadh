import puppeteer from 'puppeteer-core';

const EXE =
  process.env.CHROME_PATH ||
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const url = process.argv[2] || 'http://localhost:4181/ravan-vadh/';
const outPng = process.argv[3] || 'scripts/character.png';
const targetScene = Number(process.argv[4] || 2); // wait until we reach this scene
const timeoutMs = Number(process.argv[5] || 60000);

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

  // Poll the scene until we reach the target scene (or timeout).
  const deadline = Date.now() + timeoutMs;
  let last = null;
  let reached = null;
  let tick = 0;
  while (Date.now() < deadline) {
    const s = await page.evaluate(() => {
      const t = document.querySelector('.scene-title__en');
      const n = document.querySelector('.scene-title__no'); // fallback selectors
      const counter = document.querySelector('.scene-count, .scene-index, .chip--scene');
      return {
        title: t ? t.textContent : null,
        counter: counter ? counter.textContent : null,
        progress: document.querySelector('.progress__fill')
          ? document.querySelector('.progress__fill').style.width
          : null,
      };
    });
    if (JSON.stringify(s) !== last) {
      logs.push(`[T+${((Date.now() - (deadline - timeoutMs)) / 1000).toFixed(1)}s] ${JSON.stringify(s)}`);
      last = JSON.stringify(s);
    }
    // Detect reaching target scene via "Scene X / 12" text anywhere
    const sceneNum = await page.evaluate(() => {
      const m = (document.body.innerText || '').match(/Scene\s*(\d+)\s*\/\s*12/i);
      return m ? Number(m[1]) : 1;
    });
    if (sceneNum >= targetScene) {
      reached = sceneNum;
      break;
    }
    tick++;
    await sleep(700);
  }

  logs.push(`[REACHED] scene=${reached} (target ${targetScene}) ticks=${tick}`);
  await sleep(1500); // let the scene settle into its shot
  const final = await page.evaluate(() => ({
    body: (document.body.innerText || '').replace(/\s+/g, ' ').slice(0, 220),
  }));
  logs.push(`[BODY] ${final.body}`);
  await page.screenshot({ path: outPng });
  logs.push(`[SHOT] ${outPng}`);
} catch (e) {
  logs.push(`[FATAL] ${e.message}`);
} finally {
  await browser.close();
}

console.log(logs.join('\n'));
