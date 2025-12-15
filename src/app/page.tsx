import HeroSection from "@/components/HeroSection";
import FeaturedDestinations from "@/components/FeaturedDestinations";
import HowItWorks from "@/components/HowItWorks";
import WhyChooseSection from "@/components/WhyChooseSection";
import AdvisorySection from "@/components/AdvisorySection";

export default function Home() {
  return (
    <div className="relative w-full min-h-full">
      {/* Background elements */}
      <div className="fixed inset-0 -z-10 bg-[#F5F5DC]">
        <div className="absolute inset-0 opacity-10 bg-[url('/bg.jpg')] bg-repeat"></div>
        <div className="absolute -right-20 -top-20 w-96 h-96 bg-green-100 rounded-full opacity-10"></div>
        <div className="absolute -left-40 top-1/3 w-96 h-96 bg-green-200 rounded-full opacity-10"></div>
        <div className="absolute right-1/4 -bottom-40 w-80 h-80 bg-green-100 rounded-full opacity-10"></div>
      </div>

      {/* Main content */}
      <div className="relative w-full">

        {/* Hero Section */}
        <section>
          <HeroSection />
        </section>

        {/* Featured Destinations */}
        <section id="featured" className="py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <FeaturedDestinations />
          </div>
        </section>

        {/* Advisory Section */}
        <section className="py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <AdvisorySection />
          </div>
        </section>

        {/* Why Choose Section */}
        <section className="py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <WhyChooseSection />
          </div>
        </section>

        {/* How It Works */}
        <section className="py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <HowItWorks />
          </div>
        </section>

      </div>
    </div>
  );
}
