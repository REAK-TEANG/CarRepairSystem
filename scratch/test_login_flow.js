const { chromium } = require('../CarRepairShop/node_modules/playwright');

(async () => {
  const browser = await chromium.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true
  });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  
  page.on('console', msg => console.log('BROWSER CONSOLE:', msg.type(), msg.text()));
  page.on('response', res => {
    if (res.url().includes('/api/')) {
      console.log('API RESPONSE:', res.status(), res.url());
    }
  });

  await page.goto('http://localhost:5173/login');
  await page.waitForTimeout(1000);

  // Check if quick accounts are present
  const quickAccounts = await page.$$('button:has-text("System Administrator"), button:has-text("admin")');
  console.log('Quick accounts found:', quickAccounts.length);

  // Fill in form
  await page.fill('#username', 'admin');
  await page.fill('#password', 'admin123');
  await page.click('button[type="submit"]');

  await page.waitForTimeout(2000);
  console.log('Current URL after submit:', page.url());

  const authUser = await page.evaluate(() => localStorage.getItem('auth_user'));
  const authToken = await page.evaluate(() => localStorage.getItem('auth_token'));
  console.log('localStorage auth_user:', authUser ? JSON.parse(authUser).username : null);
  console.log('localStorage auth_token:', authToken ? 'EXISTS' : null);

  // If not redirected, try clicking quick account button if present
  if (page.url().includes('/login')) {
    const errorEl = await page.$('.bg-red-500\\/10');
    if (errorEl) {
      console.log('Login error message:', await errorEl.innerText());
    }
  }

  // Navigate to /admin/dashboard
  await page.goto('http://localhost:5173/admin/dashboard');
  await page.waitForTimeout(1500);
  console.log('Final URL after navigating to /admin/dashboard:', page.url());

  await browser.close();
})();

