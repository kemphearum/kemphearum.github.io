import React from 'react';
import MaintenancePage from '@/sections/MaintenancePage';
import { useTranslation } from '../hooks/useTranslation';

const getMetaLanguage = () => {
  if (typeof window === 'undefined') return 'en';
  return localStorage.getItem('portfolio.language') === 'km' ? 'km' : 'en';
};

export function meta() {
  const language = getMetaLanguage();
  const tr = (enText, kmText) => (language === 'km' ? kmText : enText);
  return [
    { title: `${tr('404 - Lost in Space', '404 - រកផ្លូវមិនឃើញ')} | Kem Phearum` },
    { name: "description", content: tr("The page you are looking for does not exist.", "ទំព័រដែលអ្នកកំពុងស្វែងរកមិនមានទេ។") }
  ];
}

export default function NotFound() {
  const { language } = useTranslation();
  const tr = (enText, kmText) => (language === 'km' ? kmText : enText);

  return (
    <MaintenancePage 
      title={tr('404 - Lost in Space', '404 - រកផ្លូវមិនឃើញ')}
      message={tr('The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.', 'ទំព័រដែលអ្នកកំពុងស្វែងរកអាចត្រូវបានលុប ប្តូរឈ្មោះ ឬមិនអាចប្រើបានជាបណ្តោះអាសន្ន។')}
    />
  );
}
