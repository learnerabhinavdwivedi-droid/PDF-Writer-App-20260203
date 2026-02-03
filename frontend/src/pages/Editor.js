import React, { useRef, useState } from 'react';
import { documentAPI, pdfAPI, templateAPI, convertAPI } from '../services/api';
import './Editor.css';

function Editor() {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const contentRef = useRef(null);

  const handleGeneratePDF = async () => {
    if (!title || !content) {
      setMessage('Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      const response = await pdfAPI.textToPDF({ text: content, title });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${title}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);

      setMessage('PDF downloaded successfully!');
    } catch (error) {
      setMessage('Error generating PDF: ' + (error.response?.data?.error || error.message));
    }
    setLoading(false);
  };

  const handleSaveDocument = async () => {
    if (!title || !content) {
      setMessage('Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      await documentAPI.createDocument({
        title,
        content,
        author: 'Current User'
      });

      setMessage('Document saved successfully!');
      setTitle('');
      setContent('');
    } catch (error) {
      setMessage('Error saving document: ' + (error.response?.data?.error || error.message));
    }
    setLoading(false);
  };

  const handleUseTemplate = async () => {
    try {
      const res = await templateAPI.getAllTemplates();
      const templates = res.data.templates || [];
      if (templates.length === 0) {
        setMessage('No templates available');
        return;
      }
      const names = templates.map(t => t.name).join(', ');
      const choice = prompt(`Templates available: ${names}\nType a template name to load:`, templates[0].name);
      const selected = templates.find(t => t.name === choice) || templates[0];
      setTitle(selected.name);
      setContent(selected.content);
      setMessage('Template loaded');
    } catch (err) {
      setMessage('Error loading templates: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleConvert = async () => {
    if (!title || !content) {
      setMessage('Please fill in all fields');
      return;
    }
    setLoading(true);
    try {
      const response = await convertAPI.convert({ title, text: content });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${title}-convert.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
      setMessage('Converted PDF downloaded successfully!');
    } catch (error) {
      setMessage('Error converting: ' + (error.response?.data?.error || error.message));
    }
    setLoading(false);
  };

  const wrapSelection = (wrapperStart, wrapperEnd = wrapperStart) => {
    const el = contentRef.current;
    if (!el) return;
    const start = el.selectionStart ?? 0;
    const end = el.selectionEnd ?? 0;
    const before = content.slice(0, start);
    const selected = content.slice(start, end);
    const after = content.slice(end);
    const newVal = before + wrapperStart + selected + wrapperEnd + after;
    setContent(newVal);
    setTimeout(() => {
      el.focus();
      el.selectionStart = start + wrapperStart.length;
      el.selectionEnd = end + wrapperStart.length;
    }, 0);
  };

  const applyBold = () => wrapSelection('**');
  const applyItalic = () => wrapSelection('*');

  return (
    <div className="editor">
      <div className="editor-header">
        <h2>Document Editor</h2>
        <p>Create and edit your documents here</p>
      </div>

      {message && <div className="message">{message}</div>}

      <div className="editor-container">
        <div className="editor-form">
          <div className="form-group">
            <label>Document Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter document title"
              className="input"
            />
          </div>

          <div className="form-group">
            <label>Content</label>
              <div className="toolbar">
                <button type="button" className="btn btn-small" onClick={applyBold}><b>B</b></button>
                <button type="button" className="btn btn-small" onClick={applyItalic}><i>I</i></button>
              </div>
            <textarea
                ref={contentRef}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write your content here..."
              className="textarea"
              rows="10"
            />
          </div>

          <div className="button-group">
            <button
              onClick={handleSaveDocument}
              disabled={loading}
              className="btn btn-save"
            >
              {loading ? 'Saving...' : '💾 Save Document'}
            </button>
            <button
              onClick={handleGeneratePDF}
              disabled={loading}
              className="btn btn-pdf"
            >
              {loading ? 'Generating...' : '📥 Generate PDF'}
            </button>
            <button
              onClick={handleConvert}
              disabled={loading}
              className="btn btn-convert"
            >
              🔁 Convert to PDF
            </button>
            <button
              onClick={handleUseTemplate}
              disabled={loading}
              className="btn btn-template"
            >
              📚 Use Templates
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Editor;
