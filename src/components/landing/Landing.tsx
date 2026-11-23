import { Nav, Footer } from "./SiteChrome";
import { LaunchHero } from "./LaunchHero";
import {
  MarketingProvider,
  ProductStage,
  Ambassador,
  FinalCta,
  ZoomClassBand,
} from "./LandingSections";
import { NextStepAdvisor } from "./NextStepAdvisor";
import { ProofWall } from "./ProofWall";
import { ProblemSolver } from "./ProblemSolver";
import { StickyBuyBar } from "@/components/StickyBuyBar";
export { LINKS } from "@/lib/links";

/**
 * Main landing page flow:
 * Hero → Free class → Needs advisor → Problem/Solution features → Proof → CTA
 *
 * Pricing, products, tools, ambassador, FAQ moved to dedicated routes/tabs.
 */
export function Landing() {
  return (
    <MarketingProvider>
      <div className="ezm-site min-h-screen bg-background text-foreground">
        <Nav />
        <main id="main-content">
          <LaunchHero />
          <ZoomClassBand />
          <NextStepAdvisor />
          <ProductStage />
          <ProblemSolver />
          <ProofWall />
          <Ambassador />
          <FinalCta />
        </main>
        <Footer />
      </div>
      <StickyBuyBar />
    </MarketingProvider>
  );
}
