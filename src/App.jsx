import React, { useEffect } from 'react';
import { useFirebaseDoc } from './hooks/useFirebaseData';
import { HashRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import About from './components/About';
import Projects from './components/Projects';
import FeaturedProjects from './components/FeaturedProjects';
import FeaturedBlogs from './components/FeaturedBlogs';
import Contact from './components/Contact';
import Admin from './pages/Admin';
import Footer from './components/Footer';
import Experience from './components/Experience';
import Blog from './pages/Blog';
import BlogPost from './pages/BlogPost';
import ProjectsPage from './pages/ProjectsPage';
import ProjectDetail from './pages/ProjectDetail';
import './styles/global.scss';

// Component to handle scroll restoration or scroll to top
const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    // Determine if this is a page reload vs a client-side navigation
    const isReload = window.performance &&
      window.performance.getEntriesByType("navigation").length > 0 &&
      window.performance.getEntriesByType("navigation")[0].type === "reload";

    if (isReload && pathname === '/') {
      const savedSection = sessionStorage.getItem('activeHomeSection');
      if (savedSection && savedSection !== 'home') {
        // Poll for the section to render since Firebase data loads async
        const scrollInterval = setInterval(() => {
          const el = document.getElementById(savedSection);
          // If the element exists and has content (height > 50px)
          if (el && el.getBoundingClientRect().height > 50) {
            const headerOffset = 70;
            const elementPosition = el.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
            window.scrollTo({ top: offsetPosition, behavior: 'auto' });

            // Clear interval once we are successfully scrolled past the very top
            if (window.scrollY > 50) {
              clearInterval(scrollInterval);
            }
          }
        }, 100);

        // Failsafe: stop trying after 3 seconds
        setTimeout(() => clearInterval(scrollInterval), 3000);
        return () => clearInterval(scrollInterval);
      }
    } else {
      window.scrollTo(0, 0);
    }
  }, [pathname]);

  return null;
};

const Main = () => {
  // Track scroll position to save the active section
  useEffect(() => {
    let timeout;
    const handleScroll = () => {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        const sections = ['home', 'about', 'experience', 'projects', 'featured-blogs', 'contact'];
        for (const id of sections) {
          const el = document.getElementById(id);
          if (el) {
            const rect = el.getBoundingClientRect();
            // Check if the top of this section is within the visible viewport
            if (rect.top >= -window.innerHeight / 2 && rect.top <= window.innerHeight / 2) {
              sessionStorage.setItem('activeHomeSection', id);
              break;
            }
          }
        }
      }, 100); // debounce scroll
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      clearTimeout(timeout);
    };
  }, []);

  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <About />
        <Experience />
        <FeaturedProjects />
        <FeaturedBlogs />
        <Contact />
      </main>
      <Footer />
    </>
  );
};

import { useAnalytics } from './hooks/useAnalytics';

// Create an inner component to run analytics *inside* the required <Router> context
const AppRoutes = () => {
  useAnalytics(); // This tracks route changes globally

  return (
    <Routes>
      <Route path="/" element={<Main />} />
      <Route path="/admin" element={<Admin />} />
      <Route path="/projects" element={<ProjectsPage />} />
      <Route path="/projects/:slug" element={<ProjectDetail />} />
      <Route path="/blog" element={<Blog />} />
      <Route path="/blog/:slug" element={<BlogPost />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

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
      <AppRoutes />
    </Router>
  );
}

export default App;
