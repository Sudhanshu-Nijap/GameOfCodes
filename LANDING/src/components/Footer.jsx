import React from 'react';
import { Mail, Phone, MapPin, Video, ExternalLink, Send } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="main-footer pt-8 pb-6 bg-black/50 border-t border-white/5">
      <div className="container">
        
        <div className="footer-bottom">
          <p className="copyright-text">Copyright @WhiteDUMP Inc 2026. All Rights Reserved.</p>
          <div className="footer-socials">
            <a href="#" className="social-link"><ExternalLink size={18} /></a>
            <a href="#" className="social-link"><Send size={18} /></a>
            <a href="#" className="social-link"><Video size={18} /></a>
          </div>
          <div className="footer-links-inline">
            <a href="#">Privacy Policy</a>
            <a href="#">Terms of Service</a>
            <a href="#">Contact</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
