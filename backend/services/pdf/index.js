const { transformToHTML } = require('./transformer');
const { applyTemplate } = require('./templates');
const { renderPDF } = require('./renderer');

/**
 * Main function to generate a Rich Text PDF.
 * @param {Object} params - Input parameters
 * @param {Object|string} params.content - TipTap JSON or HTML content
 * @param {Object} [params.options] - Styling options (fontSize, fontFamily, etc.)
 * @param {string} [params.template] - Template name (resume, report, etc.)
 * @param {Object} [params.metadata] - Metadata for templates (title, email, etc.)
 * @param {Object} [params.pdfOptions] - Puppeteer PDF options (format, margin, etc.)
 * @returns {Promise<Buffer>} - PDF buffer
 */
async function generateRichTextPDF({
  content,
  options = {},
  template = null,
  metadata = {},
  pdfOptions = {}
}) {
  try {
    // 1. Transform TipTap content to HTML with basic styles
    let contentHTML = transformToHTML(content, options);

    let finalHeaderTemplate = pdfOptions.headerTemplate;
    let finalFooterTemplate = pdfOptions.footerTemplate;

    // 2. Apply template if specified
    if (template) {
      const templated = applyTemplate(contentHTML, template, metadata);
      contentHTML = templated.html;
      
      // Merge template header/footer with explicit pdfOptions if provided
      finalHeaderTemplate = pdfOptions.headerTemplate || templated.headerTemplate;
      finalFooterTemplate = pdfOptions.footerTemplate || templated.footerTemplate;
    }

    // 3. Render PDF
    const buffer = await renderPDF(contentHTML, {
      ...pdfOptions,
      headerTemplate: finalHeaderTemplate,
      footerTemplate: finalFooterTemplate
    });

    return buffer;
  } catch (error) {
    console.error('generateRichTextPDF error:', error);
    throw error;
  }
}

module.exports = {
  generateRichTextPDF,
  transformToHTML,
  applyTemplate,
  renderPDF
};
