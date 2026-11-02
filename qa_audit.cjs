const { chromium } = require('./CarRepairShop/node_modules/playwright');
const fs = require('fs');
const path = require('path');

const ARTIFACT_DIR = path.join(__dirname, 'qa_artifacts');
const BEFORE_DIR = path.join(ARTIFACT_DIR, 'before');

if (!fs.existsSync(BEFORE_DIR)) {
  fs.mkdirSync(BEFORE_DIR, { recursive: true });
}

const ROUTES = [
  { name: 'login', path: '/login' },
  { name: 'admin_dashboard', path: '/admin/dashboard' },
  { name: 'appointments', path: '/appointments' },
  { name: 'invoices', path: '/invoices' },
  { name: 'inventory', path: '/inventory' },
  { name: 'reports', path: '/reports' },
  { name: 'settings', path: '/settings' },
  { name: 'repair_jobs', path: '/repair-jobs' },
  { name: 'vehicles', path: '/vehicles' }
];

async function getAdminAuth() {
  const res = await fetch('http://127.0.0.1:8000/api/auth/quick-login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'admin' })
  });
  return await res.json();
}

async function runAudit() {
  const authData = await getAdminAuth();
  console.log('Obtained Admin Auth Token:', Boolean(authData?.token));

  const browser = await chromium.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true
  });

  const report = {
    timestamp: new Date().toISOString(),
    viewports: {
      desktop: '1440x900',
      mobile: '375x812 (iPhone X/13 Mini touch)'
    },
    results: []
  };

  // 1. Desktop Audit
  console.log('--- Starting Desktop Audit (1440x900) ---');
  const desktopContext = await browser.newContext({
    viewport: { width: 1440, height: 900 }
  });
  await desktopContext.addInitScript((data) => {
    localStorage.setItem('auth_token', data.token);
    localStorage.setItem('auth_user', JSON.stringify(data.user));
    localStorage.setItem('app_language', 'en');
  }, authData);

  const desktopPage = await desktopContext.newPage();

  for (const route of ROUTES) {
    console.log(`[Desktop] Checking ${route.name} (${route.path})...`);
    await desktopPage.goto(`http://127.0.0.1:5173${route.path}`, { waitUntil: 'domcontentloaded' });
    await desktopPage.waitForTimeout(1200);

    const screenshotPath = path.join(BEFORE_DIR, `desktop_${route.name}.png`);
    await desktopPage.screenshot({ path: screenshotPath, fullPage: false });

    // Inspect layout metrics
    const metrics = await desktopPage.evaluate(() => {
      const scrollWidth = document.documentElement.scrollWidth;
      const clientWidth = document.documentElement.clientWidth;
      const hasHorizontalOverflow = scrollWidth > clientWidth;

      const overflowing = [];
      document.querySelectorAll('*').forEach((el) => {
        const r = el.getBoundingClientRect();
        if (r.right > clientWidth + 2 && r.width > 0 && r.height > 0) {
          overflowing.push({
            tag: el.tagName.toLowerCase(),
            className: el.className ? String(el.className).substring(0, 80) : '',
            right: Math.round(r.right),
            width: Math.round(r.width)
          });
        }
      });

      return {
        url: window.location.pathname,
        hasHorizontalOverflow,
        scrollWidth,
        clientWidth,
        overflowCount: overflowing.length,
        sampleOverflow: overflowing.slice(0, 5)
      };
    });

    report.results.push({
      device: 'desktop',
      route: route.name,
      metrics
    });
  }
  await desktopContext.close();

  // 2. Mobile Audit
  console.log('--- Starting Mobile Audit (375x812, Touch) ---');
  const mobileContext = await browser.newContext({
    viewport: { width: 375, height: 812 },
    isMobile: true,
    hasTouch: true,
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1'
  });
  await mobileContext.addInitScript((data) => {
    localStorage.setItem('auth_token', data.token);
    localStorage.setItem('auth_user', JSON.stringify(data.user));
    localStorage.setItem('app_language', 'en');
  }, authData);

  const mobilePage = await mobileContext.newPage();

  for (const route of ROUTES) {
    console.log(`[Mobile] Checking ${route.name} (${route.path})...`);
    await mobilePage.goto(`http://127.0.0.1:5173${route.path}`, { waitUntil: 'domcontentloaded' });
    await mobilePage.waitForTimeout(1200);

    const screenshotPath = path.join(BEFORE_DIR, `mobile_${route.name}.png`);
    await mobilePage.screenshot({ path: screenshotPath, fullPage: false });

    // Inspect mobile layout metrics: horizontal overflow & touch targets (< 44px)
    const metrics = await mobilePage.evaluate(() => {
      const scrollWidth = document.documentElement.scrollWidth;
      const clientWidth = document.documentElement.clientWidth;
      const hasHorizontalOverflow = scrollWidth > clientWidth;

      // Find overflowing elements
      const overflowingElements = [];
      document.querySelectorAll('*').forEach((el) => {
        const rect = el.getBoundingClientRect();
        if (rect.right > clientWidth + 2 && rect.width > 0 && rect.height > 0) {
          overflowingElements.push({
            tag: el.tagName.toLowerCase(),
            className: el.className ? String(el.className).substring(0, 80) : '',
            right: Math.round(rect.right),
            width: Math.round(rect.width)
          });
        }
      });

      // Find undersized interactive elements (< 44px x 44px)
      const undersizedTargets = [];
      const interactiveSelector = 'button, a, input:not([type="hidden"]), select, [role="button"]';
      document.querySelectorAll(interactiveSelector).forEach((el) => {
        const rect = el.getBoundingClientRect();
        const style = window.getComputedStyle(el);
        if (
          style.display !== 'none' &&
          style.visibility !== 'hidden' &&
          style.opacity !== '0' &&
          rect.width > 0 &&
          rect.height > 0
        ) {
          if (rect.width < 44 || rect.height < 44) {
            undersizedTargets.push({
              tag: el.tagName.toLowerCase(),
              text: el.innerText ? el.innerText.trim().substring(0, 30) : (el.getAttribute('placeholder') || el.getAttribute('aria-label') || el.getAttribute('title') || ''),
              className: el.className ? String(el.className).substring(0, 80) : '',
              width: Math.round(rect.width),
              height: Math.round(rect.height)
            });
          }
        }
      });

      return {
        url: window.location.pathname,
        hasHorizontalOverflow,
        scrollWidth,
        clientWidth,
        overflowCount: overflowingElements.length,
        sampleOverflow: overflowingElements.slice(0, 5),
        undersizedCount: undersizedTargets.length,
        sampleUndersized: undersizedTargets.slice(0, 10)
      };
    });

    report.results.push({
      device: 'mobile',
      route: route.name,
      metrics
    });
  }
  await mobileContext.close();
  await browser.close();

  fs.writeFileSync(path.join(ARTIFACT_DIR, 'initial_audit_report.json'), JSON.stringify(report, null, 2));
  console.log('Audit complete! Results written to initial_audit_report.json');
}

runAudit().catch(console.error);
