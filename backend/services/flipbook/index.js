const puppeteer = require('puppeteer-core');
const chromium = require('@sparticuz/chromium');
const { transformToHTML } = require('../pdf/transformer');

// Try to find local Chrome/Chromium installation
function getLocalChromePath() {
  const paths = [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    process.env.CHROME_PATH,
    process.env.PUPPETEER_EXECUTABLE_PATH
  ].filter(Boolean);
  
  const fs = require('fs');
  for (const path of paths) {
    try {
      if (fs.existsSync(path)) return path;
    } catch (e) {}
  }
  return null;
}

/**
 * Generates flipbook pages (images) from content.
 * @param {Object} params - Input parameters
 * @param {Object|string} params.content - TipTap JSON or HTML content
 * @param {Object} [params.options] - Styling options
 * @returns {Promise<string[]>} - Array of base64 image strings
 */
async function generateFlipbookPages({ content, options = {} }) {
  const html = transformToHTML(content, options);
  
  // Inject specific styles for flipbook rendering (fixed page height)
  const flipbookHtml = html.replace('</head>', `
    <style>
      body {
        margin: 0;
        padding: 0;
        background-color: white;
      }
      .content-wrapper {
        padding: 40px;
        box-sizing: border-box;
      }
      /* Ensure we have a way to split pages if needed, 
         but for a simple flipbook from notes, 
         we'll treat the whole thing as a sequence of pages 
         based on viewport height */
    </style>
  </head>`);

  let browser;
  try {
    const isVercel = process.env.VERCEL || process.env.VERCEL_URL;
    const localChrome = !isVercel ? getLocalChromePath() : null;

    browser = await puppeteer.launch({
      args: isVercel ? chromium.args : ['--no-sandbox', '--disable-setuid-sandbox'],
      defaultViewport: chromium.defaultViewport,
      executablePath: isVercel ? await chromium.executablePath() : localChrome,
      headless: isVercel ? chromium.headless : 'new',
    });

    const page = await browser.newPage();
    
    // Set viewport to A4 aspect ratio (roughly)
    // A4 is 210x297mm. At 96 DPI, that's ~794x1123px
    const width = 800;
    const height = 1131;
    await page.setViewport({ width, height });

    await page.setContent(flipbookHtml, { waitUntil: 'networkidle0' });
    await page.evaluateHandle('document.fonts.ready');

    // Calculate total height to determine number of pages
    const totalHeight = await page.evaluate(() => document.documentElement.scrollHeight);
    const pageCount = Math.ceil(totalHeight / height);
    
    const pages = [];
    for (let i = 0; i < pageCount; i++) {
      const screenshot = await page.screenshot({
        type: 'jpeg',
        quality: 90,
        clip: {
          x: 0,
          y: i * height,
          width,
          height
        },
        encoding: 'base64'
      });
      pages.push(`data:image/jpeg;base64,${screenshot}`);
    }

    return pages;
  } catch (error) {
    console.error('Flipbook generation error:', error);
    throw error;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

/**
 * Generates flipbook pages (images) from a PDF buffer.
 * @param {Buffer} pdfBuffer - The uploaded PDF file buffer
 * @returns {Promise<string[]>} - Array of base64 image strings
 */
async function generateFlipbookFromPDF(pdfBuffer) {
  let browser;
  try {
    const isVercel = process.env.VERCEL || process.env.VERCEL_URL;
    const localChrome = !isVercel ? getLocalChromePath() : null;

    browser = await puppeteer.launch({
      args: isVercel ? chromium.args : ['--no-sandbox', '--disable-setuid-sandbox'],
      defaultViewport: chromium.defaultViewport,
      executablePath: isVercel ? await chromium.executablePath() : localChrome,
      headless: isVercel ? chromium.headless : 'new',
    });

    const page = await browser.newPage();
    
    // We'll use a simple HTML page with PDF.js to render the buffer
    const base64Pdf = pdfBuffer.toString('base64');
    const html = `
      <html>
        <head>
          <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"></script>
          <style>
            body { margin: 0; padding: 0; background: white; }
            canvas { display: block; width: 100%; }
          </style>
        </head>
        <body>
          <div id="container"></div>
          <script>
            pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
            
            async function renderPdf(base64) {
              const loadingTask = pdfjsLib.getDocument({ data: atob(base64) });
              const pdf = await loadingTask.promise;
              const container = document.getElementById('container');
              
              for (let i = 1; i <= pdf.numPages; i++) {
                const page = await pdf.getPage(i);
                const viewport = page.getViewport({ scale: 2.0 });
                const canvas = document.createElement('canvas');
                const context = canvas.getContext('2d');
                canvas.height = viewport.height;
                canvas.width = viewport.width;
                container.appendChild(canvas);
                
                await page.render({ canvasContext: context, viewport: viewport }).promise;
              }
              document.body.setAttribute('data-ready', 'true');
            }
            renderPdf('${base64Pdf}');
          </script>
        </body>
      </html>
    `;

    await page.setContent(html);
    await page.waitForSelector('body[data-ready="true"]', { timeout: 60000 });

    const canvases = await page.$$('canvas');
    const pages = [];

    for (const canvas of canvases) {
      const screenshot = await canvas.screenshot({
        type: 'jpeg',
        quality: 85,
        encoding: 'base64'
      });
      pages.push(`data:image/jpeg;base64,${screenshot}`);
    }

    return pages;
  } catch (error) {
    console.error('PDF to Flipbook conversion error:', error);
    throw error;
  } finally {
    if (browser) await browser.close();
  }
}

module.exports = { generateFlipbookPages, generateFlipbookFromPDF };
