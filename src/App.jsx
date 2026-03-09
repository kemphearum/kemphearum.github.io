import React, { useEffect } from 'react';
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

import AnimatedBackground from './components/AnimatedBackground';

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
      <AnimatedBackground />
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

import { useQuery } from '@tanstack/react-query';
import SettingsService from './services/SettingsService';

function App() {
  // Fetch global settings for title/favicon
  const { data: globalConfig } = useQuery({
    queryKey: ['settings', 'global'],
    queryFn: () => SettingsService.fetchGlobalSettings(),
    staleTime: 1000 * 60 * 5
  });

  useEffect(() => {
    if (globalConfig) {
      // Identity & UI (supports both normalized 'site' and flat legacy)
      const site = globalConfig.site || globalConfig;
      if (site.pageTitle || site.title) document.title = site.pageTitle || site.title;

      const favicon = site.pageFaviconUrl || site.favicon;
      if (favicon) {
        let link = document.querySelector("link[rel~='icon']");
        if (!link) {
          link = document.createElement('link');
          link.rel = 'icon';
          document.head.appendChild(link);
        }
        link.href = favicon;
      }

      // Typography (supports both normalized 'typography' and flat legacy)
      const typpo = globalConfig.typography || globalConfig;
      const fontMap = {
        'inter': "'Inter', system-ui, -apple-system, sans-serif",
        'kantumruy-pro': "'Kantumruy Pro', system-ui, sans-serif",
        'kantumruy-pro-medium': "'Kantumruy Pro', system-ui, sans-serif",
        'battambang': "'Battambang', system-ui, sans-serif",
      };

      const root = document.documentElement;
      const categories = [
        { field: 'fontDisplay', prop: '--font-display', weightProp: '--font-weight-display', defaultWeight: '700' },
        { field: 'fontHeading', prop: '--font-heading', weightProp: '--font-weight-heading', defaultWeight: '700' },
        { field: 'fontSubheading', prop: '--font-subheading', weightProp: '--font-weight-subheading', defaultWeight: '600' },
        { field: 'fontNav', prop: '--font-nav', weightProp: '--font-weight-nav', defaultWeight: '500' },
        { field: 'fontBody', prop: '--font-body', weightProp: '--font-weight-body', defaultWeight: '400' },
        { field: 'fontUI', prop: '--font-ui', weightProp: '--font-weight-ui', defaultWeight: '600' },
      ];

      categories.forEach(({ field, prop, weightProp, defaultWeight }) => {
        const key = typpo[field] || 'inter';
        root.style.setProperty(prop, fontMap[key] || fontMap['inter']);
        root.style.setProperty(weightProp, key === 'kantumruy-pro-medium' ? '500' : defaultWeight);
      });

      // Admin Override
      if (typpo.adminFontOverride !== false) {
        root.setAttribute('data-admin-font', 'inter');
      } else {
        root.removeAttribute('data-admin-font');
      }

      const sizeMap = { 'small': '14px', 'default': '16px', 'large': '18px', 'extra-large': '20px' };
      const sizeKey = typpo.fontSize || 'default';
      root.style.setProperty('--font-size-base', sizeMap[sizeKey] || '16px');
    }
  }, [globalConfig]);

  const siteConfig = globalConfig?.site || globalConfig || {};
  const bgDensity = siteConfig.bgDensity ?? 50;
  const bgSpeed = siteConfig.bgSpeed ?? 50;
  const bgGlowOpacity = siteConfig.bgGlowOpacity ?? 50;
  const bgInteractive = siteConfig.bgInteractive ?? true;
  const bgStyle = siteConfig.bgStyle || 'plexus';

  return (
    <Router>
      <ScrollToTop />
      <AnimatedBackground
        density={bgDensity}
        speed={bgSpeed}
        glowOpacity={bgGlowOpacity}
        interactive={bgInteractive}
        variant={bgStyle}
      />
      <AppRoutes />
    </Router>
  );
}

export default App;
