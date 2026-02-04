import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Editor from './pages/Editor.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Auth from './pages/Auth.jsx';
import Home from './pages/Home.jsx';
import './App.css';
import Navbar from './components/Navbar.jsx';

function App() {
  return (
    <Router>
      <div className="App">
        <Navbar />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/editor" element={<Editor />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/auth" element={<Auth />} />
          </Routes>
        </main>
        <footer className="footer">
          <p>&copy; 2026 PDF Writer App. All rights reserved.</p>
        </footer>
      </div>
    </Router>
  );
}

export default App;
