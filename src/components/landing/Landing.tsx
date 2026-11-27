import { StickyBuyBar } from "@/components/StickyBuyBar";
import { FeatureStory, HomeCloser } from "./FeatureStory";
import { MarketingProvider } from "./LandingSections";
import { LaunchHero } from "./LaunchHero";
import { Footer, Nav } from "./SiteChrome";
export { LINKS } from "@/lib/links";

export function Landing() {
  return (
    <MarketingProvider>
      <div className="ezm-site min-h-screen bg-background text-foreground">
        <Nav />
        <main id="main-content">
          <LaunchHero />
          <FeatureStory />
          <HomeCloser />
        </main>
        <Footer />
      </div>
      <StickyBuyBar />
    </MarketingProvider>
  );
}
