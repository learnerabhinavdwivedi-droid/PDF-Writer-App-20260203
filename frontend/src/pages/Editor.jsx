import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { documentAPI, pdfAPI, templateAPI, convertAPI } from '../services/api';
import './Editor.css';

function Editor() {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const contentRef = useRef(null);
  const navigate = useNavigate();

  const handleGeneratePDF = async () => {
    if (!title || !content) {
      setMessage('Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      const response = await pdfAPI.textToPDF({ text: content, title });
      const blob = response.data;
      const url = window.URL.createObjectURL(blob);
      window.open(url, '_blank');
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${title}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode && link.parentNode.removeChild(link);
      setTimeout(() => window.URL.revokeObjectURL(url), 5000);

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
      setContent(selected.content || selected.description || selected.name || '');
      setMessage(selected.description ? `Template loaded: ${selected.description}` : 'Template loaded');
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
      const blob = response.data;
      const url = window.URL.createObjectURL(blob);
      window.open(url, '_blank');
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${title}-convert.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode && link.parentNode.removeChild(link);
      setTimeout(() => window.URL.revokeObjectURL(url), 5000);
      setMessage('Converted PDF downloaded successfully!');
    } catch (error) {
      setMessage('Error converting: ' + (error.response?.data?.error || error.message));
    }
    setLoading(false);
  };

  const handleViewFlipbook = () => {
    if (!title || !content) {
      setMessage('Please fill in all fields');
      return;
    }
    navigate('/flipbook', { state: { title, content } });
  };

  // Content is plain text; no formatting helpers

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
              className="btn btn-secondary"
            >
              {loading ? 'Saving...' : '💾 Save Document'}
            </button>
            <button
              onClick={handleGeneratePDF}
              disabled={loading}
              className="btn btn-primary"
            >
              {loading ? 'Generating...' : '📥 Generate PDF'}
            </button>
            <button
              onClick={handleConvert}
              disabled={loading}
              className="btn"
            >
              🔁 Convert to PDF
            </button>
            <button
              onClick={handleViewFlipbook}
              disabled={loading}
              className="btn btn-flip"
            >
              📖 View as Flipbook
            </button>
            <button
              onClick={handleUseTemplate}
              disabled={loading}
              className="btn"
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
