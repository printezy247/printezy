import { Nav, Footer } from "./SiteChrome";
import { LaunchHero } from "./LaunchHero";
import { ProductDiscovery } from "./ProductDiscovery";
import {
  MarketingProvider,
  ProductStage,
  TrackRecord,
  Features,
  Pricing,
  Products,
  HowItWorks,
  Ambassador,
  FinalCta,
  ZoomClassBand,
} from "./LandingSections";
import { NextStepAdvisor } from "./NextStepAdvisor";
import { ProofWall } from "./ProofWall";
import { Tools } from "./Tools";
import { Faq } from "./FaqSection";
import { StickyBuyBar } from "@/components/StickyBuyBar";
export { LINKS } from "@/lib/links";

/** Product storytelling is separate from the existing purchase/data contracts. */
export function Landing() {
  return (
    <MarketingProvider>
      <div className="ezm-site min-h-screen bg-background text-foreground">
        <Nav />
        <main id="main-content">
          <LaunchHero />
          <ProductDiscovery />
          <ProductStage />
          <div className="launch-chapter launch-chapter--quiet">
            <Features />
            <NextStepAdvisor />
          </div>
          <div className="launch-chapter launch-chapter--proof">
            <TrackRecord />
            <ProofWall />
          </div>
          <Pricing />
          <div className="launch-chapter launch-chapter--learning">
            <Products />
            <Tools />
            <ZoomClassBand />
          </div>
          <HowItWorks />
          <Ambassador />
          <Faq />
          <FinalCta />
        </main>
        <Footer />
      </div>
      <StickyBuyBar />
    </MarketingProvider>
  );
}
