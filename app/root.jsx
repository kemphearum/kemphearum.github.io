import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
  isRouteErrorResponse,
  useRouteError,
} from "react-router";
import MaintenancePage from '../src/components/common/MaintenancePage';
import ComponentErrorBoundary from '../src/components/common/ErrorBoundary';
import { ThemeProvider } from '../src/context/ThemeContext';
import { ActivityProvider } from '../src/context/ActivityContext';
import { QueryClientProvider, useQuery } from '@tanstack/react-query';
import { queryClient } from '../src/core/queryClient';
import React, { useEffect } from 'react';
import SettingsService from '../src/services/SettingsService';
import AnimatedBackground from '../src/components/AnimatedBackground';
import '../src/styles/global.scss';
import { useAnalytics } from '../src/hooks/useAnalytics';
import { Analytics } from "@vercel/analytics/react";

export async function loader() {
  try {
    const globalSettings = await SettingsService.fetchGlobalSettings();
    return globalSettings || {};
  } catch (error) {
    console.error("Vercel Root Loader Error:", error);
    // Return empty settings to avoid crashing the whole server
    return {};
  }
}

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
          <ComponentErrorBoundary>
            <QueryClientProvider client={queryClient}>
              <ThemeProvider>
                <ActivityProvider>
                  {children}
                  {typeof window !== 'undefined' && !['localhost', '127.0.0.1'].includes(window.location.hostname) && <Analytics />}
                </ActivityProvider>
              </ThemeProvider>
            </QueryClientProvider>
          </ComponentErrorBoundary>
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

