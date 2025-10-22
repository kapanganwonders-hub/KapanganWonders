import HeroSection from "@/components/HeroSection";
import FeaturedDestinations from "@/components/FeaturedDestinations";
import HowItWorks from "@/components/HowItWorks";
import Link from "next/link";

export default function Home() {
  const stats = [
    { number: "50+", label: "Tourist Spots" },
    { number: "25+", label: "Accommodations" },
    { number: "15+", label: "Restaurants" },
    { number: "1000+", label: "Happy Visitors" }
  ];

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

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <HeroSection />

      {/* Featured Destinations */}
      <section id="featured" className="scroll-mt-20">
        <FeaturedDestinations />
      </section>

      {/* Features Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Why Choose Kapangan?</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Experience the perfect blend of natural beauty, cultural richness, and warm hospitality
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="text-center p-6 bg-gray-50 rounded-lg hover:shadow-md transition-shadow">
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <HowItWorks />

      {/* Stats Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {stats.map((stat, index) => (
              <div key={index} className="p-6 bg-white rounded-lg shadow-md">
                <p className="text-4xl font-bold text-green-600">{stat.number}</p>
                <p className="text-gray-600 mt-2">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>


      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-2xl font-bold text-green-400 mb-4">Kapangan Wonder</h3>
              <p className="text-gray-300">
                Discover the natural beauty and cultural richness of Kapangan, Benguet.
              </p>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2">
                <li><Link href="/tourist-spots" className="text-gray-300 hover:text-white">Tourist Spots</Link></li>
                <li><Link href="/eat-and-stay" className="text-gray-300 hover:text-white">Eat & Stay</Link></li>
                <li><Link href="/blogs" className="text-gray-300 hover:text-white">Blogs</Link></li>
                <li><Link href="/contact" className="text-gray-300 hover:text-white">Contact</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Support</h4>
              <ul className="space-y-2">
                <li><Link href="/contact" className="text-gray-300 hover:text-white">Help Center</Link></li>
                <li><Link href="/contact" className="text-gray-300 hover:text-white">Contact Us</Link></li>
                <li><Link href="/signin" className="text-gray-300 hover:text-white">Sign In</Link></li>
                <li><Link href="/signup" className="text-gray-300 hover:text-white">Sign Up</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Follow Us</h4>
              <div className="flex space-x-4">
                <a href="#" className="text-gray-300 hover:text-white text-2xl">📘</a>
                <a href="#" className="text-gray-300 hover:text-white text-2xl">🐦</a>
                <a href="#" className="text-gray-300 hover:text-white text-2xl">📷</a>
                <a href="#" className="text-gray-300 hover:text-white text-2xl">📺</a>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-700 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; {new Date().getFullYear()} Kapangan Wonder. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
