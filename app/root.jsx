import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "react-router";
import ErrorBoundary from '../src/components/ErrorBoundary';
import { ThemeProvider } from '../src/context/ThemeContext';
import { ActivityProvider } from '../src/context/ActivityContext';
import { QueryClientProvider, useQuery } from '@tanstack/react-query';
import { queryClient } from '../src/queryClient';
import React, { useEffect } from 'react';
import SettingsService from '../src/services/SettingsService';
import AnimatedBackground from '../src/components/AnimatedBackground';
import '../src/styles/global.scss';
import { useAnalytics } from '../src/hooks/useAnalytics';

export function Layout({ children }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="UTF-8" />
        <link rel="icon" type="image/svg+xml" href="/vite.svg" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <Meta />
        <Links />
      </head>
      <body>
          <ErrorBoundary>
            <QueryClientProvider client={queryClient}>
              <ThemeProvider>
                <ActivityProvider>
                  {children}
                </ActivityProvider>
              </ThemeProvider>
            </QueryClientProvider>
          </ErrorBoundary>
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

function SettingsApplier({ children }) {
  useAnalytics();

  const { data: globalConfig } = useQuery({
    queryKey: ['settings', 'global'],
    queryFn: () => SettingsService.fetchGlobalSettings(),
    staleTime: 1000 * 60 * 5
  });

  useEffect(() => {
    if (globalConfig) {
      const site = globalConfig.site || globalConfig;
      if (site.pageTitle || site.title) document.title = site.pageTitle || site.title;

      const favicon = site.pageFaviconUrl || site.favicon;
      if (favicon) {
        let link = document.querySelector("link[rel~='icon']");
        if (!link) {
          link = document.createElement('link');
          link.rel = 'icon';
          document.head.appendChild(link);
        }
        link.href = favicon;
      }

      const typpo = globalConfig.typography || globalConfig;
      const fontMap = {
        'inter': "'Inter', system-ui, -apple-system, sans-serif",
        'kantumruy-pro': "'Kantumruy Pro', system-ui, sans-serif",
        'kantumruy-pro-medium': "'Kantumruy Pro', system-ui, sans-serif",
        'battambang': "'Battambang', system-ui, sans-serif",
      };

      const root = document.documentElement;
      const categories = [
        { field: 'fontDisplay', prop: '--font-display', weightProp: '--font-weight-display', defaultWeight: '700' },
        { field: 'fontHeading', prop: '--font-heading', weightProp: '--font-weight-heading', defaultWeight: '700' },
        { field: 'fontSubheading', prop: '--font-subheading', weightProp: '--font-weight-subheading', defaultWeight: '600' },
        { field: 'fontNav', prop: '--font-nav', weightProp: '--font-weight-nav', defaultWeight: '500' },
        { field: 'fontBody', prop: '--font-body', weightProp: '--font-weight-body', defaultWeight: '400' },
        { field: 'fontUI', prop: '--font-ui', weightProp: '--font-weight-ui', defaultWeight: '600' },
      ];

      categories.forEach(({ field, prop, weightProp, defaultWeight }) => {
        const key = typpo[field] || 'inter';
        root.style.setProperty(prop, fontMap[key] || fontMap['inter']);
        root.style.setProperty(weightProp, key === 'kantumruy-pro-medium' ? '500' : defaultWeight);
      });

      if (typpo.adminFontOverride !== false) {
        root.setAttribute('data-admin-font', 'inter');
      } else {
        root.removeAttribute('data-admin-font');
      }

      const sizeMap = { 'small': '14px', 'default': '16px', 'large': '18px', 'extra-large': '20px' };
      const sizeKey = typpo.fontSize || 'default';
      root.style.setProperty('--font-size-base', sizeMap[sizeKey] || '16px');
    }
  }, [globalConfig]);

  const siteConfig = globalConfig?.site || globalConfig || {};
  const bgDensity = siteConfig.bgDensity ?? 50;
  const bgSpeed = siteConfig.bgSpeed ?? 50;
  const bgGlowOpacity = siteConfig.bgGlowOpacity ?? 50;
  const bgInteractive = siteConfig.bgInteractive ?? true;
  const bgStyle = siteConfig.bgStyle || 'plexus';

  return (
    <>
      <AnimatedBackground
        density={bgDensity}
        speed={bgSpeed}
        glowOpacity={bgGlowOpacity}
        interactive={bgInteractive}
        variant={bgStyle}
      />
      {children}
    </>
  );
}

export default function App() {
  useEffect(() => {
    // Redirect hash-based URLs from the old HashRouter to new clean URLs
    if (typeof window !== 'undefined' && window.location.hash.startsWith('#/')) {
      const cleanPath = window.location.hash.replace(/^#\//, '/');
      window.location.replace(cleanPath);
    }
  }, []);

  return (
    <SettingsApplier>
      <Outlet />
    </SettingsApplier>
  );
}
