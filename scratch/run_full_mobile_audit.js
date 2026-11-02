const fs = require('fs');
const path = require('path');
const http = require('http');
const { spawn } = require('child_process');
const { chromium } = require('../CarRepairShop/node_modules/playwright');

const SCREENSHOTS_DIR = 'C:/Users/ASUS TUF GAMING F15/.gemini/antigravity/brain/c242c333-d6e5-40c5-8918-1e3c89d5a8e3/audit_screenshots';
if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

const VIEWPORTS = [
  { name: 'phone-320', width: 320, height: 568 },
  { name: 'phone-360', width: 360, height: 800 },
  { name: 'phone-375', width: 375, height: 812 },
  { name: 'phone-390', width: 390, height: 844 },
  { name: 'phone-414', width: 414, height: 896 },
  { name: 'tablet-768', width: 768, height: 1024 },
  { name: 'desktop-1440', width: 1440, height: 900 }
];

const ROUTES = [
  { path: '/login', name: 'Login Page', auth: false },
  { path: '/admin/dashboard', name: 'Admin Dashboard', auth: true },
  { path: '/mechanic/dashboard', name: 'Mechanic Dashboard', auth: true },
  { path: '/appointments', name: 'Appointments Page', auth: true },
  { path: '/repair-jobs', name: 'Repair Jobs Page', auth: true },
  { path: '/customers', name: 'Customers Page', auth: true },
  { path: '/vehicles', name: 'Vehicles Page', auth: true },
  { path: '/inventory', name: 'Inventory Page', auth: true },
  { path: '/suppliers', name: 'Suppliers Page', auth: true },
  { path: '/services', name: 'Services Page', auth: true },
  { path: '/mechanics', name: 'Mechanics Page', auth: true },
  { path: '/invoices', name: 'Invoices Page', auth: true },
  { path: '/employees', name: 'Employees Page', auth: true },
  { path: '/reports', name: 'Reports Page', auth: true },
  { path: '/settings', name: 'Settings Page', auth: true },
  { path: '/unauthorized', name: 'Unauthorized Page', auth: true }
];

function waitForUrl(url, timeoutMs = 25000) {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    const check = () => {
      const req = http.get(url, (res) => {
        res.resume();
        resolve();
      });
      req.on('error', (err) => {
        if (Date.now() - start > timeoutMs) {
          reject(new Error(`Timeout waiting for ${url}: ${err.message}`));
        } else {
          setTimeout(check, 400);
        }
      });
      req.setTimeout(2000, () => req.destroy());
    };
    check();
  });
}

