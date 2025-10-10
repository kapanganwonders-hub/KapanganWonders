'use client';

import Link from 'next/link';

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-egg-white">
      {/* ✅ Hero Section */}
      <section className="relative bg-gradient-custom text-primary-green overflow-hidden">
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6 text-primary-green">
            Welcome to Your Dashboard
          </h1>
          <p className="text-lg text-primary-green/80">
            Manage your profile, explore new features, and discover the wonders of Kapangan.
          </p>
        </div>
      </section>

      {/* ✅ Dashboard Cards */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        <h2 className="text-3xl font-bold text-primary-green mb-6">Explore</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link href="/tourist-spots">
            <div className="border border-border-green rounded-lg p-6 text-center shadow hover:shadow-md transition cursor-pointer">
              <h3 className="text-xl font-semibold mb-2">Tourist Spots</h3>
              <p>Discover the best places to visit in Kapangan.</p>
            </div>
          </Link>
          <Link href="/eat-and-stay">
            <div className="border border-border-green rounded-lg p-6 text-center shadow hover:shadow-md transition cursor-pointer">
              <h3 className="text-xl font-semibold mb-2">Eat & Stay</h3>
              <p>Find the best places to eat and stay.</p>
            </div>
          </Link>
          <Link href="/blogs">
            <div className="border border-border-green rounded-lg p-6 text-center shadow hover:shadow-md transition cursor-pointer">
              <h3 className="text-xl font-semibold mb-2">Blogs</h3>
              <p>Read and share your Kapangan experiences.</p>
            </div>
          </Link>
        </div>
      </div>

      {/* ✅ Footer */}
      <footer className="bg-primary-green text-egg-white py-12 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-2xl font-bold text-light-green mb-4">Kapangan Wonders</h3>
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
            <p>&copy; 2024 Kapangan Wonders. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
