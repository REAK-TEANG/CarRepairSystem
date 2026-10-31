const fs = require('fs');
const path = require('path');
const { chromium } = require('../CarRepairShop/node_modules/playwright');

const SCREENSHOTS_DIR = 'C:/Users/ASUS TUF GAMING F15/.gemini/antigravity/brain/42ba91ab-7bb1-41d7-bc80-86a44d8cfd7a/audit_screenshots';
if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

const VIEWPORTS = [
  { name: 'phone-small', width: 320, height: 568 },
  { name: 'phone-360', width: 360, height: 800 },
  { name: 'phone-iphone', width: 375, height: 812 },
  { name: 'phone-standard', width: 390, height: 844 },
  { name: 'phone-large', width: 414, height: 896 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'desktop', width: 1440, height: 900 }
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

async function runAudit() {
  console.log('--- Starting Playwright Mobile Responsive Audit ---');
  const browser = await chromium.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true
  });

  const auditResults = [];

  // Authenticate first
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15'
  });
  const page = await context.newPage();

  console.log('Logging in with admin account on port 5173...');
  try {
    await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle', timeout: 15000 });
    await page.fill('input[type="text"], input[name="username"]', 'admin');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);
    console.log('Login completed. Current URL:', page.url());
  } catch (err) {
    console.error('Login error:', err.message);
  }

  // Iterate over viewports and routes
  for (const vp of VIEWPORTS) {
    console.log(`\n=== Testing Viewport: ${vp.name} (${vp.width}x${vp.height}) ===`);
    await page.setViewportSize({ width: vp.width, height: vp.height });

    for (const route of ROUTES) {
      const url = `http://localhost:5173${route.path}`;
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
        await page.goto(url, { waitUntil: 'load', timeout: 10000 });
        await page.waitForTimeout(1000);

        // Check overflow
        const overflowData = await page.evaluate(() => {
          const docWidth = document.documentElement.scrollWidth;
          const vpWidth = window.innerWidth;
          const bodyWidth = document.body.scrollWidth;
          const isOverflowing = docWidth > vpWidth + 1 || bodyWidth > vpWidth + 1;

          const overflowingElements = [];
          if (isOverflowing) {
            document.querySelectorAll('*').forEach(el => {
              const r = el.getBoundingClientRect();
              if (r.right > vpWidth + 1.5 && r.width > 0) {
                overflowingElements.push({
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
            bodyWidth,
            isOverflowing,
            overflowCount: overflowingElements.length,
            sampleOverflow: overflowingElements.slice(0, 5)
          };
        });

        // Capture screenshot for key viewports (phone-390, phone-small, desktop)
        let screenshotPath = null;
        if (vp.name === 'phone-standard' || vp.name === 'phone-small' || vp.name === 'desktop') {
          const filename = `${vp.name}_${route.path.replace(/\//g, '_')}.png`;
          screenshotPath = path.join(SCREENSHOTS_DIR, filename);
          await page.screenshot({ path: screenshotPath, fullPage: false });
        }

        auditResults.push({
          viewport: vp.name,
          width: vp.width,
          height: vp.height,
          route: route.path,
          name: route.name,
          overflow: overflowData.isOverflowing,
          docWidth: overflowData.docWidth,
          vpWidth: overflowData.vpWidth,
          overflowDetails: overflowData.sampleOverflow,
          consoleErrorsCount: consoleErrors.length,
          failedRequestsCount: failedRequests.length,
          screenshot: screenshotPath ? path.basename(screenshotPath) : null
        });

        const statusMark = overflowData.isOverflowing ? '❌ OVERFLOW' : '✅ OK';
        console.log(`[${vp.name}] ${route.path.padEnd(22)} ${statusMark} (doc: ${overflowData.docWidth}px, vp: ${overflowData.vpWidth}px)`);
        if (overflowData.isOverflowing && overflowData.sampleOverflow.length > 0) {
          console.log(`   Overflow culprits:`, JSON.stringify(overflowData.sampleOverflow[0]));
        }

      } catch (e) {
        console.error(`[${vp.name}] Failed visiting ${route.path}:`, e.message);
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

  // Save audit results
  const reportPath = path.join(SCREENSHOTS_DIR, 'audit_baseline_results.json');
  fs.writeFileSync(reportPath, JSON.stringify(auditResults, null, 2), 'utf8');
  console.log(`\nAudit complete! Saved detailed results to: ${reportPath}`);
}

runAudit().catch(err => {
  console.error('Audit fatal error:', err);
  process.exit(1);
});
