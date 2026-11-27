import { StickyBuyBar } from "@/components/StickyBuyBar";
import { FeatureStory, HomeCloser } from "./FeatureStory";
import { MarketingProvider } from "./LandingSections";
import { LaunchHero } from "./LaunchHero";
import { Footer, Nav } from "./SiteChrome";
export { LINKS } from "@/lib/links";

export function Landing() {
  return (
    <MarketingProvider>
      <div className="ezm-site ezm-light min-h-screen bg-background text-foreground">
        <Nav theme="light" />
        <main id="main-content">
          <LaunchHero />
          <FeatureStory />
          <HomeCloser />
        </main>
        <Footer theme="light" />
        <StickyBuyBar />
      </div>
    </MarketingProvider>
  );
}
