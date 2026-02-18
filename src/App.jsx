import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import About from './components/About';
import Projects from './components/Projects';
import Contact from './components/Contact';
import Admin from './pages/Admin';
import './styles/global.scss';

// Component to handle scroll to top on route change
const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
};

const Main = () => (
  <>
    <Navbar />
    <main>
      <Hero />
      <About />
      <Projects />
      <Contact />
    </main>
    <footer style={{
      textAlign: 'center',
      padding: '2rem',
      color: '#6e6d7a',
      backgroundColor: '#f9f9fc',
      borderTop: '1px solid rgba(0,0,0,0.05)'
    }}>
      <p>&copy; {new Date().getFullYear()} Developer Portfolio. Built with React & Firebase.</p>
    </footer>
  </>
);

function App() {
  // Use basename to support deployment to subdirectories (like GitHub Pages)
  return (
    <Router basename={import.meta.env.BASE_URL}>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<Main />} />
        <Route path="/admin" element={<Admin />} />
      </Routes>
    </Router>
  );
}

export default App;
