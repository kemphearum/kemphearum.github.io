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
    const hashAliases = {
      'featured-blogs': 'blog'
    };
    const resolveSectionId = (id) => hashAliases[id] || id;
    const sections = ['home', 'about', 'experience', 'projects', 'blog', 'contact'];

    const scrollToSectionWithOffset = (sectionId, behavior = 'smooth') => {
      const targetId = resolveSectionId(sectionId);
      const checkElement = setInterval(() => {
        const el = document.getElementById(targetId);
        if (el && el.getBoundingClientRect().height > 50) {
          const headerOffset = 70;
          const elementPosition = el.getBoundingClientRect().top;
          const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
          window.scrollTo({ top: offsetPosition, behavior });
          clearInterval(checkElement);
        }
      }, 100);
      setTimeout(() => clearInterval(checkElement), 3000);
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
        scrollToSectionWithOffset(hash, 'smooth');
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
        scrollToSectionWithOffset(savedSection, 'auto');
      }
    } else {
      // If not a reload, check for hash and scroll to it
      scrollToHash();
    }

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('hashchange', scrollToHash);
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
}
