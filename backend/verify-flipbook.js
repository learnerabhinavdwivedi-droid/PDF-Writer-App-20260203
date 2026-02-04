const { generateFlipbookPages } = require('../backend/services/flipbook/index.js');
const fs = require('fs');
const path = require('path');

async function verifyFlipbook() {
  const content = {
    type: 'doc',
    content: [
      {
        type: 'heading',
        attrs: { level: 1 },
        content: [{ type: 'text', text: 'Interactive Flipbook Test' }]
      },
      {
        type: 'paragraph',
        content: [{ type: 'text', text: 'Page 1: Welcome to the flipbook conversion service. This should be captured as an image.' }]
      },
      {
        type: 'paragraph',
        content: [{ type: 'text', text: '\n'.repeat(50) + 'Page 2: This content should be far enough down to trigger a second page capture in our flipbook service.' }]
      }
    ]
  };

  console.log('Generating Flipbook pages...');
  try {
    const pages = await generateFlipbookPages({
      content,
      options: {
        fontFamily: 'sans-serif',
        fontSize: '14pt'
      }
    });

    console.log(`Flipbook generated successfully! Total pages: ${pages.length}`);
    
    // Save first page as a sample
    if (pages.length > 0) {
      const base64Data = pages[0].replace(/^data:image\/jpeg;base64,/, "");
      const outputPath = path.join(__dirname, 'flipbook-page-1.jpg');
      fs.writeFileSync(outputPath, base64Data, 'base64');
      console.log(`Sample page saved to: ${outputPath}`);
    }
  } catch (error) {
    console.error('Flipbook verification failed:', error);
  }
}

verifyFlipbook();
