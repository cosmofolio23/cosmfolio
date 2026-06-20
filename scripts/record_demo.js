const { chromium } = require('playwright');

(async () => {
  console.log('Launching browser to record demo...');
  // Launch browser
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    recordVideo: {
      dir: './videos/',
      size: { width: 1920, height: 1080 },
    },
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();

  try {
    console.log('Navigating to app...');
    // Assumes the app is running on localhost:3000
    await page.goto('http://localhost:3000');

    // Wait for the splash screen to disappear if there is one
    await page.waitForTimeout(2000);

    // Click on "Sign In" or handle the flow
    console.log('Clicking Sign In...');
    await page.click('text=Sign In');

    // Wait for auth to complete or manually login if needed
    // NOTE: For an automated demo, it's best if you have a bypass or pre-filled session.
    // For now, we will simulate typing email/pass if standard inputs exist, or wait for you.
    // Uncomment and modify below as needed:
    /*
    await page.fill('input[type="email"]', 'demo@cosmofolio.com');
    await page.fill('input[type="password"]', 'password');
    await page.click('button:has-text("Sign In")');
    */
    
    // Giving time for manual login if the script is run interactively
    console.log('Waiting 15 seconds for login/dashboard load...');
    await page.waitForTimeout(15000);

    // In Dashboard: Click "Create Portfolio"
    console.log('Starting portfolio creation...');
    const createBtn = await page.$('text=Create Portfolio');
    if (createBtn) await createBtn.click();
    
    // Wait and simulate some form filling
    await page.waitForTimeout(2000);

    console.log('Demo recording... let it run for 30 seconds to capture UI');
    await page.waitForTimeout(30000);

    console.log('Demo finished. Closing browser...');
  } catch (err) {
    console.error('Error during recording:', err);
  } finally {
    await context.close();
    await browser.close();
    console.log('Video saved to ./videos/ directory');
    console.log('Run the FFmpeg script to process it next!');
  }
})();
