const puppeteer = require('puppeteer-core');
const chromium = require('@sparticuz/chromium');

/**
 * Renders HTML content into a PDF buffer using Puppeteer.
 * @param {string} html - Styled HTML content
 * @param {Object} options - PDF rendering options (format, margin, header/footer)
 * @returns {Promise<Buffer>} - PDF buffer
 */
async function renderPDF(html, options = {}) {
  const {
    format = 'A4',
    landscape = false,
    margin = { top: '60px', bottom: '60px', left: '40px', right: '40px' },
    headerTemplate = '',
    footerTemplate = '',
    displayHeaderFooter = !!(headerTemplate || footerTemplate),
    printBackground = true,
  } = options;

  let browser;
  try {
    const isVercel = process.env.VERCEL || process.env.VERCEL_URL;
    
    browser = await puppeteer.launch({
      args: isVercel ? chromium.args : ['--no-sandbox', '--disable-setuid-sandbox', '--font-render-hinting=none'],
      defaultViewport: chromium.defaultViewport,
      executablePath: isVercel ? await chromium.executablePath() : null, // Uses local chrome if null
      headless: isVercel ? chromium.headless : 'new',
    });

    const page = await browser.newPage();
    
    // Set content and wait for it to be fully loaded (including fonts)
    await page.setContent(html, { waitUntil: 'networkidle0' });
    
    // Explicitly wait for fonts to be ready for high-fidelity rendering
    await page.evaluateHandle('document.fonts.ready');

    const pdfBuffer = await page.pdf({
      format,
      landscape,
      margin,
      displayHeaderFooter,
      headerTemplate: headerTemplate || '<span></span>', // Must not be empty if displayHeaderFooter is true
      footerTemplate: footerTemplate || '<span></span>',
      printBackground,
      preferCSSPageSize: true,
      tagged: true,
      timeout: 30000,
    });

    return pdfBuffer;
  } catch (error) {
    console.error('Error rendering PDF:', error);
    throw new Error(`PDF Rendering Failed: ${error.message}`);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

module.exports = { renderPDF };
