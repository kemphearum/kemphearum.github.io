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
    
    // Check if we need to restore scroll position
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
