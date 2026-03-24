import React, { useEffect } from 'react';
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

export async function loader() {
  try {
    return await SettingsService.fetchGlobalSettings();
  } catch (error) {
    console.error("Home Loader Error:", error);
    return null;
  }
}

export function meta({ data }) {
  const site = data?.site || data || {};
  const title = site.pageTitle || site.title || "Kem Phearum | Portfolio";
  const desc = site.pageDescription || site.description || "ICT Security & IT Audit Professional";
  
  return [
    { title },
    { name: "description", content: desc },
    { property: "og:title", content: title },
    { property: "og:description", content: desc },
    { property: "og:image", content: site.pageFaviconUrl || "/vite.svg" },
  ];
}

export default function Home() {
  // Track scroll position to save the active section
  useEffect(() => {
    let timeout;
    let stopPendingScroll = null;
    const sections = ['home', 'about', 'experience', 'projects', 'blog', 'contact'];

    const scrollToSectionWithRetry = (sectionId, behavior = 'smooth') => {
      const targetId = normalizeSectionTarget(sectionId);
      let attempts = 0;
      const maxAttempts = 35;
      const checkElement = setInterval(() => {
        const scrolled = scrollToSectionOffset(targetId, {
          headerOffset: 70,
          behavior: attempts === 0 ? behavior : 'auto'
        });
        attempts += 1;

        // Keep retrying briefly even after first success to avoid scroll restoration overriding hash navigation.
        if (attempts >= maxAttempts && !scrolled) {
          window.location.assign(targetId === 'home' ? '/' : `/#${targetId}`);
        }
        if (attempts >= maxAttempts) clearInterval(checkElement);
      }, 100);

      return () => clearInterval(checkElement);
    };

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
    
    // Handle hash scrolling on initial mount or when hash changes
    const scrollToHash = () => {
      const hash = window.location.hash.substring(1);
      if (hash) {
        stopPendingScroll?.();
        stopPendingScroll = scrollToSectionWithRetry(hash, 'auto');
      }
    };
    window.addEventListener('hashchange', scrollToHash);

    // Check if we need to restore scroll position or scroll to hash
    const isReload = window.performance &&
      window.performance.getEntriesByType("navigation").length > 0 &&
      window.performance.getEntriesByType("navigation")[0].type === "reload";

    if (window.location.hash) {
      // Hash navigation always takes priority over saved scroll state
      scrollToHash();
    } else if (isReload) {
      const savedSection = sessionStorage.getItem('activeHomeSection');
      if (savedSection && savedSection !== 'home') {
        stopPendingScroll?.();
        stopPendingScroll = scrollToSectionWithRetry(savedSection, 'auto');
      }
    } else {
      // If not a reload, check for hash and scroll to it
      scrollToHash();
    }

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('hashchange', scrollToHash);
      clearTimeout(timeout);
      stopPendingScroll?.();
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
}
