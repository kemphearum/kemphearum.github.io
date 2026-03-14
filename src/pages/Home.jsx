import React, { useEffect } from 'react';
import Navbar from '../../src/components/Navbar';
import Hero from '../../src/components/Hero';
import About from '../../src/components/About';
import Projects from '../../src/components/Projects';
import FeaturedProjects from '../../src/components/FeaturedProjects';
import FeaturedBlogs from '../../src/components/FeaturedBlogs';
import Contact from '../../src/components/Contact';
import Footer from '../../src/components/Footer';
import Experience from '../../src/components/Experience';
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
    
    // Handle hash scrolling on initial mount or when hash changes
    const scrollToHash = () => {
      const hash = window.location.hash.substring(1);
      if (hash) {
        const checkElement = setInterval(() => {
          const el = document.getElementById(hash);
          if (el && el.getBoundingClientRect().height > 50) {
            const headerOffset = 70;
            const elementPosition = el.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
            window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
            clearInterval(checkElement);
          }
        }, 100);
        setTimeout(() => clearInterval(checkElement), 3000);
      }
    };

    // Check if we need to restore scroll position or scroll to hash
    const isReload = window.performance &&
      window.performance.getEntriesByType("navigation").length > 0 &&
      window.performance.getEntriesByType("navigation")[0].type === "reload";

    if (isReload) {
      const savedSection = sessionStorage.getItem('activeHomeSection');
      if (savedSection && savedSection !== 'home') {
        const scrollInterval = setInterval(() => {
          const el = document.getElementById(savedSection);
          if (el && el.getBoundingClientRect().height > 50) {
            const headerOffset = 70;
            const elementPosition = el.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
            window.scrollTo({ top: offsetPosition, behavior: 'auto' });

            if (window.scrollY > 50) {
              clearInterval(scrollInterval);
            }
          }
        }, 100);
        setTimeout(() => clearInterval(scrollInterval), 3000);
      }
    } else {
      // If not a reload, check for hash and scroll to it
      scrollToHash();
    }

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
}
