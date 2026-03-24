import React from 'react';
import MaintenancePage from '@/sections/MaintenancePage';

export function meta() {
  return [
    { title: "404 - Lost in Space | Kem Phearum" },
    { name: "description", content: "The page you are looking for does not exist." }
  ];
}

export default function NotFound() {
  return (
    <MaintenancePage 
      title="404 - Lost in Space"
      message="The page you are looking for might have been removed, had its name changed, or is temporarily unavailable."
    />
  );
}
