import React from 'react';
import MaintenancePage from '@/sections/MaintenancePage';
import { useTranslation } from '../hooks/useTranslation';

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