function SettingsApplier({ children, initialSettings }) {
  useAnalytics();

  const { data: globalConfig } = useQuery({
    queryKey: ['settings', 'global'],
    queryFn: () => SettingsService.fetchGlobalSettings(),
    staleTime: 1000 * 60 * 5,
    initialData: initialSettings
  });

  const { data: metadata } = useQuery({
    queryKey: ['settings', 'metadata', 'typography'],
    queryFn: () => SettingsService.fetchTypographyMetadata(),
    staleTime: Infinity,
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


      const typpo = {
        ...(globalConfig.site || {}),
        ...(globalConfig.typography || {}),
        ...globalConfig
      };

      const typographyMetadata = metadata || SettingsService.constructor.DEFAULT_TYPOGRAPHY_METADATA;
      if (!typographyMetadata || !typographyMetadata.fontCSS) return;
      
      const fontMap = typographyMetadata.fontCSS;

      const root = document.documentElement;
      const categories = [
        { field: 'fontDisplay', prop: '--font-display', weightProp: '--font-weight-display', styleProp: '--font-style-display', sizeProp: '--font-size-display', defaultWeight: '800', defaultSize: '2rem' },
        { field: 'fontHeading', prop: '--font-heading', weightProp: '--font-weight-heading', styleProp: '--font-style-heading', sizeProp: '--font-size-heading', defaultWeight: '700', defaultSize: '1.25rem' },
        { field: 'fontSubheading', prop: '--font-subheading', weightProp: '--font-weight-subheading', styleProp: '--font-style-subheading', sizeProp: '--font-size-subheading', defaultWeight: '600', defaultSize: '1rem' },
        { field: 'fontNav', prop: '--font-nav', weightProp: '--font-weight-nav', styleProp: '--font-style-nav', sizeProp: '--font-size-nav', defaultWeight: '500', defaultSize: '0.85rem' },
        { field: 'fontLogo', prop: '--font-logo', weightProp: '--font-weight-logo', styleProp: '--font-style-logo', sizeProp: '--font-size-logo', defaultWeight: '700', defaultSize: '1.25rem' },
        { field: 'fontBody', prop: '--font-body', weightProp: '--font-weight-body', styleProp: '--font-style-body', sizeProp: '--font-size-body', defaultWeight: '400', defaultSize: '0.9rem' },
        { field: 'fontUI', prop: '--font-ui', weightProp: '--font-weight-ui', styleProp: '--font-style-ui', sizeProp: '--font-size-ui', defaultWeight: '600', defaultSize: '0.8rem' },
        { field: 'fontMono', prop: '--font-mono', weightProp: '--font-weight-mono', styleProp: '--font-style-mono', sizeProp: '--font-size-mono', defaultWeight: '400', defaultSize: '0.85rem' },
        { field: 'fontFooterTitle', prop: '--font-footer-title', weightProp: '--font-weight-footer-title', styleProp: '--font-style-footer-title', sizeProp: '--font-size-footer-title', defaultWeight: '600', defaultSize: '0.65rem' },
        { field: 'fontFooterLink', prop: '--font-footer-link', weightProp: '--font-weight-footer-link', styleProp: '--font-style-footer-link', sizeProp: '--font-size-footer-link', defaultWeight: '400', defaultSize: '0.68rem' },
        { field: 'fontFooterText', prop: '--font-footer-text', weightProp: '--font-weight-footer-text', styleProp: '--font-style-footer-text', sizeProp: '--font-size-footer-text', defaultWeight: '400', defaultSize: '0.7rem' },
        { field: 'fontFooterBrand', prop: '--font-footer-brand', weightProp: '--font-weight-footer-brand', styleProp: '--font-style-footer-brand', sizeProp: '--font-size-footer-brand', defaultWeight: '700', defaultSize: '1.25rem' },
        { field: 'fontFooterTagline', prop: '--font-footer-tagline', weightProp: '--font-weight-footer-tagline', styleProp: '--font-style-footer-tagline', sizeProp: '--font-size-footer-tagline', defaultWeight: '400', defaultSize: '0.8rem' },
        { field: 'fontAdminBrand', prop: '--font-admin-brand', weightProp: '--font-weight-admin-brand', styleProp: '--font-style-admin-brand', sizeProp: '--font-size-admin-brand', defaultWeight: '700', defaultSize: '1.25rem' },
        { field: 'fontAdminMenu', prop: '--font-admin-menu', weightProp: '--font-weight-admin-menu', styleProp: '--font-style-admin-menu', sizeProp: '--font-size-admin-menu', defaultWeight: '500', defaultSize: '0.85rem' },
        { field: 'fontAdminTab', prop: '--font-admin-tab', weightProp: '--font-weight-admin-tab', styleProp: '--font-style-admin-tab', sizeProp: '--font-size-admin-tab', defaultWeight: '600', defaultSize: '1rem' },
      ];

      categories.forEach(({ field, prop, weightProp, styleProp, sizeProp, defaultWeight, defaultSize }) => {
        const key = typpo[field] || 'inter';
        const sizeField = `${field}Size`;
        const weightField = `${field}Weight`;
        const italicField = `${field}Italic`;

        root.style.setProperty(prop, fontMap[key] || fontMap['inter']);
        root.style.setProperty(weightProp, typpo[weightField] || (key === 'kantumruy-pro-medium' ? '500' : defaultWeight));
        root.style.setProperty(styleProp, typpo[italicField] ? 'italic' : 'normal');
        root.style.setProperty(sizeProp, typpo[sizeField] || defaultSize);
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
  }, [globalConfig, metadata]);

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

export function ErrorBoundary() {
  const error = useRouteError();

  if (isRouteErrorResponse(error)) {
    let title = "Page Not Found";
    let message = "The link you followed might be broken, or the page may have moved.";
    
    if (error.status === 404) {
      title = "404 - Lost in Space";
    } else if (error.status === 401) {
      title = "401 - Unauthorized";
      message = "You don't have permission to access this area.";
    } else if (error.status === 503) {
      title = "503 - Under Maintenance";
      message = "Our servers are currently undergoing maintenance. We'll be back shortly!";
    }

    return (
      <MaintenancePage 
        title={title}
        message={message}
        error={error}
      />
    );
  }

  return (
    <MaintenancePage 
      title="Something went wrong"
      message="An unexpected error occurred. Please try refreshing or return to the home page."
      error={error instanceof Error ? error : new Error("Unknown error")}
    />
  );
}

const ConnectivityMonitor = () => {
  const [isOnline, setIsOnline] = React.useState(true);
  const [showNotification, setShowNotification] = React.useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowNotification(true);
      setTimeout(() => setShowNotification(false), 3000);
    };
    const handleOffline = () => {
      setIsOnline(false);
      setShowNotification(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!showNotification && isOnline) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: '24px',
      left: '50%',
      transform: 'translateX(-50%)',
      padding: '10px 20px',
      borderRadius: '30px',
      background: isOnline ? 'rgba(16, 185, 129, 0.9)' : 'rgba(239, 68, 68, 0.9)',
      color: 'white',
      backdropFilter: 'blur(10px)',
      boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
      zIndex: 9999,
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      fontSize: '0.9rem',
      fontWeight: '600',
      transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
    }}>
      <div style={{
        width: '8px',
        height: '8px',
        borderRadius: '50%',
        background: 'white',
        boxShadow: '0 0 10px white',
        animation: isOnline ? 'none' : 'pulse 1.5s infinite'
      }} />
      {isOnline ? 'Connection Restored' : 'No Internet Connection'}
      <style>{`
        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.4; }
          100% { opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default function App() {
  const loaderData = useLoaderData();

  useEffect(() => {
    // Redirect hash-based URLs from the old HashRouter to new clean URLs
    if (typeof window !== 'undefined' && window.location.hash.startsWith('#/')) {
      const cleanPath = window.location.hash.replace(/^#\//, '/');
      window.location.replace(cleanPath);
    }
  }, []);

  return (
    <SettingsApplier initialSettings={loaderData}>
      <ConnectivityMonitor />
      <Outlet />
    </SettingsApplier>
  );
}
