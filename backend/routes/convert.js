const express = require('express');
const router = express.Router();

function escapePDFString(s) {
  return s.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)').replace(/\r/g, '\n');
}

function parseStyledSegments(text) {
  const segments = [];
  let i = 0;
  let mode = 'regular';
  while (i < text.length) {
    if (text.startsWith('**', i)) {
      mode = mode === 'bold' ? 'regular' : 'bold';
      i += 2;
      continue;
    }
    if (text.startsWith('*', i)) {
      mode = mode === 'italic' ? 'regular' : 'italic';
      i += 1;
      continue;
    }
    let j = i;
    while (j < text.length && !text.startsWith('**', j) && !text.startsWith('*', j)) j++;
    const chunk = text.slice(i, j);
    if (chunk.length) segments.push({ text: chunk, font: mode });
    i = j;
  }
  return segments.length ? segments : [{ text, font: 'regular' }];
}

function makeStyledPDF(title, body) {
  const lines = String(body).split(/\r?\n/);
  let y = 720;
  let content = 'BT\n';
  content += '/F1 20 Tf\n72 ' + y + ' Td\n(' + escapePDFString(String(title)) + ') Tj\n';
  y -= 32;
  for (const line of lines) {
    const segs = parseStyledSegments(line);
    content += '72 ' + y + ' Td\n';
    for (const seg of segs) {
      const fontName = seg.font === 'bold' ? '/F2' : seg.font === 'italic' ? '/F3' : '/F1';
      content += fontName + ' 12 Tf\n(' + escapePDFString(seg.text) + ') Tj\n';
    }
    y -= 18;
  }
  content += 'ET';
  const objects = [];
  let offset = 0;
  const addObj = (str) => {
    const buf = Buffer.from(str, 'utf8');
    const start = offset;
    offset += buf.length;
    objects.push({ start, buf });
  };
  const header = '%PDF-1.4\n';
  offset = header.length;
  const obj1 = '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n';
  const obj2 = '2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n';
  const obj3 = '3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 5 0 R /F2 6 0 R /F3 7 0 R >> >> /Contents 4 0 R >>\nendobj\n';
  const obj4 = `4 0 obj\n<< /Length ${Buffer.byteLength(content)} >>\nstream\n${content}\nendstream\nendobj\n`;
  const obj5 = '5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n';
  const obj6 = '6 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>\nendobj\n';
  const obj7 = '7 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Oblique >>\nendobj\n';
  [obj1, obj2, obj3, obj4, obj5].forEach(addObj);
  const xrefStart = offset;
  const xref = ['xref', '0 8', '0000000000 65535 f ']
    .concat(objects.map(o => String(o.start).padStart(10, '0') + ' 00000 n '))
    .join('\n') + '\n';
  const trailer = `trailer\n<< /Size 8 /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF\n`;
  const buffers = [Buffer.from(header, 'utf8')].concat(objects.map(o => o.buf)).concat([Buffer.from(xref, 'utf8'), Buffer.from(trailer, 'utf8')]);
  return Buffer.concat(buffers);
}

router.post('/', async (req, res) => {
  try {
    const { title = 'document', text, base64 } = req.body || {};
    let content = text || '';
    if (!content && base64) {
      content = Buffer.from(base64, 'base64').toString('utf8');
    }
    const pdf = makeStyledPDF(title, content);
    res.writeHead(200, {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${title.replace(/[^a-z0-9.-]/gi, '_')}.pdf"`
    });
    res.end(pdf);
  } catch (err) {
    res.status(500).json({ error: 'Failed to convert', details: err.message });
  }
});

module.exports = router;
