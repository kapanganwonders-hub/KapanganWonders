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
