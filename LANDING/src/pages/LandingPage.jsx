import React from 'react';
import Navbar from '../components/Navbar';
import Hero from '../components/Hero';
import Features from '../components/Features';
import HowItWorks from '../components/HowItWorks';
import DashboardPreview from '../components/DashboardPreview';
import Pricing from '../components/Pricing';
import ExpertAccess from '../components/ExpertAccess';
import CTA from '../components/CTA';
import Footer from '../components/Footer';

const LandingPage = () => {
  return (
    <div className="app-container">
      <Navbar />
      <main>
        <Hero />
        <Features />
        <HowItWorks />
        <DashboardPreview />
        <Pricing />
        <ExpertAccess />
        <CTA />
      </main>
      <Footer />
    </div>
  );
};

export default LandingPage;
