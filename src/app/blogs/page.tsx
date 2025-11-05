'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/firebase/config';
import { collection, query, where, getDocs, addDoc, updateDoc, deleteDoc, doc, setDoc, Timestamp, orderBy } from 'firebase/firestore';
import { BookOpen, Plus, Edit, Trash2, Save, X, Calendar, Eye, ArrowLeft } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

interface Blog {
  id: string;
  title: string;
  content: string;
  excerpt: string;
  barangay: string;
  author: string;
  authorName: string;
  authorBio?: string;
  category: string;
  tags: string[];
  status: 'draft' | 'published';
  views: number;
  imageUrl?: string;
  createdAt: any;
  updatedAt: any;
}

export default function Blogs() {
  const { currentUser, isBarangayAdmin } = useAuth();
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [filteredBlogs, setFilteredBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingBlog, setEditingBlog] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('All');
  // State for blog view modal
  const [selectedBlog, setSelectedBlog] = useState<Blog | null>(null);
  const [showBlogModal, setShowBlogModal] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    excerpt: '',
    category: 'Tourism',
    tags: '',
    status: 'draft' as 'draft' | 'published',
    imageUrl: ''
  });
  
  // Function to open blog in modal
  const openBlogModal = (blog: Blog) => {
    setSelectedBlog(blog);
    setShowBlogModal(true);
    document.body.style.overflow = 'hidden'; // Prevent background scrolling
  };
  
  // Function to close blog modal
  const closeBlogModal = () => {
    setShowBlogModal(false);
    setSelectedBlog(null);
    document.body.style.overflow = 'auto'; // Re-enable scrolling
  };
  
  // Effect to handle escape key press
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeBlogModal();
      }
    };
    
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, []);

  const categories = ["All", "Tourism", "Culture", "Events", "News", "Guide"];

  // Sample blog data with images from assets
  const sampleBlogs: Blog[] = [
    {
      id: 'sample-1',
      title: "Exploring the Hidden Gems of Kapangan's Rice Terraces",
      excerpt: "Discover the breathtaking beauty of Kapangan's rice terraces, a testament to the ingenuity of the Igorot people and their sustainable farming practices.",
      content: `The rice terraces of Kapangan are not just agricultural marvels but also cultural treasures. Carved into the mountainsides by the indigenous Igorot people, these terraces showcase a perfect harmony between human ingenuity and nature's bounty. 

## The Amburayan Rice Terraces

Located in Barangay Cuba, the Amburayan Rice Terraces offer a spectacular view of cascading rice paddies that change colors with the seasons. The best time to visit is during the planting season (June-July) when the terraces are filled with water, creating a mirror-like effect that reflects the sky.

## Toplac Rice Fields

For those seeking a more off-the-beaten-path experience, the Toplac Rice Fields in Pudong provide a serene escape. The terraces here are smaller but equally impressive, with traditional rice varieties still being cultivated using age-old methods.

## Cultural Significance

These terraces are not just about rice production; they represent a way of life that has been passed down through generations. The traditional practices of the Igorot people, including their respect for nature and community cooperation, are deeply embedded in the maintenance of these terraces.`,
      category: 'Tourism',
      tags: ['rice terraces', 'culture', 'hiking', 'scenic views', 'heritage'],
      status: 'published',
      views: 1245,
      imageUrl: '/assets/Toplac Rice Fields (Pudong).jpg',
      barangay: 'Pudong',
      author: 'admin',
      authorName: 'Kapangan Tourism',
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    },
    {
      id: 'sample-2',
      title: "The Rich Cultural Heritage of Kapangan's Indigenous Communities",
      excerpt: "Dive into the vibrant traditions and customs of Kapangan's indigenous communities, where ancient practices are still alive today.",
      content: `Kapangan is home to several indigenous communities, each with its own unique traditions, dances, and crafts that have been preserved for centuries.

## Traditional Dances and Music

The people of Kapangan celebrate their heritage through various traditional dances like the Bendian and Tarektek. These dances are often performed during special occasions and festivals, accompanied by the rhythmic beats of gongs and other indigenous instruments.

## Handicrafts and Weaving

Local artisans create beautiful handwoven textiles using traditional backstrap looms. The intricate patterns and designs tell stories of their ancestors and the natural world around them. Visitors can witness this craft firsthand in several barangays.

## Festivals and Celebrations

Kapangan comes alive during festivals like the Kapangan Foundation Day, where the streets are filled with colorful parades, street dancing, and cultural performances that showcase the rich heritage of the municipality.`,
      category: 'Culture',
      tags: ['indigenous culture', 'traditions', 'handicrafts', 'festivals'],
      status: 'published',
      views: 987,
      imageUrl: '/assets/Kapangan Museum.jpg',
      barangay: 'Central',
      author: 'admin',
      authorName: 'Cultural Affairs Office',
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    },
    {
      id: 'sample-3',
      title: "Upcoming Events: Kapangan's Annual Town Fiesta",
      excerpt: "Mark your calendars for the most anticipated event of the year - the Kapangan Town Fiesta, featuring cultural shows, trade fairs, and culinary delights.",
      content: `The annual Kapangan Town Fiesta is a week-long celebration that showcases the best of what the municipality has to offer. Here's what you can expect this year:

## Schedule of Activities
- **Day 1: Grand Opening Parade** - Witness the colorful parade featuring different barangays in their traditional attire
- **Day 2: Cultural Showdown** - Experience traditional dances, songs, and rituals from various indigenous groups
- **Day 3: Agri-Trade Fair** - Sample and buy local products from Kapangan's farmers and entrepreneurs
- **Day 4: Street Dancing Competition** - Watch as different groups compete in vibrant street performances
- **Day 5: Grand Culinary Festival** - Taste authentic Kapangan delicacies and local specialties

## Getting There
Free shuttle services will be available from major points in Benguet. Limited parking is available at the municipal grounds.`,
      category: 'Events',
      tags: ['festival', 'town fiesta', 'cultural events', 'food fair'],
      status: 'published',
      views: 1532,
      imageUrl: '/assets/Green and White Modern Travel Presentation (3).jpg',
      barangay: 'Central',
      author: 'admin',
      authorName: 'Events Committee',
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    },
    {
      id: 'sample-4',
      title: "Breaking News: New Eco-Tourism Site to Open in Kapangan",
      excerpt: "Kapangan's newest eco-tourism destination promises sustainable tourism while preserving the natural beauty of the area.",
      content: `In an exciting development for local tourism, the municipality of Kapangan is set to open a new eco-tourism site in Barangay Sagubo. The site, which spans over 50 hectares of pristine forest, will offer various activities while maintaining strict environmental protection measures.

## Features of the New Eco-Park
- **Canopy Walk** - A 200-meter suspended bridge through the treetops
- **Nature Trails** - Well-maintained paths for hiking and bird watching
- **Eco-Lodges** - Sustainable accommodations built with local materials
- **Conservation Area** - Protected zone for local flora and fauna

## Sustainable Tourism
"This project represents our commitment to sustainable development," says Mayor Manny Fermin. "We want to share the beauty of Kapangan while ensuring we protect it for future generations."

The site is expected to open to the public next month, with guided tours available by reservation.`,
      category: 'News',
      tags: ['eco-tourism', 'sustainability', 'nature', 'conservation'],
      status: 'published',
      views: 2103,
      imageUrl: '/assets/badolcamping.jpg',
      barangay: 'Sagubo',
      author: 'admin',
      authorName: 'Kapangan News Team',
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    },
    {
      id: 'sample-5',
      title: "A First-Timer's Guide to Hiking in Kapangan",
      excerpt: "Everything you need to know before embarking on your hiking adventure in the beautiful mountains of Kapangan.",
      content: `Kapangan's rugged terrain and stunning landscapes make it a hiker's paradise. Whether you're a beginner or an experienced trekker, here's your comprehensive guide to hiking in the area.

## Best Hiking Trails
1. **Mt. Dakiwagan Trail** (Moderate, 4-5 hours)
   - Stunning views of the Cordillera mountain range
   - Passes through pine forests and mossy woodlands
   - Best hiked from November to February

2. **Amburayan River Trek** (Easy, 2-3 hours)
   - Follows the scenic Amburayan River
   - Perfect for beginners and families
   - Great for swimming in the summer months

## What to Bring
- At least 2L of water per person
- Packed lunch and snacks
- Rain gear (weather can change quickly)
- First aid kit
- Camera (you'll want to capture the views!)

## Local Guides
We highly recommend hiring a local guide for your safety and to learn more about the area's history and ecology. Contact the Kapangan Tourism Office for a list of accredited guides.`,
      category: 'Guide',
      tags: ['hiking', 'outdoors', 'adventure', 'trails', 'nature'],
      status: 'published',
      views: 1789,
      imageUrl: '/assets/Mt. Dakiwagan (Balakbak).jpg',
      barangay: 'Balakbak',
      author: 'admin',
      authorName: 'Adventure Kapangan',
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    }
  ];

  // Function to initialize sample blogs if none exist
  const initializeSampleBlogs = async () => {
    try {
      const blogsRef = collection(db, 'blogs');
      const querySnapshot = await getDocs(blogsRef);
      
      // Only add sample blogs if the collection is empty
      if (querySnapshot.empty) {
        const batch = [];
        for (const blog of sampleBlogs) {
          const docRef = doc(blogsRef);
          batch.push(setDoc(docRef, {
            ...blog,
            id: docRef.id,
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now()
          }));
        }
        await Promise.all(batch);
        console.log('Sample blogs added successfully');
        fetchBlogs(); // Refresh the blogs list
      }
    } catch (error) {
      console.error('Error initializing sample blogs:', error);
    }
  };

  useEffect(() => {
    // Initialize sample blogs if needed
    initializeSampleBlogs();
    fetchBlogs();
  }, []);

  useEffect(() => {
    // Filter blogs based on category
    let result = [...blogs];
    
    if (selectedCategory !== 'All') {
      result = result.filter(blog => blog.category === selectedCategory);
    }
    
    // Only show published blogs to non-admin users
    if (!isBarangayAdmin) {
      result = result.filter(blog => blog.status === 'published');
    }
    
    setFilteredBlogs(result);
  }, [blogs, selectedCategory, isBarangayAdmin]);

  const fetchBlogs = async () => {
    try {
      setLoading(true);
      const blogsRef = collection(db, 'blogs');
      const blogsQuery = query(
        blogsRef,
        orderBy('createdAt', 'desc')
      );
      const blogsSnapshot = await getDocs(blogsQuery);
      const blogsData = blogsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Blog[];
      setBlogs(blogsData);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching blogs:', error);
      setLoading(false);
    }
  };

  const handleAddBlog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isBarangayAdmin) return;
    
    try {
      const tagsArray = formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag);
      
      await addDoc(collection(db, 'blogs'), {
        title: formData.title,
        content: formData.content,
        excerpt: formData.excerpt,
        category: formData.category,
        tags: tagsArray,
        status: formData.status,
        imageUrl: formData.imageUrl,
        barangay: currentUser?.barangay || 'Kapangan',
        author: currentUser?.uid,
        authorName: currentUser?.displayName || 'Admin',
        views: 0,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });
      
      setShowAddForm(false);
      setFormData({
        title: '',
        content: '',
        excerpt: '',
        category: 'Tourism',
        tags: '',
        status: 'draft',
        imageUrl: ''
      });
      
      fetchBlogs();
    } catch (error) {
      console.error('Error adding blog:', error);
      alert('Failed to add blog');
    }
  };

  const handleUpdateBlog = async (blogId: string) => {
    if (!isBarangayAdmin) return;
    
    try {
      const tagsArray = formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag);
      
      const blogRef = doc(db, 'blogs', blogId);
      await updateDoc(blogRef, {
        title: formData.title,
        content: formData.content,
        excerpt: formData.excerpt,
        category: formData.category,
        tags: tagsArray,
        status: formData.status,
        imageUrl: formData.imageUrl,
        updatedAt: Timestamp.now()
      });
      
      setEditingBlog(null);
      setFormData({
        title: '',
        content: '',
        excerpt: '',
        category: 'Tourism',
        tags: '',
        status: 'draft',
        imageUrl: ''
      });
      
      fetchBlogs();
    } catch (error) {
      console.error('Error updating blog:', error);
      alert('Failed to update blog');
    }
  };

  const handleDeleteBlog = async (blogId: string) => {
    if (!isBarangayAdmin || !confirm('Are you sure you want to delete this blog post?')) return;
    
    try {
      await deleteDoc(doc(db, 'blogs', blogId));
      fetchBlogs();
    } catch (error) {
      console.error('Error deleting blog:', error);
      alert('Failed to delete blog');
    }
  };

  const startEdit = (blog: Blog) => {
    if (!isBarangayAdmin) return;
    
    setEditingBlog(blog.id);
    setFormData({
      title: blog.title,
      content: blog.content,
      excerpt: blog.excerpt,
      category: blog.category,
      tags: blog.tags?.join(', ') || '',
      status: blog.status,
      imageUrl: blog.imageUrl || ''
    });
  };

  const cancelEdit = () => {
    setEditingBlog(null);
    setFormData({
      title: '',
      content: '',
      excerpt: '',
      category: 'Tourism',
      tags: '',
      status: 'draft',
      imageUrl: ''
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-green"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-egg-white">
      {/* Hero Section */}
      <div className="bg-primary-green text-egg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Kapangan Blogs</h1>
          <p className="text-xl text-egg-white/90 max-w-3xl mx-auto">
            Discover stories, news, and insights about the beautiful town of Kapangan
          </p>
          
          {/* Category Filter */}
          <div className="mt-8 max-w-3xl mx-auto">
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors duration-200 ${
                    selectedCategory === category
                      ? 'bg-egg-white text-primary-green'
                      : 'bg-white/10 text-egg-white hover:bg-white/20'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Add Blog Button for Admins */}
        {isBarangayAdmin && (
          <div className="flex justify-end mb-8">
            <button
              onClick={() => setShowAddForm(true)}
              className="flex items-center gap-2 bg-primary-green hover:bg-green-700 text-egg-white px-6 py-3 rounded-lg font-medium transition-colors duration-200"
            >
              <Plus size={20} />
              New Blog Post
            </button>
          </div>
        )}

        {/* Blog Posts Grid */}
        <div className="py-8">
          {filteredBlogs.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredBlogs.map((post) => (
                <article 
                  key={post.id} 
                  className="bg-egg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300 border border-gray-100"
                >
                  {/* Blog Image */}
                  <div className="h-48 bg-gradient-to-r from-primary-green to-accent-green overflow-hidden">
                    {post.imageUrl ? (
                      <img 
                        src={post.imageUrl} 
                        alt={post.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary-green to-accent-green/80">
                        <span className="text-white text-lg font-semibold">{post.category}</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Blog Content */}
                  <div className="p-6">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="bg-light-green/20 text-primary-green text-xs font-medium px-3 py-1 rounded-full">
                        {post.category}
                      </span>
                      {isBarangayAdmin && (
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          post.status === 'published' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {post.status}
                        </span>
                      )}
                    </div>
                    
                    <h2 className="text-xl font-bold text-gray-900 mb-3 line-clamp-2">
                      {post.title}
                    </h2>
                    
                    <p className="text-gray-600 mb-4 line-clamp-3">
                      {post.excerpt}
                    </p>
                    
                    {/* Tags */}
                    {post.tags && post.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-4">
                        {post.tags.slice(0, 3).map((tag, index) => (
                          <span 
                            key={index} 
                            className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <span>By {post.authorName || 'Admin'}</span>
                        <span>•</span>
                        <span>
                          {post.createdAt?.toDate 
                            ? new Date(post.createdAt.toDate()).toLocaleDateString('en-US', { 
                                year: 'numeric', 
                                month: 'short', 
                                day: 'numeric' 
                              })
                            : 'N/A'}
                        </span>
                      </div>
                      
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          openBlogModal(post);
                        }}
                        className="text-primary-green hover:text-accent-green font-medium text-sm flex items-center gap-1"
                      >
                        Read More
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  
                  {/* Admin Actions */}
                  {isBarangayAdmin && (
                    <div className="px-6 py-3 bg-gray-50 border-t border-gray-100 flex justify-end">
                      <button
                        onClick={() => handleDeleteBlog(post.id)}
                        className="p-2 text-gray-500 hover:text-red-500 transition-colors"
                        title="Delete"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  )}
                </article>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 bg-white rounded-xl border border-gray-100">
              <BookOpen size={48} className="mx-auto text-gray-300 mb-4" />
              <h3 className="text-xl font-medium text-gray-700 mb-2">
                {selectedCategory !== 'All' 
                  ? `No blog posts found in category: ${selectedCategory}`
                  : 'No blog posts found'}
              </h3>
              <p className="text-gray-500">
                {selectedCategory !== 'All'
                  ? 'Try selecting a different category.'
                  : 'Check back later for new posts.'}
              </p>
              {isBarangayAdmin && !showAddForm && (
                <button
                  onClick={() => setShowAddForm(true)}
                  className="mt-6 bg-primary-green hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium transition-colors duration-200 inline-flex items-center gap-2"
                >
                  <Plus size={18} />
                  Create Your First Post
                </button>
              )}
            </div>
          )}
        </div>

        {/* Add/Edit Blog Modal */}
        {(showAddForm || editingBlog) && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">
                    {editingBlog ? 'Edit Blog Post' : 'Create New Blog Post'}
                  </h2>
                  <button
                    onClick={() => {
                      setShowAddForm(false);
                      cancelEdit();
                    }}
                    className="text-gray-400 hover:text-gray-500"
                  >
                    <X size={24} />
                  </button>
                </div>
                
                <form onSubmit={editingBlog ? (e) => { e.preventDefault(); handleUpdateBlog(editingBlog); } : handleAddBlog} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Title <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={formData.title}
                          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                          required
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-green focus:border-transparent"
                          placeholder="Enter blog title"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Excerpt <span className="text-red-500">*</span>
                        </label>
                        <textarea
                          value={formData.excerpt}
                          onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                          required
                          rows={3}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-green focus:border-transparent"
                          placeholder="A brief summary of your blog post..."
                        />
                        <p className="mt-1 text-xs text-gray-500">
                          {formData.excerpt.length}/160 characters
                        </p>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Image URL
                        </label>
                        <input
                          type="url"
                          value={formData.imageUrl}
                          onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-green focus:border-transparent"
                          placeholder="https://example.com/image.jpg"
                        />
                        {formData.imageUrl && (
                          <div className="mt-2 w-full h-32 bg-gray-100 rounded-lg overflow-hidden">
                            <img 
                              src={formData.imageUrl} 
                              alt="Preview" 
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                              }}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="space-y-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Category <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={formData.category}
                          onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                          required
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-green focus:border-transparent"
                        >
                          <option value="Tourism">Tourism</option>
                          <option value="Culture">Culture</option>
                          <option value="Events">Events</option>
                          <option value="News">News</option>
                          <option value="Guide">Guide</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Status
                        </label>
                        <select
                          value={formData.status}
                          onChange={(e) => setFormData({ ...formData, status: e.target.value as 'draft' | 'published' })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-green focus:border-transparent"
                        >
                          <option value="draft">Draft</option>
                          <option value="published">Published</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Tags
                        </label>
                        <input
                          type="text"
                          value={formData.tags}
                          onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-green focus:border-transparent"
                          placeholder="travel, adventure, kapangan"
                        />
                        <p className="mt-1 text-xs text-gray-500">
                          Separate tags with commas
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Content <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={formData.content}
                      onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                      required
                      rows={8}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-green focus:border-transparent"
                      placeholder="Write your blog post content here..."
                    />
                  </div>
                  
                  <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddForm(false);
                        cancelEdit();
                      }}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-2 bg-primary-green text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                    >
                      {editingBlog ? 'Update' : 'Publish'} Post
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Blog Detail Modal - Full Screen Overlay */}
      {showBlogModal && selectedBlog && (
        <div className="fixed inset-0 z-50 bg-white overflow-hidden">
          {/* Modal Header - Empty div to maintain layout consistency */}
          <div className="sticky top-0 bg-white z-20 border-b border-gray-200 h-16"></div>
          
          {/* Main Content */}
          <div className="flex flex-col h-full">
            {/* Back Button, Title, and Edit Button */}
            <div className="sticky top-0 z-10 bg-white border-b border-gray-200 shadow-sm">
              <div className="max-w-7xl mx-auto px-6 md:px-12 py-3">
                <div className="flex justify-between items-start">
                  <button
                    onClick={closeBlogModal}
                    className="flex items-center gap-1 text-primary-green hover:text-accent-green font-medium transition-colors duration-200"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Back to Blogs
                  </button>
                  {isBarangayAdmin && (
                    <button
                      onClick={() => startEdit(selectedBlog)}
                      className="flex items-center gap-1 text-primary-green hover:text-accent-green font-medium transition-colors duration-200"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                      Edit
                    </button>
                  )}
                </div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 line-clamp-2 mt-2">
                  {selectedBlog.title}
                </h1>
              </div>
            </div>
            
            <div className="flex flex-col md:flex-row h-[calc(100vh-120px)] overflow-hidden">
              {/* Left Side - Image and Basic Info */}
              <div className="w-full md:w-1/2 h-full overflow-y-auto p-6 md:p-8 border-r border-gray-200">
                {/* Featured Image */}
                <div className="w-full h-64 md:h-80 lg:h-96 rounded-xl bg-gray-100 relative mb-4 overflow-hidden">
                  {selectedBlog.imageUrl ? (
                    <Image
                      src={selectedBlog.imageUrl}
                      alt={selectedBlog.title}
                      fill
                      className="object-cover"
                      priority
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary-green to-accent-green/80">
                      <span className="text-white text-2xl font-semibold">{selectedBlog.category}</span>
                    </div>
                  )}
                </div>
                
                {/* Date and Category */}
                <div className="flex items-center gap-3 text-sm text-gray-600 mb-6">
                  <span>
                    {selectedBlog.createdAt?.toDate ? 
                      selectedBlog.createdAt.toDate().toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      }) : 'N/A'}
                  </span>
                  <span>•</span>
                  <span className="font-medium">
                    {selectedBlog.category}
                  </span>
                </div>
                
                {/* Author Info */}
                <div className="flex items-center gap-4 pt-4 border-t border-gray-100 mt-6">
                  <div className="h-12 w-12 rounded-full bg-gray-200 flex items-center justify-center text-gray-500">
                    {selectedBlog.authorName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{selectedBlog.authorName}</p>
                    <p className="text-sm text-gray-500">Author</p>
                  </div>
                </div>
                
                {/* Tags */}
                {selectedBlog.tags && selectedBlog.tags.length > 0 && (
                  <div className="mt-6">
                    <h3 className="text-sm font-medium text-gray-500 mb-2">Tags</h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedBlog.tags.map((tag, index) => (
                        <span key={index} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
              {/* Right Side - Content */}
              <div className="w-full md:w-1/2 h-full overflow-y-auto p-6 md:p-8">
                {/* Blog Content */}
                <article className="prose max-w-none text-gray-700 leading-relaxed">
                  {selectedBlog.excerpt && (
                    <p className="text-lg text-gray-700 mb-8 leading-relaxed font-medium">
                      {selectedBlog.excerpt}
                    </p>
                  )}
                  <div 
                    className="prose-lg max-w-none"
                    dangerouslySetInnerHTML={{ 
                      __html: selectedBlog.content
                        .replace(/\n\n/g, '</p><p class="my-6 text-gray-700 leading-relaxed">')
                        .replace(/^##\s+(.*$)/gm, '</p><h2 class="text-2xl font-bold text-gray-900 mt-12 mb-6 pb-2">$1</h2><p>')
                        .replace(/^###\s+(.*$)/gm, '</p><h3 class="text-xl font-semibold text-gray-900 mt-10 mb-4">$1</h3><p>')
                        .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-gray-900">$1</strong>')
                        .replace(/\*(.*?)\*/g, '<em class="italic">$1</em>')
                    }}
                  />
                </article>
              </div>
            </div>
          </div>
        </div>
      )}

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