async function runAudit(label = 'baseline') {
  console.log(`\n========================================================`);
  console.log(`Starting Full Mobile Responsive Audit [${label.toUpperCase()}]`);
  console.log(`========================================================\n`);

  console.log('1. Starting PHP backend on 127.0.0.1:8000...');
  const phpProcess = spawn('php', ['-S', '127.0.0.1:8000', 'index.php'], {
    cwd: path.resolve(__dirname, '../api'),
    shell: true
  });
  phpProcess.stderr.on('data', d => {
    const s = d.toString().trim();
    if (s.includes('started')) console.log('   PHP Status:', s);
  });

  console.log('2. Starting Vite frontend on 127.0.0.1:5173...');
  const viteBin = path.resolve(__dirname, '../CarRepairShop/node_modules/vite/bin/vite.js');
  const viteProcess = spawn(process.execPath, [viteBin, '--host', '127.0.0.1', '--port', '5173'], {
    cwd: path.resolve(__dirname, '../CarRepairShop')
  });
  viteProcess.stdout.on('data', d => {
    const s = d.toString().trim();
    if (s.includes('ready in') || s.includes('Local:')) console.log('   Vite Status:', s);
  });

  const cleanup = () => {
    console.log('\nCleaning up processes...');
    try {
      if (process.platform === 'win32') {
        spawn('taskkill', ['/pid', phpProcess.pid, '/f', '/t'], { shell: true });
        spawn('taskkill', ['/pid', viteProcess.pid, '/f', '/t'], { shell: true });
      } else {
        phpProcess.kill();
        viteProcess.kill();
      }
    } catch (e) {}
  };

  process.on('exit', cleanup);
  process.on('SIGINT', cleanup);

  try {
    console.log('3. Waiting for servers to be healthy...');
    await Promise.all([
      waitForUrl('http://127.0.0.1:8000'),
      waitForUrl('http://127.0.0.1:5173')
    ]);
    console.log('   Both servers are ready!');

    console.log('4. Launching Playwright Chrome...');
    const browser = await chromium.launch({
      executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15'
    });
    const page = await context.newPage();

    console.log('5. Authenticating as administrator...');
    await page.goto('http://127.0.0.1:5173/login', { waitUntil: 'networkidle', timeout: 15000 });
    await page.fill('#username', 'admin');
    await page.fill('#password', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);
    console.log('   Logged in successfully. Initial URL:', page.url());

    const auditResults = [];
    let totalOverflowCount = 0;

    for (const vp of VIEWPORTS) {
      console.log(`\n--- Viewport: ${vp.name} (${vp.width}x${vp.height}) ---`);
      await page.setViewportSize({ width: vp.width, height: vp.height });

      for (const route of ROUTES) {
        const url = `http://127.0.0.1:5173${route.path}`;
        const consoleErrors = [];
        const failedRequests = [];

        const onConsole = msg => {
          if (msg.type() === 'error') consoleErrors.push(msg.text());
        };
        const onRequestFailed = req => {
          failedRequests.push(`${req.method()} ${req.url()}`);
        };

        page.on('console', onConsole);
        page.on('requestfailed', onRequestFailed);

        try {
          await page.goto(url, { waitUntil: 'load', timeout: 12000 });
          await page.waitForTimeout(600);

          // Evaluate document and element dimensions
          const metrics = await page.evaluate(() => {
            const docWidth = document.documentElement.scrollWidth;
            const vpWidth = window.innerWidth;
            const bodyWidth = document.body.scrollWidth;
            const isOverflowing = docWidth > vpWidth + 1 || bodyWidth > vpWidth + 1;

            const culprits = [];
            if (isOverflowing) {
              document.querySelectorAll('*').forEach(el => {
                const r = el.getBoundingClientRect();
                if (r.right > vpWidth + 1.5 && r.width > 0) {
                  culprits.push({
                    tag: el.tagName.toLowerCase(),
                    className: (el.className || '').toString().slice(0, 60),
                    width: Math.round(r.width),
                    right: Math.round(r.right),
                    excess: Math.round(r.right - vpWidth)
                  });
                }
              });
            }

            return {
              docWidth,
              vpWidth,
              isOverflowing,
              culpritCount: culprits.length,
              sampleCulprits: culprits.slice(0, 3)
            };
          });

          if (metrics.isOverflowing) totalOverflowCount++;

          // Capture screenshots for key viewports: phone-390, phone-320, desktop-1440
          let screenshotName = null;
          if (vp.name === 'phone-390' || vp.name === 'phone-320' || vp.name === 'desktop-1440') {
            screenshotName = `${label}_${vp.name}_${route.path.replace(/\//g, '_') || 'root'}.png`;
            const shotPath = path.join(SCREENSHOTS_DIR, screenshotName);
            await page.screenshot({ path: shotPath, fullPage: false });
          }

          auditResults.push({
            viewport: vp.name,
            width: vp.width,
            height: vp.height,
            route: route.path,
            name: route.name,
            overflow: metrics.isOverflowing,
            docWidth: metrics.docWidth,
            vpWidth: metrics.vpWidth,
            culprits: metrics.sampleCulprits,
            consoleErrors: consoleErrors.length,
            failedRequests: failedRequests.length,
            screenshot: screenshotName
          });

          const statusBadge = metrics.isOverflowing ? '❌ OVERFLOW' : '✅ OK';
          const culpritInfo = metrics.isOverflowing && metrics.sampleCulprits.length > 0
            ? ` | Culprit: <${metrics.sampleCulprits[0].tag}> excess ${metrics.sampleCulprits[0].excess}px`
            : '';
          console.log(`  [${vp.name.padEnd(12)}] ${route.path.padEnd(22)} ${statusBadge} (doc: ${metrics.docWidth}px, vp: ${metrics.vpWidth}px)${culpritInfo}`);

        } catch (e) {
          console.error(`  [${vp.name.padEnd(12)}] Failed loading ${route.path}:`, e.message);
          auditResults.push({
            viewport: vp.name,
            route: route.path,
            error: e.message
          });
        } finally {
          page.off('console', onConsole);
          page.off('requestfailed', onRequestFailed);
        }
      }
    }

    await browser.close();

    const resultPath = path.join(SCREENSHOTS_DIR, `audit_${label}_results.json`);
    fs.writeFileSync(resultPath, JSON.stringify(auditResults, null, 2), 'utf8');
    console.log(`\nAudit Complete! Total tests: ${auditResults.length}, Overflow defects: ${totalOverflowCount}`);
    console.log(`Results saved to: ${resultPath}`);

    return { totalTests: auditResults.length, totalOverflowCount, results: auditResults };

  } catch (err) {
    console.error('Audit fatal error:', err);
    throw err;
  } finally {
    cleanup();
  }
}

const auditMode = process.argv[2] || 'baseline';
runAudit(auditMode)
  .then(() => {
    setTimeout(() => process.exit(0), 1000);
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
