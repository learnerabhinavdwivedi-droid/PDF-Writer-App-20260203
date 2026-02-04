import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import HTMLFlipBook from 'react-pageflip';
import { flipbookAPI } from '../services/api';
import './Flipbook.css';

const Page = React.forwardRef((props, ref) => {
  return (
    <div className="page" ref={ref}>
      <div className="page-content">
        <img src={props.image} alt={`Page ${props.number}`} />
      </div>
    </div>
  );
});

function Flipbook() {
  const location = useLocation();
  const navigate = useNavigate();
  const { content, title, options, pages: preloadedPages } = location.state || {};
  
  const [pages, setPages] = useState(preloadedPages || []);
  const [loading, setLoading] = useState(!preloadedPages);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (preloadedPages) return; // Already have pages from upload

    if (!content) {
      setError('No content provided for flipbook');
      setLoading(false);
      return;
    }

    const fetchPages = async () => {
      try {
        const response = await flipbookAPI.generateFlipbook({ content, options });
        if (response.data.success) {
          setPages(response.data.pages);
        } else {
          setError('Failed to generate flipbook pages');
        }
      } catch (err) {
        setError('Error generating flipbook: ' + err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchPages();
  }, [content, options]);

  if (loading) return <div className="flipbook-loader">Generating your flipbook...</div>;
  if (error) return (
    <div className="flipbook-error">
      <p>{error}</p>
      <button onClick={() => navigate('/editor')} className="btn">Back to Editor</button>
    </div>
  );

  return (
    <div className="flipbook-page">
      <div className="flipbook-header">
        <h2>{title || 'Untitled Book'}</h2>
        <button onClick={() => navigate('/editor')} className="btn btn-secondary">Close</button>
      </div>
      
      <div className="flipbook-container">
        <HTMLFlipBook 
          width={550} 
          height={733} 
          size="stretch"
          minWidth={315}
          maxWidth={1000}
          minHeight={420}
          maxHeight={1350}
          maxShadowOpacity={0.5}
          showCover={true}
          mobileScrollSupport={true}
          className="book"
        >
          {pages.map((page, index) => (
            <Page key={index} number={index + 1} image={page} />
          ))}
        </HTMLFlipBook>
      </div>
      
      <div className="flipbook-footer">
        <p>Use your mouse or swipe to flip pages</p>
      </div>
    </div>
  );
}

export default Flipbook;
