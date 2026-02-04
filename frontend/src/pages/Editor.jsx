import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { documentAPI, pdfAPI } from '../services/api';
import './Editor.css';

function Editor() {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const contentRef = useRef(null);
  const navigate = useNavigate();

  const handleGeneratePDF = async () => {
    if (!title || !content) {
      setError('Please fill in all fields');
      setMessage('');
      return;
    }

    setLoading(true);
    try {
      const response = await pdfAPI.generatePDF({ text: content, title });
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
      setError('');
    } catch (error) {
      setError('Error generating PDF: ' + error.message);
      setMessage('');
    }
    setLoading(false);
  };

  const handleSaveDocument = async () => {
    if (!title || !content) {
      setError('Please fill in all fields');
      setMessage('');
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
      setError('');
      setTitle('');
      setContent('');
    } catch (error) {
      setError('Error saving document: ' + error.message);
      setMessage('');
    }
    setLoading(false);
  };

  return (
    <div className="editor">
      <div className="editor-header">
        <h2>Document Editor</h2>
        <p>Create and edit your documents here</p>
      </div>

      {message && <div className="message">{message}</div>}
      {error && <div className="error-message">{error}</div>}

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
              rows="15"
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
          </div>
        </div>
      </div>
    </div>
  );
}

export default Editor;
