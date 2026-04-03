import React from 'react';
import { Check } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="footer-wrapper">
      {/* Contact Section mapping image UI */}
      <div className="contact-pre-footer container">
        <div className="contact-card-white">
          <h3>24/7 Access to WhiteDUMP's Cybersecurity Experts - Because Threats Don't Wait</h3>
          <p className="contact-sub">Do These Persistent Issues Impact Your Day-to-Day Operations?</p>
          <ul className="contact-list">
            <li><Check size={16} className="text-primary"/> Large number of failed logins from single/multiple IPs, internal or external, against a single/multiple usernames.</li>
            <li><Check size={16} className="text-primary"/> Failed logins from new geo locations or a new user device.</li>
            <li><Check size={16} className="text-primary"/> Large number of account lockouts.</li>
            <li><Check size={16} className="text-primary"/> High cost of integration, support and maintenance.</li>
          </ul>
        </div>
        
        <div className="contact-form-box glass-panel-green">
          <form className="contact-form">
            <input type="email" placeholder="Business Email" required />
            <input type="text" placeholder="Your Full Name*" required />
            <input type="text" placeholder="Job Title*" required />
            <select required defaultValue="">
              <option value="" disabled>Select Country</option>
              <option value="IN">India</option>
              <option value="US">United States</option>
            </select>
            <div className="phone-input">
              <span>+91</span>
              <input type="tel" placeholder="Phone Number" required />
            </div>
            <label className="terms-label">
              <input type="checkbox" required /> Terms and Privacy policy.
            </label>
            <button type="submit" className="btn btn-primary submit-btn">Send Message</button>
          </form>
        </div>
      </div>

      {/* Actual Footer Section */}
      <div className="main-footer">
        <div className="container footer-grid">
          <div className="footer-col">
            <h4>Contact Info</h4>
            <div className="contact-item"><strong>Hotline:</strong> +1 (800) 123 4567</div>
            <div className="contact-item"><strong>Email:</strong> info@whitedump.com</div>
            <div className="contact-item"><strong>Address:</strong> 123 Cyber Sec Way, Suite 100, CyberCity, CC 12345</div>
            <div className="auth-badges mt-4">
              <div className="badge-circ">SOC 2</div>
              <div className="badge-circ">ISO 27001</div>
            </div>
          </div>
          
          <div className="footer-col">
            <h4>Partner Led Services</h4>
            <ul>
              <li>Advisory Services</li>
              <li>Attack Surface Monitoring</li>
              <li>Breach Attack Simulation</li>
              <li>Incident Response</li>
              <li>Risk Management</li>
            </ul>
          </div>

          <div className="footer-col">
            <h4>Use Cases</h4>
            <ul>
              <li>Advanced Threat Detection</li>
              <li>Bruteforce Prevention</li>
              <li>Cloud Security</li>
              <li>Insider & Credential Breaches</li>
              <li>Ransomware Detection</li>
            </ul>
          </div>

          <div className="footer-col">
            <h4>Quick Links</h4>
            <ul>
              <li>About Us</li>
              <li>Leadership</li>
              <li>Careers</li>
              <li>Awards</li>
              <li>Contact Us</li>
            </ul>
          </div>
        </div>
        
        <div className="footer-bottom container">
          <p>Copyright @WhiteDUMP Inc 2026. All Rights Reserved.</p>
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
