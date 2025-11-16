import HeroSection from "@/components/HeroSection";
import FeaturedDestinations from "@/components/FeaturedDestinations";
import HowItWorks from "@/components/HowItWorks";
import WhyChooseSection from "@/components/WhyChooseSection";
import AdvisorySection from "@/components/AdvisorySection";
import Link from "next/link";

export default function Home() {

  return (
    <div className="min-h-screen bg-gradient-to-br from-white to-green-50">
      {/* Decorative background elements */}
      <div className="fixed inset-0 overflow-hidden -z-10">
        <div className="absolute -right-20 -top-20 w-96 h-96 bg-green-100 rounded-full opacity-10"></div>
        <div className="absolute -left-40 top-1/3 w-96 h-96 bg-green-200 rounded-full opacity-10"></div>
        <div className="absolute right-1/4 -bottom-40 w-80 h-80 bg-green-100 rounded-full opacity-10"></div>
      </div>
      
      {/* Main content container */}
      <div className="relative z-10">

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-white to-green-50 border-b border-black">
        <HeroSection />
      </section>

      {/* Featured Destinations */}
      <section id="featured" className="py-12 bg-gradient-to-br from-white to-green-50 border-b border-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <FeaturedDestinations />
        </div>
      </section>

      {/* Advisory Section */}
      <section className="py-12 bg-gradient-to-br from-white to-green-50 border-b border-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AdvisorySection />
        </div>
      </section>

      {/* Why Choose Section */}
      <section className="py-12 bg-gradient-to-br from-white to-green-50 border-b border-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <WhyChooseSection />
        </div>
      </section>

      {/* How It Works */}
      <section className="py-12 bg-gradient-to-br from-white to-green-50 border-b border-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <HowItWorks />
        </div>
      </section>
      </div>
    </div>
  );
}
