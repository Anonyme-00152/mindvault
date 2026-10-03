import type { Viewport } from "next";
import { SmoothScroll } from "@/components/SmoothScroll";
import { RevealRoot } from "@/components/site/Reveal";
import { Nav } from "@/components/site/Nav";
import { Hero } from "@/components/site/Hero";
import { Features } from "@/components/site/Features";
import { AskDemo } from "@/components/site/AskDemo";
import { Privacy } from "@/components/site/Privacy";
import { Stats, HowItWorks, Faq, FinalCta } from "@/components/site/Sections";
import { Footer } from "@/components/site/Footer";

export const viewport: Viewport = { themeColor: "#fbfbfa" };

export default function Home() {
  return (
    <SmoothScroll>
      <div className="site">
        <RevealRoot />
        <Nav />
        <main>
          <Hero />
          <Stats />
          <Features />
          <AskDemo />
          <Privacy />
          <HowItWorks />
          <Faq />
          <FinalCta />
        </main>
        <Footer />
      </div>
    </SmoothScroll>
  );
}
