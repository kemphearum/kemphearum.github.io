import React, { useCallback, useEffect, useRef } from 'react';
import { useLocation, useLoaderData } from 'react-router';
import Navbar from '@/sections/Navbar';
import Hero from '@/sections/Hero';
import About from '@/sections/About';
import FeaturedProjects from '@/sections/FeaturedProjects';
import FeaturedBlogs from '@/sections/FeaturedBlogs';
import Contact from '@/sections/Contact';
import Footer from '@/sections/Footer';
import Experience from '@/sections/Experience';
import Education from '@/sections/Education';
import Skills from '@/sections/Skills';
import Certificates from '@/sections/Certificates';
import CareerHighlights from '@/sections/CareerHighlights';
import RecruiterSnapshot from '@/sections/RecruiterSnapshot';
import Credibility from '@/sections/Credibility';
import BackToTop from '@/sections/BackToTop';
import SettingsService from '../../src/services/SettingsService';
import { normalizeSectionTarget } from '../utils/sectionNavigation';
import { getLocalizedField } from '../utils/localization';
import { buildBrowserTitle } from '../utils/browserTitle';

const getMetaLanguage = () => {
  if (typeof window === 'undefined') return 'en';
  return localStorage.getItem('portfolio.language') === 'km' ? 'km' : 'en';
};

export async function loader() {
  try {
    return await SettingsService.fetchGlobalSettings();
  } catch (error) {
    if (error?.code !== 'unavailable') {
      console.warn('Home Loader Error:', error);
    }
    return null;
  }
}

export function meta({ data }) {
  const language = getMetaLanguage();
  const site = data?.site || data || {};
  const title = buildBrowserTitle(site, language);
  const desc = getLocalizedField(site.tagline, language) || (
    language === 'km'
      ? 'អ្នកជំនាញសន្តិសុខ ICT និងសវនកម្ម IT'
      : 'ICT Security & IT Audit Professional'
  );

  return [
    { title },
    { name: "description", content: desc },
    { property: "og:title", content: title },
    { property: "og:description", content: desc },
    { property: "og:image", content: site.ogImageUrl || "/og-image.png" },
  ];
}

export default function Home() {
  const location = useLocation();
  const data = useLoaderData();
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
    const sections = ['home', 'about', 'experience', 'skills', 'certificates', 'projects', 'blog', 'contact'];

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

    return () => {
      window.removeEventListener('scroll', handleScroll);
      clearTimeout(timeout);
    };
  }, []);

  useEffect(() => {
    const hash = (location.hash || '').replace(/^#/, '');
    if (!hash) return;

    pendingScrollStopRef.current?.();
    pendingScrollStopRef.current = queueSectionScroll(hash, 'auto');
  }, [location.pathname, location.hash, queueSectionScroll]);

  useEffect(() => () => pendingScrollStopRef.current?.(), []);

  return (
    <>
      <Navbar initialSettings={data?.settings} />
      <main>
        <Hero initialData={data?.home} />
        <CareerHighlights 
          initialExperience={data?.experience}
          initialProjects={data?.projects}
          initialCertificates={data?.certificates}
          initialSkills={data?.skills}
        />
        <RecruiterSnapshot 
          initialProfile={data?.profile}
          initialContact={data?.contact}
          initialSkills={data?.skills}
          initialCertificates={data?.certificates}
          initialProjects={data?.projects}
          initialExperience={data?.experience}
        />
        <About initialData={data?.about} initialSkills={data?.skills} />
        <Experience initialData={data?.experience} />
        <Education initialData={data?.education} />
        <Skills initialData={data?.skills} />
        <Certificates initialData={data?.certificates} />
        <Credibility 
          initialAwards={data?.awards}
          initialPublications={data?.publications}
          initialSpeaking={data?.speaking}
        />
        <FeaturedProjects initialData={data?.projects} />
        <FeaturedBlogs initialData={data?.posts} />
        <Contact initialData={data?.contact} initialResume={data?.resume} />
      </main>
      <BackToTop />
      <Footer initialSettings={data?.settings} initialContact={data?.contact} />
    </>
  );
}
