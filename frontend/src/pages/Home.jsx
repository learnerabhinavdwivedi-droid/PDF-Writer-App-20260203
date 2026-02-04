import React from 'react';
import './Home.css';

function Home() {
  return (
    <div className="home">
      <div className="hero">
        <h1>Welcome to PDF Writer</h1>
        <p>Create, edit, and convert documents to PDF with ease</p>
        
        <div className="features">
          <div className="feature-card">
            <span className="feature-icon">✍️</span>
            <h3>Create Documents</h3>
            <p>Write and format your documents with our powerful editor</p>
          </div>
          
          <div className="feature-card">
            <span className="feature-icon">📄</span>
            <h3>Convert to PDF</h3>
            <p>Transform your documents into professional PDF files</p>
          </div>
          
          <div className="feature-card">
            <span className="feature-icon">📚</span>
            <h3>Use Templates</h3>
            <p>Start with pre-designed templates for common documents</p>
          </div>
        </div>

        <div className="cta-buttons">
          <a href="/editor" className="btn btn-primary">Start Writing</a>
          <a href="/auth" className="btn btn-secondary">Sign In</a>
        </div>
      </div>
    </div>
  );
}

export default Home;
