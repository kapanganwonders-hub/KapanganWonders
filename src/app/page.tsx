import HeroSection from "@/components/HeroSection";
import AdvisorySection from "@/components/AdvisorySection";
import Link from "next/link";

export default function Home() {
  const features = [
    {
      title: "Natural Wonders",
      description: "Discover breathtaking landscapes, mountains, and natural attractions that showcase the beauty of Kapangan.",
      icon: "🏔️"
    },
    {
      title: "Cultural Heritage",
      description: "Experience the rich cultural traditions, festivals, and local customs of the Kapangan community.",
      icon: "🎭"
    },
    {
      title: "Local Cuisine",
      description: "Taste authentic Filipino dishes and local specialties made with fresh, locally-sourced ingredients.",
      icon: "🍽️"
    },
    {
      title: "Adventure Activities",
      description: "Enjoy hiking, trekking, and other outdoor activities in the beautiful mountain terrain.",
      icon: "🥾"
    }
  ];

  const stats = [
    { number: "50+", label: "Tourist Spots" },
    { number: "25+", label: "Accommodations" },
    { number: "15+", label: "Restaurants" },
    { number: "1000+", label: "Happy Visitors" }
  ];

  return (
    <div className="min-h-screen bg-egg-white">
      {/* Hero Section */}
      <HeroSection />

      {/* Advisory Section */}
      <AdvisorySection />

      {/* Features Section */}
      <section className="py-16 bg-gradient-custom border-b border-primary-green/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-primary-green mb-4">
              Why Choose Kapangan?
            </h2>
            <p className="text-xl text-primary-green/80 max-w-3xl mx-auto">
              Experience the perfect blend of natural beauty, cultural richness, and warm hospitality that makes Kapangan a unique destination.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="text-center group">
                <div className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-300 animate-float" style={{ animationDelay: `${index * 0.2}s` }}>
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-primary-green mb-3 group-hover:text-accent-green transition-colors duration-300">{feature.title}</h3>
                <p className="text-primary-green/70 group-hover:text-primary-green/90 transition-colors duration-300">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-gradient-custom-reverse text-primary-green">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {stats.map((stat, index) => (
              <div key={index} className="group">
                <div className="text-4xl font-bold mb-2 group-hover:scale-110 transition-transform duration-300 animate-pulse-slow" style={{ animationDelay: `${index * 0.3}s` }}>
                  {stat.number}
                </div>
                <div className="text-primary-green/80 group-hover:text-primary-green transition-colors duration-300 font-medium">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="py-16 bg-gradient-custom border-b border-primary-green/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-primary-green mb-4 animate-pulse-slow">
            Ready to Explore Kapangan?
          </h2>
          <p className="text-xl text-primary-green/80 mb-8 max-w-2xl mx-auto">
            Start planning your adventure today and discover all that Kapangan has to offer.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/tourist-spots"
              className="bg-primary-green hover:bg-accent-green text-egg-white px-8 py-3 rounded-lg font-semibold text-lg transition-all duration-300 border border-primary-green shadow-lg hover:shadow-xl transform hover:-translate-y-1 hover:scale-105"
            >
              Explore Now
            </Link>
            <Link
              href="/contact"
              className="border-2 border-primary-green text-primary-green hover:bg-primary-green hover:text-egg-white px-8 py-3 rounded-lg font-semibold text-lg transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1 hover:scale-105"
            >
              Get in Touch
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-primary-green text-egg-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-2xl font-bold text-light-green mb-4">Kapangan Wonder</h3>
              <p className="text-light-green/80">
                Discover the natural beauty and cultural richness of Kapangan, Benguet.
              </p>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2">
                <li><Link href="/tourist-spots" className="text-light-green/80 hover:text-egg-white">Tourist Spots</Link></li>
                <li><Link href="/eat-and-stay" className="text-light-green/80 hover:text-egg-white">Eat & Stay</Link></li>
                <li><Link href="/blogs" className="text-light-green/80 hover:text-egg-white">Blogs</Link></li>
                <li><Link href="/contact" className="text-light-green/80 hover:text-egg-white">Contact</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Support</h4>
              <ul className="space-y-2">
                <li><Link href="/contact" className="text-light-green/80 hover:text-egg-white">Help Center</Link></li>
                <li><Link href="/contact" className="text-light-green/80 hover:text-egg-white">Contact Us</Link></li>
                <li><Link href="/signin" className="text-light-green/80 hover:text-egg-white">Sign In</Link></li>
                <li><Link href="/signup" className="text-light-green/80 hover:text-egg-white">Sign Up</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Follow Us</h4>
              <div className="flex space-x-4">
                <a href="#" className="text-light-green/80 hover:text-egg-white text-2xl">📘</a>
                <a href="#" className="text-light-green/80 hover:text-egg-white text-2xl">🐦</a>
                <a href="#" className="text-light-green/80 hover:text-egg-white text-2xl">📷</a>
                <a href="#" className="text-light-green/80 hover:text-egg-white text-2xl">📺</a>
              </div>
            </div>
          </div>
          <div className="border-t border-border-green mt-8 pt-8 text-center text-light-green/80">
            <p>&copy; 2024 Kapangan Wonder. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
