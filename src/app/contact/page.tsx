'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission here
    console.log('Form submitted:', formData);
    alert('Thank you for your message! We will get back to you soon.');
    setFormData({ name: '', email: '', subject: '', message: '' });
  };

  const contactInfo = [
    {
      icon: "📍",
      title: "Address",
      details: "Kapangan, Benguet, Philippines"
    },
    {
      icon: "📞",
      title: "Phone",
      details: "+63 917 123 4567"
    },
    {
      icon: "✉️",
      title: "Email",
      details: "info@kapanganwonder.com"
    },
    {
      icon: "🕒",
      title: "Office Hours",
      details: "Monday - Friday: 9:00 AM - 6:00 PM"
    }
  ];

  return (
    <div className="min-h-screen bg-egg-white">
      {/* Hero Section */}
      <section className="relative bg-gradient-custom text-primary-green overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0">
          {/* Mountains */}
          <div className="absolute top-10 left-10 animate-float">
            <svg width="80" height="60" viewBox="0 0 80 60" className="text-black/20">
              <path d="M0,60 L20,20 L40,40 L60,10 L80,30 L80,60 Z" fill="currentColor" />
            </svg>
          </div>
          <div className="absolute top-20 right-20 animate-drift">
            <svg width="100" height="70" viewBox="0 0 100 70" className="text-black/15">
              <path d="M0,70 L25,25 L50,45 L75,15 L100,35 L100,70 Z" fill="currentColor" />
            </svg>
          </div>
          <div className="absolute top-32 left-1/4 animate-float" style={{ animationDelay: '1s' }}>
            <svg width="60" height="50" viewBox="0 0 60 50" className="text-black/25">
              <path d="M0,50 L15,20 L30,35 L45,15 L60,25 L60,50 Z" fill="currentColor" />
            </svg>
          </div>

          {/* Rivers */}
          <div className="absolute bottom-20 left-0 right-0 animate-wave">
            <svg width="100%" height="40" viewBox="0 0 1200 40" className="text-black/10">
              <path d="M0,20 Q300,5 600,20 T1200,20 L1200,40 L0,40 Z" fill="currentColor" />
            </svg>
          </div>
          <div className="absolute bottom-32 left-0 right-0 animate-wave" style={{ animationDelay: '1.5s' }}>
            <svg width="100%" height="30" viewBox="0 0 1200 30" className="text-black/15">
              <path d="M0,15 Q400,5 800,15 T1200,15 L1200,30 L0,30 Z" fill="currentColor" />
            </svg>
          </div>

          {/* Rice Terraces */}
          <div className="absolute bottom-40 right-10 animate-pulse-slow">
            <svg width="120" height="80" viewBox="0 0 120 80" className="text-black/20">
              <path d="M0,80 L0,60 L30,60 L30,40 L60,40 L60,20 L90,20 L90,0 L120,0 L120,80 Z" fill="currentColor" />
              <path d="M0,80 L0,70 L20,70 L20,50 L40,50 L40,30 L60,30 L60,10 L80,10 L80,0 L100,0 L100,80 Z" fill="currentColor" opacity="0.5" />
            </svg>
          </div>

          {/* Cave Entrance */}
          <div className="absolute top-40 right-1/3 animate-drift" style={{ animationDelay: '2s' }}>
            <svg width="60" height="40" viewBox="0 0 60 40" className="text-black/30">
              <ellipse cx="30" cy="20" rx="25" ry="15" fill="currentColor" />
              <ellipse cx="30" cy="20" rx="20" ry="10" fill="var(--gradient-end)" opacity="0.3" />
            </svg>
          </div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6 text-primary-green">
              Contact Us
            </h1>
            <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto text-primary-green/80">
              Get in touch with us for any questions, suggestions, or assistance with your Kapangan adventure.
            </p>
          </div>
        </div>
        
        {/* Enhanced Decorative elements */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg
            className="w-full h-16 text-black/20"
            viewBox="0 0 1200 120"
            preserveAspectRatio="none"
          >
            <path
              d="M0,0V46.29c47.79,22.2,103.59,32.17,158,28,70.36-5.37,136.33-33.31,206.8-37.5C438.64,32.43,512.34,53.67,583,72.05c69.27,18,138.3,24.88,209.4,13.08,36.15-6,69.85-17.84,104.45-29.34C989.49,25,1113-14.29,1200,52.47V0Z"
              opacity=".3"
              fill="currentColor"
            />
            <path
              d="M0,0V15.81C13,36.92,27.64,56.86,47.69,72.05,99.41,111.27,165,111,224.58,91.58c31.15-10.15,60.09-26.07,89.67-39.8,40.92-19,84.73-46,130.83-49.67,36.26-2.85,70.9,9.42,98.6,31.56,31.77,25.39,62.32,62,103.63,73,40.44,10.79,81.35-6.69,119.13-24.28s75.16-39,116.92-43.05c59.73-5.85,113.28,22.88,168.9,38.84,30.2,8.66,59,6.17,87.09-7.5,22.43-10.89,48-26.93,60.65-49.24V0Z"
              opacity=".4"
              fill="currentColor"
            />
            <path
              d="M0,0V5.63C149.93,59,314.09,71.32,475.83,42.57c43-7.64,84.23-20.12,127.61-26.46,59-8.63,112.48,12.24,165.56,35.4C827.93,77.22,886,95.24,951.2,90c86.53-7,172.46-45.71,248.8-84.81V0Z"
              fill="currentColor"
            />
          </svg>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 py-16 bg-gradient-custom border-b border-primary-green/20">
          {/* Contact Information */}
          <div>
            <h2 className="text-2xl font-bold text-primary-green mb-8">Get in Touch</h2>
            <div className="space-y-6">
              {contactInfo.map((info, index) => (
                <div key={index} className="flex items-start space-x-4">
                  <div className="text-2xl">{info.icon}</div>
                  <div>
                    <h3 className="text-lg font-semibold text-primary-green">{info.title}</h3>
                    <p className="text-primary-green/70">{info.details}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Social Media Links */}
            <div className="mt-8">
              <h3 className="text-lg font-semibold text-primary-green mb-4">Follow Us</h3>
              <div className="flex space-x-4">
                <a href="#" className="text-primary-green hover:text-accent-green text-2xl">
                  📘
                </a>
                <a href="#" className="text-accent-green hover:text-primary-green text-2xl">
                  🐦
                </a>
                <a href="#" className="text-primary-green hover:text-accent-green text-2xl">
                  📷
                </a>
                <a href="#" className="text-accent-green hover:text-primary-green text-2xl">
                  📺
                </a>
              </div>
            </div>

            {/* Map Placeholder */}
            <div className="mt-8">
              <h3 className="text-lg font-semibold text-primary-green mb-4">Find Us</h3>
              <div className="h-64 bg-gradient-to-r from-primary-green to-accent-green rounded-lg flex items-center justify-center">
                <span className="text-white text-lg font-semibold">Interactive Map</span>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div>
            <h2 className="text-2xl font-bold text-primary-green mb-8">Send us a Message</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-primary-green mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-border-green rounded-lg focus:ring-2 focus:ring-primary-green focus:border-transparent"
                  placeholder="Your full name"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-primary-green mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-border-green rounded-lg focus:ring-2 focus:ring-primary-green focus:border-transparent"
                  placeholder="your.email@example.com"
                />
              </div>

              <div>
                <label htmlFor="subject" className="block text-sm font-medium text-primary-green mb-2">
                  Subject
                </label>
                <input
                  type="text"
                  id="subject"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-border-green rounded-lg focus:ring-2 focus:ring-primary-green focus:border-transparent"
                  placeholder="What's this about?"
                />
              </div>

              <div>
                <label htmlFor="message" className="block text-sm font-medium text-primary-green mb-2">
                  Message
                </label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  required
                  rows={6}
                  className="w-full px-4 py-3 border border-border-green rounded-lg focus:ring-2 focus:ring-primary-green focus:border-transparent"
                  placeholder="Tell us more about your inquiry..."
                />
              </div>

              <button
                type="submit"
                className="w-full bg-primary-green hover:bg-accent-green text-egg-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 border border-border-green"
              >
                Send Message
              </button>
            </form>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-16 py-16 bg-gradient-custom-reverse text-primary-green">
          <h2 className="text-3xl font-bold text-primary-green mb-8 text-center">Frequently Asked Questions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-egg-white rounded-lg shadow-lg p-6 border border-border-green">
              <h3 className="text-lg font-semibold text-primary-green mb-3">What is the best time to visit Kapangan?</h3>
              <p className="text-primary-green/70">The best time to visit Kapangan is during the dry season from November to April, when the weather is pleasant and perfect for outdoor activities.</p>
            </div>
            <div className="bg-egg-white rounded-lg shadow-lg p-6 border border-border-green">
              <h3 className="text-lg font-semibold text-primary-green mb-3">How do I get to Kapangan?</h3>
              <p className="text-primary-green/70">Kapangan is accessible by bus from Baguio City. The journey takes approximately 2-3 hours through scenic mountain roads.</p>
            </div>
            <div className="bg-egg-white rounded-lg shadow-lg p-6 border border-border-green">
              <h3 className="text-lg font-semibold text-primary-green mb-3">Are there accommodations available?</h3>
              <p className="text-primary-green/70">Yes, there are various accommodations ranging from budget-friendly lodges to comfortable hotels and resorts.</p>
            </div>
            <div className="bg-egg-white rounded-lg shadow-lg p-6 border border-border-green">
              <h3 className="text-lg font-semibold text-primary-green mb-3">What activities can I do in Kapangan?</h3>
              <p className="text-primary-green/70">You can enjoy hiking, sightseeing, cultural tours, local cuisine tasting, and experiencing traditional festivals and events.</p>
            </div>
          </div>
        </div>
      </div>

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
