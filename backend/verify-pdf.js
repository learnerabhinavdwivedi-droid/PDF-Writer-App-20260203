const { generateRichTextPDF } = require('./services/pdf/index.js');
const fs = require('fs');
const path = require('path');

async function verify() {
  const content = {
    type: 'doc',
    content: [
      {
        type: 'heading',
        attrs: { level: 1 },
        content: [{ type: 'text', text: 'Production-Grade Rich Text PDF Writer' }]
      },
      {
        type: 'paragraph',
        content: [
          { type: 'text', text: 'This is a ' },
          { type: 'text', marks: [{ type: 'bold' }], text: 'bold' },
          { type: 'text', text: ', ' },
          { type: 'text', marks: [{ type: 'italic' }], text: 'italic' },
          { type: 'text', text: ', and ' },
          { type: 'text', marks: [{ type: 'underline' }], text: 'underlined' },
          { type: 'text', text: ' text test.' }
        ]
      },
      {
        type: 'paragraph',
        content: [
          { type: 'text', marks: [{ type: 'textStyle', attrs: { color: '#e74c3c' } }], text: 'Red Text' },
          { type: 'text', text: ' and ' },
          { type: 'text', marks: [{ type: 'highlight', attrs: { color: '#f1c40f' } }], text: 'Yellow Highlight' }
        ]
      },
      {
        type: 'bulletList',
        content: [
          { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'First item' }] }] },
          { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Second item with ' }, { type: 'text', marks: [{ type: 'code' }], text: 'code' }] }] }
        ]
      },
      {
        type: 'blockquote',
        content: [{ type: 'paragraph', content: [{ type: 'text', text: 'This is a blockquote for accessibility and logical flow testing.' }] }]
      },
      {
        type: 'paragraph',
        content: [{ type: 'text', text: 'Symbols: ₹ © ™ ± ∑ √ ∞ 😃' }]
      }
    ]
  };

  console.log('Generating PDF...');
  try {
    const pdfBuffer = await generateRichTextPDF({
      content,
      template: 'report',
      metadata: {
        title: 'Accessibility & Fidelity Test',
        date: new Date().toLocaleDateString()
      },
      options: {
        fontFamily: 'sans-serif',
        fontSize: '12pt'
      }
    });

    const outputPath = path.join(__dirname, 'test-output.pdf');
    fs.writeFileSync(outputPath, pdfBuffer);
    console.log(`PDF generated successfully: ${outputPath}`);
  } catch (error) {
    console.error('Verification failed:', error);
  }
}

verify();
