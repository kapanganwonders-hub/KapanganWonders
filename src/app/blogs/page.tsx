import Link from 'next/link';

export default function Blogs() {
  const blogPosts = [
    {
      id: 1,
      title: "Exploring the Hidden Gems of Kapangan",
      excerpt: "Discover the lesser-known attractions and cultural sites that make Kapangan a unique destination for travelers seeking authentic experiences.",
      author: "Maria Santos",
      date: "December 15, 2024",
      readTime: "5 min read",
      category: "Travel"
    },
    {
      id: 2,
      title: "Traditional Kapangan Cuisine: A Culinary Journey",
      excerpt: "Learn about the rich culinary heritage of Kapangan, from traditional cooking methods to unique local ingredients and recipes.",
      author: "Juan Dela Cruz",
      date: "December 10, 2024",
      readTime: "7 min read",
      category: "Food"
    },
    {
      id: 3,
      title: "The Best Time to Visit Kapangan",
      excerpt: "Plan your perfect trip to Kapangan with our comprehensive guide to weather, festivals, and seasonal attractions.",
      author: "Ana Rodriguez",
      date: "December 5, 2024",
      readTime: "4 min read",
      category: "Travel Tips"
    },
    {
      id: 4,
      title: "Cultural Festivals and Events in Kapangan",
      excerpt: "Immerse yourself in the vibrant culture of Kapangan through its traditional festivals, celebrations, and community events.",
      author: "Pedro Martinez",
      date: "November 28, 2024",
      readTime: "6 min read",
      category: "Culture"
    },
    {
      id: 5,
      title: "Sustainable Tourism in Kapangan",
      excerpt: "Learn how Kapangan is promoting eco-friendly tourism practices and how you can be a responsible traveler.",
      author: "Lisa Garcia",
      date: "November 20, 2024",
      readTime: "8 min read",
      category: "Sustainability"
    },
    {
      id: 6,
      title: "Photography Tips for Capturing Kapangan's Beauty",
      excerpt: "Professional tips and techniques for photographing the stunning landscapes and cultural moments in Kapangan.",
      author: "Carlos Mendez",
      date: "November 15, 2024",
      readTime: "6 min read",
      category: "Photography"
    }
  ];

  const categories = ["All", "Travel", "Food", "Culture", "Travel Tips", "Sustainability", "Photography"];

  return (
    <div className="min-h-screen bg-egg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Category Filter */}
        <div className="flex flex-wrap justify-center gap-4 mb-12 py-8 bg-gradient-custom border-b border-primary-green/20">
          {categories.map((category) => (
            <button
              key={category}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors duration-200 ${
                category === "All"
                  ? "bg-primary-green text-egg-white"
                  : "bg-egg-white text-primary-green hover:bg-light-green hover:text-primary-green border border-border-green"
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Blog Posts Grid */}
        <div className="py-16 bg-gradient-custom-reverse text-primary-green">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {blogPosts.map((post) => (
            <article key={post.id} className="bg-egg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300 border border-border-green">
                <div className="h-48 bg-gradient-to-r from-primary-green to-accent-green flex items-center justify-center">
                <span className="text-white text-lg font-semibold">Blog Image</span>
              </div>
              <div className="p-6">
                <div className="flex items-center gap-2 mb-3">
                  <span className="bg-light-green text-primary-green text-xs font-medium px-2.5 py-0.5 rounded">
                    {post.category}
                  </span>
                  <span className="text-primary-green/60 text-sm">{post.readTime}</span>
                </div>
                <h2 className="text-xl font-semibold text-primary-green mb-3 line-clamp-2">
                  {post.title}
                </h2>
                <p className="text-primary-green/70 mb-4 line-clamp-3">
                  {post.excerpt}
                </p>
                <div className="flex items-center justify-between text-sm text-primary-green/60">
                  <span>By {post.author}</span>
                  <span>{post.date}</span>
                </div>
                <button className="mt-4 text-primary-green hover:text-accent-green font-medium text-sm">
                  Read More →
                </button>
              </div>
            </article>
          ))}
          </div>
        </div>

        {/* Load More Button */}
        <div className="text-center mt-12">
          <button className="bg-primary-green hover:bg-accent-green text-egg-white px-8 py-3 rounded-lg font-semibold transition-colors duration-200 border border-border-green">
            Load More Posts
          </button>
        </div>

        {/* Newsletter Signup */}
        <div className="mt-16 bg-primary-green rounded-lg p-8 text-center text-egg-white border border-border-green">
          <h3 className="text-2xl font-bold mb-4">Stay Updated</h3>
          <p className="text-light-green mb-6">
            Subscribe to our newsletter for the latest stories and travel tips about Kapangan.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 px-4 py-2 rounded-lg text-primary-green focus:outline-none focus:ring-2 focus:ring-border-green"
            />
            <button className="bg-egg-white text-primary-green hover:bg-light-green px-6 py-2 rounded-lg font-semibold transition-colors duration-200 border border-border-green">
              Subscribe
            </button>
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
