import { FaqStructuredData } from "@/components/seo/faq-structured-data";
import { MarketingHero } from "@/components/home/marketing-hero";
import { ExtensionSection } from "@/components/home/extension-section";
import { ContentHubsSection } from "@/components/home/content-hubs-section";
import { FaqSection } from "@/components/home/faq-section";
import { SupportSection } from "@/components/shared/support-section";

export default function HomePage() {
  return (
    <>
      <FaqStructuredData />
      <MarketingHero />
      <ContentHubsSection />
      <ExtensionSection />
      <section className="section-dark-eco">
        <div className="mx-auto max-w-[1280px] px-4 py-12 sm:px-6 sm:py-16">
          <SupportSection />
        </div>
      </section>
      <FaqSection />
    </>
  );
}
