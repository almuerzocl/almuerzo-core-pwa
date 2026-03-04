const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    page.on('console', msg => {
        if (msg.type() === 'error') {
            console.log('BROWSER ERROR:', msg.text());
        } else {
            console.log('BROWSER LOG:', msg.text());
        }
    });

    page.on('pageerror', err => {
        console.log('PAGE EXCEPTION:', err.toString());
    });

    try {
        await page.goto('https://almuerzocl-core-pwa-353205175933.us-central1.run.app', { waitUntil: 'networkidle0' });
    } catch (e) {
        console.log("Navigation error:", e);
    }

    await browser.close();
})();
