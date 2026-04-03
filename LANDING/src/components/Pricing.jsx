import React from 'react';
import { CardBody, CardContainer, CardItem } from "./ui/3d-card";

const Pricing = () => {
  return (
    <section className="pricing-section py-10" id="pricing">
      <div className="container">
        <h2 className="section-title text-center text-3xl font-bold tracking-tight text-white sm:text-4xl">Flexible Plans</h2>
        <p className="section-subtitle text-center mb-0">High-clearance intelligence at a manageable scale.</p>
        
        <div className="flex flex-wrap justify-center gap-10">
          {/* Free Plan */}
          <CardContainer className="inter-var">
            <CardBody className="bg-gray-50 relative group/card dark:hover:shadow-2xl dark:hover:shadow-emerald-500/[0.1] dark:bg-black dark:border-white/[0.2] border-black/[0.1] w-auto sm:w-[28rem] h-auto rounded-xl p-8 border glass-panel">
              <CardItem translateZ="50" className="text-2xl font-bold text-white mb-2">
                Free Plan
              </CardItem>
              <CardItem as="p" translateZ="60" className="text-muted text-sm max-w-sm mt-2">
                Ideal for individual researchers and preliminary reconnaissance.
              </CardItem>
              
              <div className="pricing-features mt-10">
                <CardItem translateZ="40" className="flex items-center gap-2 mb-4">
                  <span className="text-primary font-bold">✔</span>
                  <span className="text-muted">Up to 3 searches</span>
                </CardItem>
                <CardItem translateZ="30" className="flex items-center gap-2 mb-4">
                  <span className="text-primary font-bold">✔</span>
                  <span className="text-muted">Basic threat detection</span>
                </CardItem>
                <CardItem translateZ="20" className="flex items-center gap-2 mb-4">
                  <span className="text-primary font-bold">✔</span>
                  <span className="text-muted">Limited access</span>
                </CardItem>
              </div>

              <div className="flex justify-center mt-12">
                <CardItem
                  translateZ={30}
                  as="button"
                  className="btn btn-secondary px-10 py-3 rounded-xl text-sm font-semibold"
                >
                  Start Free
                </CardItem>
              </div>
            </CardBody>
          </CardContainer>

          {/* Pro Plan */}
          <CardContainer className="inter-var">
            <CardBody className="bg-gray-50 relative group/card dark:hover:shadow-2xl dark:hover:shadow-primary/[0.2] dark:bg-black dark:border-primary/[0.4] border-primary/[0.3] w-auto sm:w-[28rem] h-auto rounded-xl p-8 border glass-panel highlighted">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 badge">Most Popular</div>
              <CardItem translateZ="50" className="text-2xl font-bold text-white mb-2">
                Pro Plan
              </CardItem>
              <CardItem as="p" translateZ="60" className="text-muted text-sm max-w-sm mt-2">
                Uncompromising operational intelligence for agile organizations.
              </CardItem>

              <div className="pricing-features mt-10">
                <CardItem translateZ="50" className="flex items-center gap-2 mb-4">
                  <span className="text-primary font-bold">✔</span>
                  <span className="text-white">Pay-per-search model</span>
                </CardItem>
                <CardItem translateZ="45" className="flex items-center gap-2 mb-4">
                  <span className="text-primary font-bold">✔</span>
                  <span className="text-white">Powered by MegaETH</span>
                </CardItem>
                <CardItem translateZ="40" className="flex items-center gap-2 mb-4">
                  <span className="text-primary font-bold">✔</span>
                  <span className="text-white">Unlimited monitoring capability</span>
                </CardItem>
                <CardItem translateZ="35" className="flex items-center gap-2 mb-4">
                  <span className="text-primary font-bold">✔</span>
                  <span className="text-white">Advanced threat insights</span>
                </CardItem>
              </div>

              <div className="flex justify-center mt-12">
                <CardItem
                  translateZ={50}
                  as="button"
                  className="btn btn-primary px-10 py-3 rounded-xl text-sm font-bold shadow-[0_0_20px_rgba(0,255,157,0.3)]"
                >
                  Upgrade to Pro
                </CardItem>
              </div>
            </CardBody>
          </CardContainer>
        </div>
      </div>
    </section>
  );
};

export default Pricing;
