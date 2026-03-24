import React, { useCallback, useEffect, useRef } from 'react';
import { useLocation } from 'react-router';
import Navbar from '@/sections/Navbar';
import Hero from '@/sections/Hero';
import About from '@/sections/About';
import Projects from '@/sections/Projects';
import FeaturedProjects from '@/sections/FeaturedProjects';
import FeaturedBlogs from '@/sections/FeaturedBlogs';
import Contact from '@/sections/Contact';
import Footer from '@/sections/Footer';
import Experience from '@/sections/Experience';
import SettingsService from '../../src/services/SettingsService';
import { normalizeSectionTarget, scrollToSectionWithOffset as scrollToSectionOffset } from '../utils/sectionNavigation';
import { getLocalizedField } from '../utils/localization';

const getMetaLanguage = () => {
  if (typeof window === 'undefined') return 'en';
  return localStorage.getItem('portfolio.language') === 'km' ? 'km' : 'en';
};

export async function loader() {
  try {
    return await SettingsService.fetchGlobalSettings();
  } catch (error) {
    console.error("Home Loader Error:", error);
    return null;
  }
}

export function meta({ data }) {
  const language = getMetaLanguage();
  const tr = (enText, kmText) => (language === 'km' ? kmText : enText);
  const site = data?.site || data || {};
  const title = getLocalizedField(site.pageTitle || site.title, language) || tr("Kem Phearum | Portfolio", "Kem Phearum | ផតថលីយ៉ូ");
  const desc = getLocalizedField(site.pageDescription || site.description, language) || tr("ICT Security & IT Audit Professional", "អ្នកជំនាញ ICT Security និង IT Audit");
  
  return [
    { title },
    { name: "description", content: desc },
    { property: "og:title", content: title },
    { property: "og:description", content: desc },
    { property: "og:image", content: site.pageFaviconUrl || "/vite.svg" },
  ];
}

export default function Home() {
  const location = useLocation();
  const pendingScrollStopRef = useRef(null);

  const queueSectionScroll = useCallback((sectionId, behavior = 'smooth') => {
    const targetId = normalizeSectionTarget(sectionId);
    let attempts = 0;
    const maxAttempts = 35;
    
    // Safety: ensure body isn't locked if we are trying to scroll
    if (typeof document !== 'undefined') {
      document.body.style.overflow = '';
    }

    const checkElement = setInterval(() => {
      const element = document.getElementById(targetId);
      if (element) {
        element.scrollIntoView({ behavior: attempts === 0 ? behavior : 'auto' });
        clearInterval(checkElement);
        return;
      }
      
      attempts += 1;
      if (attempts >= maxAttempts) {
        clearInterval(checkElement);
        window.location.assign(targetId === 'home' ? '/' : `/#${targetId}`);
      }
    }, 100);

    return () => clearInterval(checkElement);
  }, []);

  // Track scroll position to save the active section
  useEffect(() => {
    let timeout;
    const sections = ['home', 'about', 'experience', 'projects', 'blog', 'contact'];

    const handleScroll = () => {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
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

    // Check if we need to restore scroll position or scroll to hash
    const isReload = window.performance &&
      window.performance.getEntriesByType("navigation").length > 0 &&
      window.performance.getEntriesByType("navigation")[0].type === "reload";

    if (!window.location.hash && isReload) {
      const savedSection = sessionStorage.getItem('activeHomeSection');
      if (savedSection && savedSection !== 'home') {
        pendingScrollStopRef.current?.();
        pendingScrollStopRef.current = queueSectionScroll(savedSection, 'auto');
      }
    }

    return () => {
      window.removeEventListener('scroll', handleScroll);
      clearTimeout(timeout);
      pendingScrollStopRef.current?.();
    };
  }, [queueSectionScroll]);

  useEffect(() => {
    const hash = (location.hash || '').replace(/^#/, '');
    if (!hash) return;

    pendingScrollStopRef.current?.();
    pendingScrollStopRef.current = queueSectionScroll(hash, 'auto');
  }, [location.pathname, location.hash, queueSectionScroll]);

  useEffect(() => () => pendingScrollStopRef.current?.(), []);

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
}
