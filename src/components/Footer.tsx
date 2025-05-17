import React, { useState } from 'react';

const Footer: React.FC = () => {
  const [hoveredLink, setHoveredLink] = useState<string | null>(null);

  const linkStyle = (linkName: string) => ({
    color: hoveredLink === linkName ? '#fff' : '#888',
    textDecoration: 'none',
    transition: 'color 0.2s ease'
  });

  return (
    <footer style={{
      padding: '20px',
      backgroundColor: '#242424',
      color: '#888',
      textAlign: 'center',
      fontSize: '0.9em',
      borderTop: '1px solid #333',
      marginTop: 'auto'
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '20px'
      }}>
        <div>
          © {new Date().getFullYear()} GameLayer. All rights reserved.
        </div>
        <div style={{
          display: 'flex',
          gap: '20px',
          flexWrap: 'wrap',
          justifyContent: 'center'
        }}>
          <a 
            href="#" 
            style={linkStyle('privacy')}
            onMouseEnter={() => setHoveredLink('privacy')}
            onMouseLeave={() => setHoveredLink(null)}
          >
            Privacy Policy
          </a>
          <a 
            href="#" 
            style={linkStyle('terms')}
            onMouseEnter={() => setHoveredLink('terms')}
            onMouseLeave={() => setHoveredLink(null)}
          >
            Terms of Service
          </a>
          <a 
            href="#" 
            style={linkStyle('contact')}
            onMouseEnter={() => setHoveredLink('contact')}
            onMouseLeave={() => setHoveredLink(null)}
          >
            Contact
          </a>
        </div>
      </div>
    </footer>
  );
};

export default Footer; 