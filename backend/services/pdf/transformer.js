const { generateHTML } = require('@tiptap/html');
const { StarterKit } = require('@tiptap/starter-kit');
const { Underline } = require('@tiptap/extension-underline');
const { Subscript } = require('@tiptap/extension-subscript');
const { Superscript } = require('@tiptap/extension-superscript');
const { Color } = require('@tiptap/extension-color');
const { Highlight } = require('@tiptap/extension-highlight');
const { TextStyle } = require('@tiptap/extension-text-style');
const { FontFamily } = require('@tiptap/extension-font-family');
const { TextAlign } = require('@tiptap/extension-text-align');

/**
 * Transforms TipTap JSON or HTML into a fully styled HTML string for PDF rendering.
 * @param {Object|string} content - TipTap JSON or HTML string
 * @param {Object} options - Configuration for styles (fonts, colors, etc.)
 * @returns {string} - Styled HTML string
 */
function transformToHTML(content, options = {}) {
  let html = '';
  
  if (typeof content === 'string') {
    // If it's already HTML, we use it directly
    html = content;
  } else if (content && typeof content === 'object') {
    // If it's TipTap JSON, convert it to HTML
    html = generateHTML(content, [
      StarterKit,
      Underline,
      Subscript,
      Superscript,
      TextStyle,
      Color,
      Highlight.configure({ multicolor: true }),
      FontFamily,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
    ]);
  }

  const {
    fontSize = '12pt',
    fontFamily = 'serif',
    lineHeight = '1.5',
    letterSpacing = 'normal',
    paragraphSpacing = '1em',
    color = '#000000',
    backgroundColor = '#ffffff',
  } = options;

  // Comprehensive CSS for PDF fidelity
  const styles = `
    <style>
      @page {
        margin: 0; /* Margins are handled by Puppeteer or Template */
      }
      body {
        font-family: ${fontFamily};
        font-size: ${fontSize};
        line-height: ${lineHeight};
        letter-spacing: ${letterSpacing};
        color: ${color};
        background-color: ${backgroundColor};
        margin: 0;
        padding: 0;
        -webkit-print-color-adjust: exact;
      }
      .content-wrapper {
        width: 100%;
        word-wrap: break-word;
      }
      p {
        margin-bottom: ${paragraphSpacing};
      }
      h1, h2, h3, h4, h5, h6 {
        margin-top: 1.5em;
        margin-bottom: 0.5em;
        line-height: 1.2;
      }
      h1 { font-size: 2.5em; }
      h2 { font-size: 2em; }
      h3 { font-size: 1.75em; }
      h4 { font-size: 1.5em; }
      h5 { font-size: 1.25em; }
      h6 { font-size: 1em; }
      
      ul, ol {
        margin-bottom: ${paragraphSpacing};
        padding-left: 2em;
      }
      li {
        margin-bottom: 0.5em;
      }
      
      blockquote {
        border-left: 4px solid #ccc;
        margin: 1em 0;
        padding-left: 1em;
        font-style: italic;
      }
      
      code {
        background-color: #f4f4f4;
        padding: 0.2em 0.4em;
        border-radius: 3px;
        font-family: monospace;
      }
      
      pre {
        background-color: #282c34;
        color: #abb2bf;
        padding: 1em;
        border-radius: 5px;
        overflow-x: auto;
        font-family: monospace;
        margin-bottom: ${paragraphSpacing};
      }
      
      pre code {
        background-color: transparent;
        padding: 0;
        color: inherit;
      }
      
      mark {
        background-color: yellow;
        color: black;
      }

      sup { vertical-align: super; font-size: smaller; }
      sub { vertical-align: sub; font-size: smaller; }

      /* TextAlign Support */
      .text-align-left { text-align: left; }
      .text-align-center { text-align: center; }
      .text-align-right { text-align: right; }
      .text-align-justify { text-align: justify; }

      /* Accessibility: ensure good contrast and logical flow */
      * {
        box-sizing: border-box;
      }
    </style>
  `;

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      ${styles}
    </head>
    <body>
      <div class="content-wrapper">
        ${html}
      </div>
    </body>
    </html>
  `;
}

module.exports = { transformToHTML };
