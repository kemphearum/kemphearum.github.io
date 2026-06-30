import React from 'react';
import MaintenancePage from '@/sections/MaintenancePage';
import { useTranslation } from '../hooks/useTranslation';

export default function NotFound() {
  const { t } = useTranslation();

  return (
    <MaintenancePage 
      title={t('ui.404LostInSpace')}
      message={t('ui.thePageYouAreLookingForMi')}
    />
  );
}
