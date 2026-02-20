import React, { useEffect } from 'react';
import { useFirebaseDoc } from './hooks/useFirebaseData';
import { HashRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import About from './components/About';
import Projects from './components/Projects';
import Contact from './components/Contact';
import Admin from './pages/Admin';
import Footer from './components/Footer';
import Experience from './components/Experience';
import Blog from './pages/Blog';
import BlogPost from './pages/BlogPost';
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
      <Experience />
      <Projects />
      <Contact />
    </main>
    <Footer />
  </>
);

function App() {
  // Fetch global settings for title/favicon
  const { data: settings } = useFirebaseDoc('content', 'settings');

  useEffect(() => {
    if (settings) {
      if (settings.pageTitle) document.title = settings.pageTitle;
      if (settings.pageFaviconUrl) {
        let link = document.querySelector("link[rel~='icon']");
        if (!link) {
          link = document.createElement('link');
          link.rel = 'icon';
          document.head.appendChild(link);
        }
        link.href = settings.pageFaviconUrl;
      }
    }
  }, [settings]);

  return (
    <Router>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<Main />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/blog" element={<Blog />} />
        <Route path="/blog/:slug" element={<BlogPost />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
