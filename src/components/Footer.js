import React from 'react';
import './Footer.css';

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-content">
        <h3>🚀 Stellar.log</h3>
        <p>Thank you for exploring the universe with us.</p>

        <div className="social-icons">
          <a href="https://github.com/Shubham91756" target="_blank" rel="noopener noreferrer">
            <i className="fab fa-github"></i>
          </a>
        </div>

        <p className="copyright">
          © {new Date().getFullYear()} Stellar.log. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
