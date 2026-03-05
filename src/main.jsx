import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HelmetProvider } from 'react-helmet-async'
import './styles/global.scss'
import App from './App.jsx'
import ErrorBoundary from './components/ErrorBoundary'
import { ThemeProvider } from './context/ThemeContext'
import { ActivityProvider } from './context/ActivityContext'

import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from './queryClient'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <HelmetProvider>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider>
            <ActivityProvider>
              <App />
            </ActivityProvider>
          </ThemeProvider>
        </QueryClientProvider>
      </ErrorBoundary>
    </HelmetProvider>
  </StrictMode>,
)

