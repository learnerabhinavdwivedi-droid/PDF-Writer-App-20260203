/**
 * Minimal backend using only Node's built-in http module.
 * Use when full server.js fails (e.g. OneDrive blocking file reads).
 * Run: node server-health.js
 *
 * Serves:
 *   GET    /api/health
 *   POST   /api/auth/register
 *   POST   /api/auth/login
 *   POST   /api/auth/logout
 *   GET    /api/documents
 *   POST   /api/documents
 *   GET    /api/documents/:id
 *   PUT    /api/documents/:id
 *   DELETE /api/documents/:id
 *   GET    /api/templates
 *   POST   /api/templates
 *   GET    /api/templates/:id
 *   PUT    /api/templates/:id
 *   DELETE /api/templates/:id
 *   POST   /api/pdf/generate
 *   POST   /api/pdf/text-to-pdf
 *   POST   /api/convert
 */
const http = require('http');
const crypto = require('crypto');

const PORT = process.env.PORT || 5000;

// In-memory store when not using full backend
const documents = [];
const templates = [];
const users = [];
const sessions = new Map(); // token -> userId

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => { body += chunk; });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (e) {
        resolve({});
      }
    });
    req.on('error', reject);
  });
}

function parseCookies(req) {
  const header = req.headers['cookie'];
  if (!header) return {};
  return header.split(';').reduce((acc, part) => {
    const [k, v] = part.trim().split('=');
    acc[k] = decodeURIComponent(v || '');
    return acc;
  }, {});
}

function setCookieHeaders(origin) {
  const headers = {
    'Access-Control-Allow-Origin': origin || '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
  if (origin) headers['Access-Control-Allow-Credentials'] = 'true';
  return headers;
}

function send(req, res, status, data, contentType = 'application/json') {
  const headers = setCookieHeaders(req.headers.origin);
  headers['Content-Type'] = contentType;
  res.writeHead(status, headers);
  if (Buffer.isBuffer(data)) {
    res.end(data);
  } else {
    res.end(JSON.stringify(data));
  }
}

function hashPassword(pw) {
  return crypto.createHash('sha256').update(pw).digest('hex');
}

function makeToken() {
  return crypto.randomBytes(32).toString('hex');
}

function escapePDFString(s) {
  return s.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)').replace(/\r/g, '\n');
}

function parseStyledSegments(text) {
  const segments = [];
  let i = 0;
  let mode = 'regular';
  while (i < text.length) {
    if (text.startsWith('**', i)) { mode = mode === 'bold' ? 'regular' : 'bold'; i += 2; continue; }
    if (text.startsWith('*', i)) { mode = mode === 'italic' ? 'regular' : 'italic'; i += 1; continue; }
    let j = i;
    while (j < text.length && !text.startsWith('**', j) && !text.startsWith('*', j)) j++;
    const chunk = text.slice(i, j);
    if (chunk.length) segments.push({ text: chunk, font: mode });
    i = j;
  }
  return segments.length ? segments : [{ text, font: 'regular' }];
}

function makeSimplePDF(title, body) {
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
  [obj1, obj2, obj3, obj4, obj5, obj6, obj7].forEach(addObj);
  const xrefStart = offset;
  const xref = ['xref', '0 8', '0000000000 65535 f ']
    .concat(objects.map(o => String(o.start).padStart(10, '0') + ' 00000 n '))
    .join('\n') + '\n';
  const trailer = `trailer\n<< /Size 8 /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF\n`;
  const buffers = [Buffer.from(header, 'utf8')].concat(objects.map(o => o.buf)).concat([Buffer.from(xref, 'utf8'), Buffer.from(trailer, 'utf8')]);
  return Buffer.concat(buffers);
}

