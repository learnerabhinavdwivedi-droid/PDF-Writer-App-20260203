import React, { useState, useEffect } from 'react';
import { documentAPI } from '../services/api';
import './Dashboard.css';

function Dashboard() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      const response = await documentAPI.getAllDocuments();
      setDocuments(response.data.documents || response.data || []);
      setError('');
    } catch (err) {
      setError(err.message || 'Failed to fetch documents');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this document?')) {
      try {
        await documentAPI.deleteDocument(id);
        setDocuments(documents.filter(doc => doc._id !== id));
      } catch (err) {
        setError(err.message || 'Failed to delete document');
      }
    }
  };

  const handleView = async (id) => {
    try {
      const res = await documentAPI.getDocumentById(id);
      const doc = res.data.document || res.data;
      alert(`Title: ${doc.title}\n\n${doc.content}`);
    } catch (err) {
      setError(err.message || 'Failed to view document');
    }
  };

  const handleEdit = async (id) => {
    try {
      const res = await documentAPI.getDocumentById(id);
      const doc = res.data.document || res.data;
      const newTitle = prompt('Edit title:', doc.title);
      if (newTitle === null) return;
      const newContent = prompt('Edit content:', doc.content);
      if (newContent === null) return;
      const updateRes = await documentAPI.updateDocument(id, { title: newTitle, content: newContent });
      const updated = updateRes.data.document || updateRes.data;
      setDocuments(docs => docs.map(d => d._id === id ? updated : d));
    } catch (err) {
      setError(err.message || 'Failed to edit document');
    }
  };

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h2>Dashboard</h2>
        <p>Manage your saved documents</p>
      </div>

      {error && <div className="error-message">{error}</div>}

      {loading ? (
        <div className="loading">Loading documents...</div>
      ) : documents.length === 0 ? (
        <div className="empty-state">
          <p>No documents yet. Start by creating one!</p>
        </div>
      ) : (
        <div className="documents-list">
          <table className="docs-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Author</th>
                <th>Created</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {documents.map((doc) => (
                <tr key={doc._id}>
                  <td className="doc-title">{doc.title}</td>
                  <td>{doc.author}</td>
                  <td>{new Date(doc.createdAt).toLocaleDateString()}</td>
                  <td>
                    <span className={`status ${doc.status}`}>{doc.status}</span>
                  </td>
                  <td className="actions">
                    <button className="btn-view" onClick={() => handleView(doc._id)}>View</button>
                    <button className="btn-edit" onClick={() => handleEdit(doc._id)}>Edit</button>
                    <button
                      className="btn-delete"
                      onClick={() => handleDelete(doc._id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default Dashboard;
