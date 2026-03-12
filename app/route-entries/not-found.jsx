import React from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../../src/components/Navbar';
import Footer from '../../src/components/Footer';
import { ArrowLeft } from 'lucide-react';

export function meta() {
  return [
    { title: "404 - Page Not Found | Kem Phearum" },
    { name: "description", content: "The page you are looking for does not exist." }
  ];
}

export default function NotFound() {
  return (
    <>
      <Navbar />
      <main style={{ 
        minHeight: '80vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        padding: '2rem'
      }}>
        <div style={{ 
          textAlign: 'center',
          maxWidth: '500px',
          background: 'rgba(255, 255, 255, 0.03)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          padding: '3rem',
          borderRadius: '24px'
        }}>
          <h1 style={{ 
            fontSize: '6rem', 
            fontWeight: '900', 
            margin: '0',
            background: 'linear-gradient(135deg, #64ffda 0%, #48bfe3 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>404</h1>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: '#fff' }}>Page Not Found</h2>
          <p style={{ color: 'rgba(255, 255, 255, 0.6)', marginBottom: '2rem' }}>
            The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
          </p>
          <Link to="/" style={{ 
            display: 'inline-flex', 
            alignItems: 'center', 
            gap: '0.5rem',
            padding: '0.8rem 1.5rem',
            background: '#64ffda',
            color: '#0a192f',
            borderRadius: '12px',
            textDecoration: 'none',
            fontWeight: '600',
            transition: 'all 0.3s ease'
          }}>
            <ArrowLeft size={18} /> Back to Home
          </Link>
        </div>
      </main>
      <Footer />
    </>
  );
}