const server = http.createServer(async (req, res) => {
  const url = req.url?.split('?')[0];
  const method = req.method;

  // CORS preflight
  if (method === 'OPTIONS') {
    const headers = setCookieHeaders(req.headers.origin);
    res.writeHead(204, headers);
    res.end();
    return;
  }

  try {
    // GET /api/health
    if (method === 'GET' && (url === '/api/health' || url === '/api/health/')) {
      send(req, res, 200, { status: 'ok' });
      return;
    }

    // POST /api/auth/register
    if (method === 'POST' && (url === '/api/auth/register' || url === '/api/auth/register/')) {
      const body = await parseBody(req);
      const { name, email, password } = body;
      if (!name || !email || !password) {
        send(req, res, 400, { error: 'Please provide name, email, and password' });
        return;
      }
      if (users.find(u => u.email === email)) {
        send(req, res, 400, { error: 'User already exists' });
        return;
      }
      const user = { id: String(Date.now()), name, email, password: hashPassword(password), role: 'user' };
      users.push(user);
      const token = makeToken();
      sessions.set(token, user.id);
      const headers = setCookieHeaders(req.headers.origin);
      headers['Set-Cookie'] = `token=${token}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${7 * 24 * 60 * 60}`;
      res.writeHead(201, headers);
      res.end(JSON.stringify({
        success: true,
        message: 'User registered successfully',
        user: { id: user.id, name: user.name, email: user.email, role: user.role }
      }));
      return;
    }

    // POST /api/auth/login
    if (method === 'POST' && (url === '/api/auth/login' || url === '/api/auth/login/')) {
      const body = await parseBody(req);
      const { email, password } = body;
      if (!email || !password) {
        send(req, res, 400, { error: 'Please provide email and password' });
        return;
      }
      const user = users.find(u => u.email === email);
      if (!user || user.password !== hashPassword(password)) {
        send(req, res, 401, { error: 'Invalid credentials' });
        return;
      }
      const token = makeToken();
      sessions.set(token, user.id);
      const headers = setCookieHeaders(req.headers.origin);
      headers['Set-Cookie'] = `token=${token}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${7 * 24 * 60 * 60}`;
      res.writeHead(200, headers);
      res.end(JSON.stringify({
        success: true,
        message: 'Login successful',
        user: { id: user.id, name: user.name, email: user.email, role: user.role }
      }));
      return;
    }

    // POST /api/auth/logout
    if (method === 'POST' && (url === '/api/auth/logout' || url === '/api/auth/logout/')) {
      const cookies = parseCookies(req);
      const token = cookies.token;
      if (token) sessions.delete(token);
      const headers = setCookieHeaders(req.headers.origin);
      headers['Set-Cookie'] = 'token=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0';
      res.writeHead(200, headers);
      res.end(JSON.stringify({ success: true, message: 'Logged out' }));
      return;
    }

    // GET /api/documents
    if (method === 'GET' && (url === '/api/documents' || url === '/api/documents/')) {
      send(req, res, 200, { success: true, documents });
      return;
    }

    // POST /api/documents (save document)
    if (method === 'POST' && (url === '/api/documents' || url === '/api/documents/')) {
      const body = await parseBody(req);
      const doc = {
        _id: String(Date.now()),
        title: body.title || 'Untitled',
        content: body.content || '',
        author: body.author || 'Current User',
        createdAt: new Date(),
        status: 'draft',
      };
      documents.push(doc);
      send(req, res, 201, { success: true, message: 'Document saved', document: doc });
      return;
    }

    // GET /api/documents/:id
    if (method === 'GET' && url.startsWith('/api/documents/')) {
      const id = url.split('/').pop();
      const doc = documents.find(d => d._id === id);
      if (!doc) {
        send(req, res, 404, { error: 'Document not found' });
      } else {
        send(req, res, 200, { success: true, document: doc });
      }
      return;
    }

    // PUT /api/documents/:id
    if (method === 'PUT' && url.startsWith('/api/documents/')) {
      const id = url.split('/').pop();
      const idx = documents.findIndex(d => d._id === id);
      if (idx === -1) {
        send(req, res, 404, { error: 'Document not found' });
      } else {
        const body = await parseBody(req);
        documents[idx] = { ...documents[idx], ...body, updatedAt: new Date() };
        send(req, res, 200, { success: true, message: 'Document updated', document: documents[idx] });
      }
      return;
    }

    // DELETE /api/documents/:id
    if (method === 'DELETE' && url.startsWith('/api/documents/')) {
      const id = url.split('/').pop();
      const idx = documents.findIndex(d => d._id === id);
      if (idx === -1) {
        send(req, res, 404, { error: 'Document not found' });
      } else {
        const removed = documents.splice(idx, 1)[0];
        send(req, res, 200, { success: true, message: 'Document deleted', document: removed });
      }
      return;
    }

    // Templates
    if (method === 'GET' && (url === '/api/templates' || url === '/api/templates/')) {
      send(req, res, 200, { success: true, templates });
      return;
    }
    if (method === 'POST' && (url === '/api/templates' || url === '/api/templates/')) {
      const body = await parseBody(req);
      if (!body.name || !body.content) {
        send(req, res, 400, { error: 'Name and content are required' });
        return;
      }
      const t = { _id: String(Date.now()), name: body.name, description: body.description || '', content: body.content, category: body.category || '', isPublic: !!body.isPublic };
      templates.push(t);
      send(req, res, 201, { success: true, message: 'Template created', template: t });
      return;
    }
    if (method === 'GET' && url.startsWith('/api/templates/')) {
      const id = url.split('/').pop();
      const t = templates.find(x => x._id === id);
      if (!t) return send(req, res, 404, { error: 'Template not found' });
      send(req, res, 200, { success: true, template: t });
      return;
    }
    if (method === 'PUT' && url.startsWith('/api/templates/')) {
      const id = url.split('/').pop();
      const idx = templates.findIndex(x => x._id === id);
      if (idx === -1) return send(req, res, 404, { error: 'Template not found' });
      const body = await parseBody(req);
      templates[idx] = { ...templates[idx], ...body, updatedAt: new Date() };
      send(req, res, 200, { success: true, message: 'Template updated', template: templates[idx] });
      return;
    }
    if (method === 'DELETE' && url.startsWith('/api/templates/')) {
      const id = url.split('/').pop();
      const idx = templates.findIndex(x => x._id === id);
      if (idx === -1) return send(req, res, 404, { error: 'Template not found' });
      const removed = templates.splice(idx, 1)[0];
      send(req, res, 200, { success: true, message: 'Template deleted', template: removed });
      return;
    }

    // POST /api/pdf/text-to-pdf (generate PDF blob)
    if (method === 'POST' && (url === '/api/pdf/text-to-pdf' || url === '/api/pdf/text-to-pdf/')) {
      const body = await parseBody(req);
      const title = body.title || 'document';
      const text = body.text || '';
      const pdf = makeSimplePDF(title, text);
      const headers = setCookieHeaders(req.headers.origin);
      headers['Content-Type'] = 'application/pdf';
      headers['Content-Disposition'] = 'attachment; filename="' + (title.replace(/[^a-z0-9.-]/gi, '_') || 'document') + '.pdf"';
      res.writeHead(200, headers);
      res.end(pdf);
      return;
    }

    // POST /api/pdf/generate
    if (method === 'POST' && (url === '/api/pdf/generate' || url === '/api/pdf/generate/')) {
      const body = await parseBody(req);
      const title = body.title || 'document';
      const content = body.content || '';
      const pdf = makeSimplePDF(title, content);
      const headers = setCookieHeaders(req.headers.origin);
      headers['Content-Type'] = 'application/pdf';
      headers['Content-Disposition'] = 'attachment; filename="' + (title.replace(/[^a-z0-9.-]/gi, '_') || 'document') + '.pdf"';
      res.writeHead(200, headers);
      res.end(pdf);
      return;
    }

    // POST /api/convert
    if (method === 'POST' && (url === '/api/convert' || url === '/api/convert/')) {
      const body = await parseBody(req);
      const title = body.title || 'document';
      let text = body.text || '';
      if (!text && body.base64) {
        text = Buffer.from(body.base64, 'base64').toString('utf8');
      }
      const pdf = makeSimplePDF(title, text);
      const headers = setCookieHeaders(req.headers.origin);
      headers['Content-Type'] = 'application/pdf';
      headers['Content-Disposition'] = 'attachment; filename="' + (title.replace(/[^a-z0-9.-]/gi, '_') || 'document') + '.pdf"';
      res.writeHead(200, headers);
      res.end(pdf);
      return;
    }

    send(req, res, 404, { error: 'Not found', message: 'See server-health.js for supported routes.' });
  } catch (err) {
    send(req, res, 500, { error: 'Server error', details: err.message });
  }
});

server.listen(PORT, '0.0.0.0', () => {
  console.log('Backend (health-only) running on http://localhost:' + PORT);
  console.log('  GET  /api/health');
  console.log('  AUTH /api/auth/register | /api/auth/login | /api/auth/logout');
  console.log('  DOCS GET/POST /api/documents, GET/PUT/DELETE /api/documents/:id');
  console.log('  TEMPLATES CRUD /api/templates...');
  console.log('  PDF POST /api/pdf/generate | /api/pdf/text-to-pdf');
  console.log('  CONVERT POST /api/convert');
});
