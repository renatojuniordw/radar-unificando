import { FaqStructuredData } from "@/components/seo/faq-structured-data";
import { HomeSearchContent } from "@/components/home/home-search-content";
import { WhyUseSection } from "@/components/home/why-use-section";
import { FaqSection } from "@/components/home/faq-section";
import { SupportSection } from "@/components/shared/support-section";

export default function HomePage() {
  return (
    <>
      <FaqStructuredData />
      <HomeSearchContent />
      <WhyUseSection />
      <section className="section-dark-eco">
        <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "48px 16px" }}>
          <SupportSection />
        </div>
      </section>
      <FaqSection />
    </>
  );
}
