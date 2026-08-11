import { FaqStructuredData } from "@/components/seo/faq-structured-data";
import { MarketingHero } from "@/components/home/marketing-hero";
import { MetricsBar } from "@/components/home/metrics-bar";
import { ExtensionSection } from "@/components/home/extension-section";
import { FaqSection } from "@/components/home/faq-section";
import { SupportSection } from "@/components/shared/support-section";

export default function HomePage() {
  return (
    <>
      <FaqStructuredData />
      <MarketingHero />
      <MetricsBar />
      <ExtensionSection />
      <section className="section-dark-eco">
        <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "48px 16px" }}>
          <SupportSection />
        </div>
      </section>
      <FaqSection />
    </>
  );
}
