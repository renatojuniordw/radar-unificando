import { FaqStructuredData } from "@/components/seo/faq-structured-data";
import { HomeSearchContent } from "@/components/home/home-search-content";
import { WhyUseSection } from "@/components/home/why-use-section";
import { FaqSection } from "@/components/home/faq-section";

export default function HomePage() {
  return (
    <>
      <FaqStructuredData />
      <HomeSearchContent />
      <WhyUseSection />
      <FaqSection />
    </>
  );
}
