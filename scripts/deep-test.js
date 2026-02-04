const { transformToHTML } = require('../backend/services/pdf/transformer');
const { generateRichTextPDF } = require('../backend/services/pdf');
const { generateFlipbookPages } = require('../backend/services/flipbook');
const fs = require('fs');
const path = require('path');

async function runDeepTest() {
  console.log('--- STARTING DEEP TEST ---');

  // 1. Test Transformer
  console.log('\n[1/4] Testing Transformer...');
  const mockContent = {
    type: 'doc',
    content: [
      {
        type: 'heading',
        attrs: { level: 1 },
        content: [{ type: 'text', text: 'Deep Test Document' }]
      },
      {
        type: 'paragraph',
        content: [
          { type: 'text', text: 'Normal text, ' },
          { type: 'text', marks: [{ type: 'bold' }], text: 'bold text' },
          { type: 'text', text: ', ' },
          { type: 'text', marks: [{ type: 'italic' }], text: 'italic text' },
          { type: 'text', text: ', and ' },
          { type: 'text', marks: [{ type: 'highlight', attrs: { color: '#3498db' } }], text: 'highlighted text' },
          { type: 'text', text: '.' }
        ]
      }
    ]
  };

  try {
    const html = transformToHTML(mockContent, { fontSize: '14pt', color: '#2c3e50' });
    // console.log('DEBUG HTML:', html);
    if (html.includes('Deep Test Document') && (html.includes('bold text') || html.includes('<strong>bold text</strong>')) && html.includes('#3498db')) {
      console.log('✅ Transformer: Success');
    } else {
      console.log('DEBUG HTML:', html);
      throw new Error('Transformer output missing expected content or styles');
    }
  } catch (err) {
    console.error('❌ Transformer: Failed', err.message);
  }

  // 2. Test PDF Generation (Multi-page)
  console.log('\n[2/4] Testing PDF Generation (Multi-page)...');
  const longContent = {
    type: 'doc',
    content: Array(10).fill({
      type: 'paragraph',
      content: [{ type: 'text', text: 'This is a test paragraph repeated to ensure multiple pages are generated. '.repeat(20) }]
    })
  };

  try {
    const pdfBuffer = await generateRichTextPDF({
      content: longContent,
      template: 'report',
      metadata: { title: 'Deep Test Report', date: 'Feb 2026' }
    });
    if (pdfBuffer && pdfBuffer.length > 5000) {
      const pdfPath = path.join(__dirname, 'deep-test-pdf.pdf');
      fs.writeFileSync(pdfPath, pdfBuffer);
      console.log(`✅ PDF Generation: Success (Saved to ${pdfPath})`);
    } else {
      throw new Error('PDF Buffer is too small or empty');
    }
  } catch (err) {
    console.error('❌ PDF Generation: Failed', err.message);
  }

  // 3. Test Flipbook Generation
  console.log('\n[3/4] Testing Flipbook Generation...');
  try {
    const pages = await generateFlipbookPages({
      content: longContent,
      options: { fontSize: '12pt' }
    });
    if (pages.length > 1) {
      console.log(`✅ Flipbook: Success (${pages.length} pages generated)`);
    } else {
      throw new Error(`Flipbook generated only ${pages.length} pages, expected more`);
    }
  } catch (err) {
    console.error('❌ Flipbook: Failed', err.message);
  }

  // 4. Test API Auth Mock (Local Check)
  console.log('\n[4/4] Testing Auth Logic Check...');
  const authRoutes = require('../backend/routes/auth');
  if (authRoutes) {
    console.log('✅ Auth Routes: Loaded');
  } else {
    console.error('❌ Auth Routes: Failed to load');
  }

  console.log('\n--- DEEP TEST COMPLETE ---');
}

runDeepTest().catch(console.error);
