'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/firebase/config';
import { collection, query, where, getDocs, addDoc, updateDoc, deleteDoc, doc, setDoc, Timestamp, orderBy, getDoc } from 'firebase/firestore';
import { BookOpen, Plus, Edit, Trash2, Save, X, Calendar, Eye, ArrowLeft, Heart, Clock, User, MapPin, Facebook, Twitter, Instagram, Youtube, Moon, Sun } from 'lucide-react';
import { uploadFile, deleteFile } from '@/lib/appwrite';
import { toast } from 'react-hot-toast';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

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
  views: number;
  imageUrl?: string;
  _tempImage?: File;
  createdAt: any;
  updatedAt: any;
}

// Enhanced Confetti particle class with green colors
class ConfettiParticle {
  x: number;
  y: number;
  size: number;
  speedX: number;
  speedY: number;
  color: string;
  opacity: number;
  decay: number;
  shape: 'circle' | 'square' | 'triangle';
  rotation: number;
  rotationSpeed: number;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
    this.size = Math.random() * 12 + 6;
    this.speedX = Math.random() * 10 - 5;
    this.speedY = Math.random() * 10 + 2;
    // Green color palette - various shades of green
    const greenHues = [120, 140, 100, 160]; // Different green hues
    const saturations = [70, 80, 90]; // Different saturation levels
    const lightness = [50, 60, 70]; // Different lightness levels
    
    const hue = greenHues[Math.floor(Math.random() * greenHues.length)];
    const saturation = saturations[Math.floor(Math.random() * saturations.length)];
    const light = lightness[Math.floor(Math.random() * lightness.length)];
    
    this.color = `hsl(${hue}, ${saturation}%, ${light}%)`;
    this.opacity = 1;
    this.decay = Math.random() * 0.015 + 0.01;
    this.shape = ['circle', 'square', 'triangle'][Math.floor(Math.random() * 3)] as 'circle' | 'square' | 'triangle';
    this.rotation = Math.random() * 360;
    this.rotationSpeed = Math.random() * 10 - 5;
  }

  update() {
    this.x += this.speedX;
    this.y += this.speedY;
    this.speedY += 0.1; // gravity
    this.opacity -= this.decay;
    this.rotation += this.rotationSpeed;
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.save();
    ctx.globalAlpha = this.opacity;
    ctx.fillStyle = this.color;
    ctx.translate(this.x + this.size / 2, this.y + this.size / 2);
    ctx.rotate((this.rotation * Math.PI) / 180);
    
    switch (this.shape) {
      case 'circle':
        ctx.beginPath();
        ctx.arc(0, 0, this.size / 2, 0, Math.PI * 2);
        ctx.fill();
        break;
      case 'square':
        ctx.fillRect(-this.size / 2, -this.size / 2, this.size, this.size);
        break;
      case 'triangle':
        ctx.beginPath();
        ctx.moveTo(0, -this.size / 2);
        ctx.lineTo(-this.size / 2, this.size / 2);
        ctx.lineTo(this.size / 2, this.size / 2);
        ctx.closePath();
        ctx.fill();
        break;
    }
    
    ctx.restore();
  }
}

export default function Blogs() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { currentUser, isBarangayAdmin, barangayAdminData, isPrivateSpotAdmin, privateSpotAdminData } = useAuth();
  
  // Check for edit mode in URL
  const editBlogId = searchParams?.get('edit');
  
  // Debug logging for auth state
  useEffect(() => {
    console.log('Auth State:', {
      currentUser: {
        uid: currentUser?.uid,
        email: currentUser?.email
      },
      isBarangayAdmin,
      barangayAdminData: {
        ...barangayAdminData,
        // Log only specific fields to avoid sensitive data
        barangayName: barangayAdminData?.barangayName,
        displayName: barangayAdminData?.displayName
      }
    });
  }, [currentUser, isBarangayAdmin, barangayAdminData]);
  
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [filteredBlogs, setFilteredBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingBlog, setEditingBlog] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('All');
  // State for blog view modal
  const [selectedBlog, setSelectedBlog] = useState<Blog | null>(null);
  const [showBlogModal, setShowBlogModal] = useState(false);
  const [likedBlogs, setLikedBlogs] = useState<Set<string>>(new Set());
  const [darkMode, setDarkMode] = useState(false);
  const [confettiParticles, setConfettiParticles] = useState<ConfettiParticle[]>([]);
  const [readingProgress, setReadingProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [showConfetti, setShowConfetti] = useState(false);

  // Enhanced Confetti animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || confettiParticles.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let startTime: number | null = null;
    const duration = 1000; // 1 second

    const render = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      const updatedParticles = confettiParticles.filter(particle => {
        particle.update();
        particle.draw(ctx);
        return particle.opacity > 0 && elapsed < duration;
      });

      setConfettiParticles(updatedParticles);

      if (updatedParticles.length > 0 && elapsed < duration) {
        animationFrameId = requestAnimationFrame(render);
      } else {
        setShowConfetti(false);
      }
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [confettiParticles]);

  // Reading progress for modal
  useEffect(() => {
    if (!showBlogModal || !contentRef.current) return;

    const handleScroll = () => {
      const content = contentRef.current;
      if (!content) return;

      const scrollTop = content.scrollTop;
      const scrollHeight = content.scrollHeight - content.clientHeight;
      const progress = (scrollTop / scrollHeight) * 100;
      setReadingProgress(progress);
    };

    const content = contentRef.current;
    content.addEventListener('scroll', handleScroll);
    
    return () => content.removeEventListener('scroll', handleScroll);
  }, [showBlogModal]);

  // Trigger confetti to cover upper screen
  const triggerConfetti = () => {
    const particles = [];
    const width = typeof window !== 'undefined' ? window.innerWidth : 1200;
    const height = typeof window !== 'undefined' ? window.innerHeight : 800;
    
    // Create particles across the entire upper half of the screen
    for (let i = 0; i < 150; i++) {
      const x = Math.random() * width;
      const y = Math.random() * (height / 2); // Only upper half of screen
      particles.push(new ConfettiParticle(x, y));
    }
    
    setShowConfetti(true);
    setConfettiParticles(particles);
  };

  // Check if the current user is authorized to edit the blog
  const isAuthor = (blog: Blog) => {
    // For barangay admins: check if they're from the same barangay
    if (isBarangayAdmin) {
      const adminBarangay = barangayAdminData?.barangayName || barangayAdminData?.data?.barangayName;
      const isFromSameBarangay = adminBarangay === blog.barangay;
      
      console.log('Barangay Admin isAuthor check:', {
        blogId: blog.id,
        currentUserUid: currentUser?.uid,
        adminBarangay,
        blogBarangay: blog.barangay,
        isFromSameBarangay
      });
      
      return isFromSameBarangay;
    }
    
    // For private spot owners: check if they're the author of the blog
    if (isPrivateSpotAdmin && privateSpotAdminData) {
      const isAuthor = blog.author === (privateSpotAdminData.id || privateSpotAdminData.uid);
      
      console.log('Private Spot Owner isAuthor check:', {
        blogId: blog.id,
        currentUserUid: currentUser?.uid,
        blogAuthor: blog.author,
        privateSpotAdminId: privateSpotAdminData.id || privateSpotAdminData.uid,
        isAuthor
      });
      
      return isAuthor;
    }
    
    return false;
  };

  // Function to open blog in modal
  const openBlogModal = (blog: Blog, editMode = false) => {
    setSelectedBlog(blog);
    setShowBlogModal(true);
    setReadingProgress(0);
    document.body.style.overflow = 'hidden'; // Prevent background scrolling
    
    if (editMode) {
      startEdit(blog);
    }
  };

  // Function to close blog modal
  const closeBlogModal = () => {
    setShowBlogModal(false);
    setSelectedBlog(null);
    setReadingProgress(0);
    document.body.style.overflow = 'auto'; // Re-enable scrolling
    
    // If we were in edit mode, clean up the URL
    if (editBlogId) {
      const url = new URL(window.location.href);
      url.searchParams.delete('edit');
      window.history.replaceState({}, '', url.toString());
    }
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

  const categories = ["All", "Where to Stay", "Where to Eat", "Tourism", "Culture", "Events", "News", "Guide"];

  // Handle URL parameters when component mounts
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const blogId = params.get('id');
    const editParam = params.get('edit');
    
    if (blogId) {
      // Find the blog in the existing blogs
      const blogToEdit = [...blogs].find(blog => blog.id === blogId);
      
      if (blogToEdit) {
        // Open the blog in the modal
        setSelectedBlog(blogToEdit);
        setShowBlogModal(true);
        
        // If edit mode is requested, start editing
        if (editParam === 'true') {
          startEdit(blogToEdit);
        }
        
        // Clean up the URL
        const url = new URL(window.location.href);
        url.searchParams.delete('id');
        url.searchParams.delete('edit');
        window.history.replaceState({}, '', url.toString());
      }
    }
  }, [blogs]);

  // Load blogs on component mount
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        await fetchBlogs();
      } catch (error) {
        console.error('Error loading blog data:', error);
        toast.error('Failed to load blog data');
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, []);

  useEffect(() => {
    // Filter blogs based on category
    let result = [...blogs];
    
    if (selectedCategory !== 'All') {
      result = result.filter(blog => blog.category === selectedCategory);
    }
    
    setFilteredBlogs(result);
  }, [blogs, selectedCategory]);

  const fetchBlogs = async () => {
    try {
      const blogsRef = collection(db, 'blogs');
      
      // Fetch all blogs without any filters
      const blogsQuery = query(blogsRef);
      
      const blogsSnapshot = await getDocs(blogsQuery);
      const blogsData = blogsSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          // Handle both Timestamp and raw timestamp objects
          createdAt: data.createdAt || Timestamp.now(),
          updatedAt: data.updatedAt || Timestamp.now(),
          // Ensure all required fields have default values
          title: data.title || 'Untitled Blog',
          content: data.content || '',
          excerpt: data.excerpt || '',
          category: data.category || 'General',
          views: data.views || 0,
          barangay: data.barangay || 'Kapangan',
          author: data.author || 'system',
          authorName: data.authorName || 'Unknown Author'
        } as Blog;
      });
      
      // Sort in memory by createdAt in descending order
      blogsData.sort((a, b) => {
        const aDate = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt || 0);
        const bDate = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt || 0);
        return bDate.getTime() - aDate.getTime();
      });
      
      setBlogs(blogsData);
      return blogsData;
    } catch (error) {
      console.error('Error fetching blogs:', error);
      toast.error('Failed to load blogs');
      throw error;
    }
  };

  const handleUpdateBlog = async (blogId: string) => {
    if ((!isBarangayAdmin && !isPrivateSpotAdmin) || !selectedBlog) return;
    
    try {
      const blogRef = doc(db, 'blogs', blogId);
      const updateData = {
        title: selectedBlog.title,
        content: selectedBlog.content,
        excerpt: selectedBlog.excerpt,
        category: selectedBlog.category,
        imageUrl: selectedBlog.imageUrl,
        updatedAt: Timestamp.now()
      };
      
      await updateDoc(blogRef, updateData);
      
      // Update selectedBlog locally so detail view reflects edits immediately
      setSelectedBlog(prev => prev ? ({
        ...prev,
        ...updateData
      }) : prev);

      setEditingBlog(null);
      fetchBlogs();
      toast.success('Blog updated successfully!');
    } catch (error) {
      console.error('Error updating blog:', error);
      toast.error('Failed to update blog');
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0 || !selectedBlog) return;
    
    const file = e.target.files[0];
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    try {
      setIsUploading(true);
      
      // Create a temporary URL for immediate preview
      const tempUrl = URL.createObjectURL(file);
      
      // Update both editedSpot and selectedSpot with the temporary URL
      const updateWithTempImage = {
        ...selectedBlog,
        imageUrl: tempUrl,
        _tempImage: file
      };
      
      setSelectedBlog(updateWithTempImage);
      
      try {
        // Upload the file in the background
        const result = await uploadFile(file, 'blogs');
        const fileUrl = result.url;
        
        // If there was a previous image, delete it (but only if it's not the same as the new one)
        const oldImage = selectedBlog.imageUrl;
        if (oldImage && typeof oldImage === 'string' && oldImage.includes('appwrite.io') && oldImage !== fileUrl) {
          try {
            const fileId = oldImage.split('/files/')[1]?.split('/view')[0];
            if (fileId) {
              await deleteFile(fileId);
            }
          } catch (error) {
            console.error('Error deleting old image:', error);
            // Continue even if deletion fails
          }
        }

        // Update with the permanent URL
        const updateWithPermanentImage: Blog = {
          ...selectedBlog,
          imageUrl: fileUrl,
          _tempImage: undefined
        };
        
        setSelectedBlog(updateWithPermanentImage);
        
        toast.success('Image uploaded successfully');
      } catch (error) {
        console.error('Error uploading file:', error);
        toast.error('Failed to upload image');
        // Revert to previous state on error
        setSelectedBlog(prev => ({
          ...prev!,
          imageUrl: selectedBlog.imageUrl || '',
          _tempImage: undefined
        }));
      }
    } catch (error) {
      console.error('Error handling file change:', error);
      toast.error('An error occurred while processing the image');
    } finally {
      setIsUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveImage = async () => {
    if (!selectedBlog || !selectedBlog.imageUrl) return;
    
    const oldImageUrl = selectedBlog.imageUrl;
    
    try {
      setIsUploading(true);
      
      // Update UI immediately
      setSelectedBlog(prev => ({
        ...prev!,
        imageUrl: '',
        _tempImage: undefined
      }));
      
      // Delete the old image in the background
      if (oldImageUrl.includes('appwrite.io')) {
        try {
          const fileId = oldImageUrl.split('/files/')[1]?.split('/view')[0];
          if (fileId) {
            await deleteFile(fileId);
          }
        } catch (error) {
          console.error('Error deleting image from storage:', error);
          // Don't show error to user as the UI is already updated
        }
      }
      
      toast.success('Image removed successfully');
    } catch (error) {
      console.error('Error removing image:', error);
      // Revert the change if something goes wrong
      setSelectedBlog(prev => ({
        ...prev!,
        imageUrl: oldImageUrl
      }));
      toast.error('Failed to remove image');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteBlog = async (blogId: string) => {
    if (!isBarangayAdmin || !confirm('Are you sure you want to delete this blog post?')) return;
    
    try {
      await deleteDoc(doc(db, 'blogs', blogId));
      fetchBlogs();
      toast.success('Blog deleted successfully');
    } catch (error) {
      console.error('Error deleting blog:', error);
      toast.error('Failed to delete blog');
    }
  };

  const startEdit = (blog: Blog) => {
    if (!isBarangayAdmin && !isPrivateSpotAdmin) return false;
    setEditingBlog(blog.id);
    
    // Ensure the blog modal is open
    if (!showBlogModal) {
      setSelectedBlog(blog);
      setShowBlogModal(true);
    }
    
    return true;
  };

  const cancelEdit = () => {
    setEditingBlog(null);
  };

  const toggleLike = (blogId: string) => {
    const wasLiked = likedBlogs.has(blogId);
    setLikedBlogs(prev => {
      const newSet = new Set(prev);
      if (newSet.has(blogId)) {
        newSet.delete(blogId);
      } else {
        newSet.add(blogId);
        // Trigger confetti when liking
        triggerConfetti();
      }
      return newSet;
    });
  };

  // Get related blogs (same category, excluding current blog)
  const getRelatedBlogs = (currentBlog: Blog) => {
    return blogs
      .filter(blog => blog.id !== currentBlog.id && blog.category === currentBlog.category)
      .slice(0, 3); // Show max 3 related blogs
  };

  if (loading) {
    return (
      <div className={`min-h-screen ${darkMode ? 'bg-gradient-to-br from-gray-900 to-gray-800' : 'bg-gradient-to-br from-green-50 to-egg-white'}`}>
        {/* Enhanced Hero Section with Background Image */}
        <div 
          className="relative text-egg-white py-20 overflow-hidden bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: 'linear-gradient(rgba(59, 113, 100, 0.8), rgba(83, 199, 141, 0.9)), url("/assets/Municipalhall.jpg")',
            backgroundBlendMode: 'overlay'
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-primary-green to-accent-green opacity-70"></div>
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-egg-white to-light-green bg-clip-text text-transparent animate-fade-in">
              Kapangan Stories
            </h1>
            <p className="text-xl md:text-2xl text-egg-white/90 max-w-3xl mx-auto mb-8 leading-relaxed animate-fade-in-up">
              Journey through captivating tales, local wisdom, and hidden treasures from the heart of Kapangan
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen transition-colors duration-300 ${darkMode ? 'bg-gradient-to-br from-gray-900 to-gray-800' : 'bg-gradient-to-br from-green-50 to-egg-white'}`}>
      {/* Enhanced Confetti Canvas */}
      {showConfetti && (
        <canvas
          ref={canvasRef}
          className="fixed top-0 left-0 w-full h-1/2 pointer-events-none z-50"
          width={typeof window !== 'undefined' ? window.innerWidth : 0}
          height={typeof window !== 'undefined' ? window.innerHeight / 2 : 0}
        />
      )}

      {/* Adjusted Dark Mode Toggle - Lower position */}
      <button
        onClick={() => setDarkMode(!darkMode)}
        className={`fixed top-24 right-6 z-40 p-3 rounded-full transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-110 ${
          darkMode 
            ? 'bg-yellow-400 text-gray-900 hover:bg-yellow-300' 
            : 'bg-gray-800 text-yellow-300 hover:bg-gray-700'
        }`}
        aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
      >
        {darkMode ? <Sun size={20} /> : <Moon size={20} />}
      </button>

      {/* Enhanced Hero Section with Background Image */}
      <div 
        className="relative text-egg-white py-20 overflow-hidden bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: 'linear-gradient(rgba(59, 113, 100, 0.8), rgba(83, 199, 141, 0.9)), url("/assets/Municipalhall.jpg")',
          backgroundBlendMode: 'overlay'
        }}
      >
        {/* Fallback gradient background if image doesn't load */}
        <div className="absolute inset-0 bg-gradient-to-r from-primary-green to-accent-green opacity-70"></div>
        
        {/* Animated background elements */}
        <div className="absolute top-0 left-0 w-72 h-72 bg-light-green/10 rounded-full -translate-x-1/2 -translate-y-1/2 animate-pulse"></div>
                <div className="absolute top-30 left-50 w-72 h-72 bg-light-green/10 rounded-full -translate-x-1/2 -translate-y-1/2 animate-pulse"></div>

        <div className="absolute bottom-0 right-0 w-96 h-96 bg-accent-green/10 rounded-full translate-x-1/3 translate-y-1/3 animate-pulse delay-1000"></div>
                        <div className="absolute top-90 left-350 w-72 h-72 bg-light-green/10 rounded-full -translate-x-1/2 -translate-y-1/2 animate-pulse"></div>

        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-egg-white to-light-green bg-clip-text text-transparent animate-fade-in">
           Community Corner
          </h1>
          <p className="text-xl md:text-2xl text-egg-white/90 max-w-3xl mx-auto mb-8 leading-relaxed animate-fade-in-up">
        Read captivating stories, local wisdom, and hidden treasures from the heart of Kapangan
          </p>

          {/* Enhanced Category Filter */}
          <div className="max-w-4xl mx-auto animate-fade-in-up">
            <div className="flex flex-wrap justify-center gap-3">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-6 py-3 rounded-full text-sm font-semibold transition-all duration-300 transform hover:scale-105 hover:shadow-lg ${
                    selectedCategory === category
                      ? 'bg-egg-white text-primary-green shadow-lg scale-105'
                      : 'bg-white/15 text-egg-white hover:bg-white/25 backdrop-blur-sm'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Stats Bar */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className={`rounded-2xl p-6 shadow-lg border text-center hover:shadow-xl transition-all duration-300 ${
            darkMode ? 'bg-gray-800 border-gray-700 hover:border-green-500' : 'bg-white border-gray-100'
          }`}>
            <div className={`text-3xl font-bold mb-2 ${
              darkMode ? 'text-green-400' : 'text-primary-green'
            }`}>{blogs.length}</div>
            <div className={darkMode ? 'text-gray-300' : 'text-gray-600'}>Total Stories</div>
          </div>
          <div className={`rounded-2xl p-6 shadow-lg border text-center hover:shadow-xl transition-all duration-300 ${
            darkMode ? 'bg-gray-800 border-gray-700 hover:border-green-500' : 'bg-white border-gray-100'
          }`}>
            <div className={`text-3xl font-bold mb-2 ${
              darkMode ? 'text-green-300' : 'text-accent-green'
            }`}>{categories.length - 1}</div>
            <div className={darkMode ? 'text-gray-300' : 'text-gray-600'}>Categories</div>
          </div>
          <div className={`rounded-2xl p-6 shadow-lg border text-center hover:shadow-xl transition-all duration-300 ${
            darkMode ? 'bg-gray-800 border-gray-700 hover:border-green-500' : 'bg-white border-gray-100'
          }`}>
            <div className={`text-3xl font-bold mb-2 ${
              darkMode ? 'text-green-200' : 'text-light-green'
            }`}>{new Set(blogs.map(b => b.barangay)).size}</div>
            <div className={darkMode ? 'text-gray-300' : 'text-gray-600'}>Barangays</div>
          </div>
        </div>

        {/* Blog Posts Grid */}
        <div className="py-8">
          {filteredBlogs.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredBlogs.map((post) => (
                <article 
                  key={post.id} 
                  className={`group rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-500 border relative transform hover:-translate-y-2 ${
                    darkMode 
                      ? 'bg-gray-800 border-gray-700 hover:border-green-500/50' 
                      : 'bg-white border-gray-100 hover:border-primary-green/20'
                  }`}
                >
                  {/* Featured Badge */}
                  {post.views > 100 && (
                    <div className="absolute top-4 left-4 z-10">
                      <span className="bg-gradient-to-r from-accent-green to-light-green text-egg-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                        🔥 Popular
                      </span>
                    </div>
                  )}
                  
                  {/* Blog Image */}
                  <div className="relative h-48 overflow-hidden">
                    {post.imageUrl ? (
                      <img 
                        src={post.imageUrl} 
                        alt={post.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary-green to-accent-green/80">
                        <BookOpen className="w-12 h-12 text-white opacity-80" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300"></div>
                    
                    {/* Like Button Overlay */}
                    <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <button
                        onClick={() => toggleLike(post.id)}
                        className={`p-2 rounded-full backdrop-blur-sm transition-all duration-300 ${
                          likedBlogs.has(post.id) 
                            ? 'bg-red-500 text-white hover:bg-red-600' 
                            : darkMode 
                            ? 'bg-gray-700/90 text-gray-300 hover:bg-gray-600' 
                            : 'bg-white/90 text-gray-700 hover:bg-white'
                        }`}
                      >
                        <Heart size={16} fill={likedBlogs.has(post.id) ? 'currentColor' : 'none'} />
                      </button>
                    </div>
                  </div>
                  
                  {/* Blog Content */}
                  <div className="p-6">
                    <div className="flex items-center gap-2 mb-3">
                      <span className={`text-xs font-semibold px-3 py-1.5 rounded-full ${
                        darkMode 
                          ? 'bg-green-900/30 text-green-300' 
                          : 'bg-light-green/20 text-primary-green'
                      }`}>
                        {post.category}
                      </span>
                    </div>
                    
                    <h2 className={`text-xl font-bold mb-3 line-clamp-2 group-hover:text-primary-green transition-colors duration-300 ${
                      darkMode ? 'text-white' : 'text-gray-900'
                    }`}>
                      {post.title}
                    </h2>
                    
                    <p className={`mb-4 line-clamp-3 leading-relaxed ${
                      darkMode ? 'text-gray-300' : 'text-gray-600'
                    }`}>
                      {post.excerpt}
                    </p>
                    
                    {/* Author and Date */}
                    <div className={`flex items-center gap-3 text-sm mb-4 ${
                      darkMode ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                      <div className="flex items-center gap-1">
                        <User size={14} />
                        <span>{post.authorName || `Barangay ${post.barangay}`}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock size={14} />
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
                    </div>
                    
                    {/* Stats and CTA */}
                    <div className={`flex items-center justify-between pt-4 border-t ${
                      darkMode ? 'border-gray-700' : 'border-gray-100'
                    }`}>
                      <div className={`flex items-center gap-4 text-sm ${
                        darkMode ? 'text-gray-400' : 'text-gray-500'
                      }`}>
                        <div className="flex items-center gap-1">
                          <Eye size={14} />
                          <span>{post.views} views</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Heart size={14} />
                          <span>{likedBlogs.has(post.id) ? 'Liked' : 'Like'}</span>
                        </div>
                      </div>
                      
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          openBlogModal(post);
                        }}
                        className="bg-gradient-to-r from-primary-green to-accent-green text-egg-white px-4 py-2 rounded-full text-sm font-semibold hover:shadow-lg transform hover:scale-105 transition-all duration-300 flex items-center gap-2"
                      >
                        Read More
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className={`text-center py-16 rounded-2xl border-2 border-dashed ${
              darkMode ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-200'
            }`}>
              <div className="max-w-md mx-auto">
                <BookOpen size={64} className={`mx-auto mb-4 ${
                  darkMode ? 'text-gray-500' : 'text-gray-300'
                }`} />
                <h3 className={`text-2xl font-bold mb-2 ${
                  darkMode ? 'text-white' : 'text-gray-700'
                }`}>
                  {selectedCategory !== 'All' 
                    ? `No blog posts found in category: ${selectedCategory}`
                    : 'No blog posts yet'}
                </h3>
                <p className={`mb-6 ${
                  darkMode ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  {selectedCategory !== 'All'
                    ? 'Try selecting a different category.'
                    : 'Be the first to share amazing stories about Kapangan!'}
                </p>
                {isBarangayAdmin && (
                  <button className="bg-primary-green text-egg-white px-6 py-3 rounded-full font-semibold hover:bg-green-700 transition-colors duration-300">
                    Create First Blog
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

{/* Enhanced Blog Detail Modal */}
{showBlogModal && selectedBlog && (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-300 bg-black/60 backdrop-blur-sm">
    {/* Reading Progress Bar */}
    <div className="absolute top-0 left-0 w-full h-1 bg-gray-200/50 dark:bg-gray-700/50 z-50">
      <div 
        className="h-full bg-gradient-to-r from-primary-green to-accent-green transition-all duration-300"
        style={{ width: `${readingProgress}%` }}
      ></div>
    </div>

    {/* Modal Container */}
    <div className={`relative max-w-6xl w-full max-h-[90vh] rounded-3xl shadow-2xl overflow-hidden border transform animate-in zoom-in duration-300 ${
      darkMode 
        ? 'bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700' 
        : 'bg-gradient-to-br from-white to-egg-white border-gray-200'
    }`}>
      
      {/* Close Button */}
      <button
        onClick={closeBlogModal}
        className={`absolute top-4 right-4 z-50 p-3 rounded-full transition-all duration-300 hover:scale-110 shadow-lg ${
          darkMode 
            ? 'bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white' 
            : 'bg-white hover:bg-gray-100 text-gray-600 hover:text-gray-900'
        }`}
      >
        <X size={20} />
      </button>

      {/* Modal Content */}
      <div className="flex flex-col lg:flex-row h-full max-h-[90vh]">
        {/* Left Side - Image and Meta Info */}
        <div className="w-full lg:w-2/5 h-64 lg:h-auto overflow-y-auto">
          {/* Featured Image */}
          <div className="relative h-48 lg:h-64">
            {selectedBlog.imageUrl ? (
              <Image
                src={selectedBlog.imageUrl}
                alt={selectedBlog.title}
                fill
                className="object-cover"
                priority
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  const parent = target.parentElement;
                  if (parent) {
                    parent.classList.add('bg-gradient-to-br', 'from-primary-green', 'to-accent-green/80');
                    const categorySpan = document.createElement('span');
                    categorySpan.className = 'text-white text-2xl font-semibold';
                    categorySpan.textContent = selectedBlog.category || 'Image';
                    parent.appendChild(categorySpan);
                  }
                }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary-green to-accent-green/80">
                <BookOpen className="w-12 h-12 text-white opacity-80" />
              </div>
            )}
            
            {/* Image Overlay Gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent"></div>
            
            {/* Category Badge */}
            <div className="absolute top-4 left-4">
              <span className={`px-3 py-1.5 rounded-full text-xs font-semibold backdrop-blur-sm ${
                darkMode 
                  ? 'bg-green-900/80 text-green-300' 
                  : 'bg-white/90 text-primary-green'
              }`}>
                {selectedBlog.category}
              </span>
            </div>

            {/* Edit Image Controls */}
            {editingBlog === selectedBlog?.id && (
              <div className="absolute bottom-4 right-4 flex gap-2">
                <label
                  htmlFor="blog-image-upload"
                  className={`px-3 py-2 rounded-lg text-sm font-semibold cursor-pointer transition-all duration-300 backdrop-blur-sm ${
                    isUploading 
                      ? 'opacity-60 pointer-events-none' 
                      : darkMode 
                      ? 'bg-gray-700/90 text-green-400 hover:bg-gray-600/90' 
                      : 'bg-white/95 text-primary-green hover:bg-white'
                  }`}
                >
                  {isUploading ? '📤 Uploading...' : '📷 Change'}
                </label>
                {selectedBlog.imageUrl && (
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    disabled={isUploading}
                    className="bg-red-500/95 hover:bg-red-600 text-white px-3 py-2 rounded-lg text-sm font-semibold disabled:opacity-50 transition-all duration-300 backdrop-blur-sm"
                  >
                    🗑️ Remove
                  </button>
                )}
                <input
                  id="blog-image-upload"
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                  disabled={isUploading}
                />
              </div>
            )}
          </div>

          {/* Meta Information */}
          <div className="p-6 space-y-6">
            {/* Author Info */}
            <div className={`p-4 rounded-2xl border ${
              darkMode 
                ? 'bg-gradient-to-r from-gray-700 to-gray-600 border-gray-600' 
                : 'bg-gradient-to-r from-green-50 to-egg-white border-green-100'
            }`}>
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-gradient-to-br from-primary-green to-accent-green flex items-center justify-center text-white font-bold">
                  {selectedBlog.barangay.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className={`font-bold text-sm ${
                    darkMode ? 'text-white' : 'text-gray-900'
                  }`}>Barangay {selectedBlog.barangay}</p>
                  <p className={`text-xs flex items-center gap-1 ${
                    darkMode ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    <MapPin size={12} />
                    Local Community
                  </p>
                </div>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className={`p-3 rounded-xl border transition-all duration-300 ${
                darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'
              }`}>
                <div className={`text-lg font-bold ${
                  darkMode ? 'text-green-400' : 'text-primary-green'
                }`}>{selectedBlog.views || 0}</div>
                <div className={`text-xs ${
                  darkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>Views</div>
              </div>
              <div className={`p-3 rounded-xl border transition-all duration-300 ${
                darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'
              }`}>
                <div className={`text-lg font-bold ${
                  darkMode ? 'text-green-300' : 'text-accent-green'
                }`}>{likedBlogs.has(selectedBlog.id) ? 1 : 0}</div>
                <div className={`text-xs ${
                  darkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>Likes</div>
              </div>
              <div className={`p-3 rounded-xl border transition-all duration-300 ${
                darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'
              }`}>
                <div className={`text-lg font-bold ${
                  darkMode ? 'text-green-200' : 'text-light-green'
                }`}>{selectedBlog.content.length || 0}</div>
                <div className={`text-xs ${
                  darkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>Words</div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => toggleLike(selectedBlog.id)}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold transition-all duration-300 ${
                  likedBlogs.has(selectedBlog.id)
                    ? 'bg-red-500 text-white hover:bg-red-600 shadow-lg'
                    : darkMode
                    ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Heart size={18} fill={likedBlogs.has(selectedBlog.id) ? 'currentColor' : 'none'} />
                {likedBlogs.has(selectedBlog.id) ? 'Liked' : 'Like'}
              </button>
            </div>

            {/* Date Information */}
            <div className={`text-center p-3 rounded-xl border ${
              darkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'
            }`}>
              <div className={`flex items-center justify-center gap-2 text-sm ${
                darkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>
                <Calendar size={16} />
                <span>
                  {selectedBlog.createdAt?.toDate 
                    ? selectedBlog.createdAt.toDate().toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      }) : 'N/A'}
                </span>
              </div>
            </div>

            {/* Related Blogs */}
            {getRelatedBlogs(selectedBlog).length > 0 && (
              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <h3 className={`font-semibold mb-3 text-sm ${
                  darkMode ? 'text-white' : 'text-gray-900'
                }`}>Related Stories</h3>
                <div className="space-y-2">
                  {getRelatedBlogs(selectedBlog).map(blog => (
                    <button
                      key={blog.id}
                      onClick={() => openBlogModal(blog)}
                      className={`w-full text-left p-2 rounded-lg transition-all duration-300 text-sm ${
                        darkMode 
                          ? 'bg-gray-700 hover:bg-gray-600 border border-gray-600' 
                          : 'bg-green-50 hover:bg-green-100 border border-green-100'
                      }`}
                    >
                      <h4 className={`font-medium line-clamp-1 ${
                        darkMode ? 'text-white' : 'text-gray-900'
                      }`}>{blog.title}</h4>
                      <p className={`text-xs mt-1 ${
                        darkMode ? 'text-gray-400' : 'text-gray-600'
                      }`}>
                        {blog.createdAt?.toDate 
                          ? new Date(blog.createdAt.toDate()).toLocaleDateString()
                          : 'N/A'}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Side - Content */}
        <div className="w-full lg:w-3/5 h-96 lg:h-auto overflow-y-auto">
          <div className="p-6 lg:p-8">
            {/* Header with Edit Controls */}
            <div className="flex items-start justify-between mb-6">
              <div className="flex-1">
                {editingBlog === selectedBlog?.id ? (
                  <input
                    type="text"
                    value={selectedBlog.title}
                    onChange={(e) => {
                      setSelectedBlog({
                        ...selectedBlog,
                        title: e.target.value
                      });
                    }}
                    className={`w-full text-2xl lg:text-3xl font-bold border-2 rounded-xl px-4 py-3 focus:outline-none focus:border-primary-green ${
                      darkMode 
                        ? 'bg-gray-800 border-green-600 text-white' 
                        : 'border-primary-green/30 text-gray-900'
                    }`}
                  />
                ) : (
                  <h1 className={`text-2xl lg:text-3xl font-bold leading-tight ${
                    darkMode ? 'text-white' : 'text-gray-900'
                  }`}>
                    {selectedBlog.title}
                  </h1>
                )}
              </div>

              {/* Edit/Save Controls */}
              {(isBarangayAdmin || isPrivateSpotAdmin) && isAuthor(selectedBlog) && (
                <div className="flex gap-2 ml-4">
                  {editingBlog === selectedBlog?.id ? (
                    <>
                      <button
                        onClick={() => handleUpdateBlog(selectedBlog.id)}
                        className="flex items-center gap-2 bg-gradient-to-r from-primary-green to-accent-green text-egg-white px-4 py-2 rounded-lg font-semibold hover:shadow-lg transition-all duration-300"
                      >
                        <Save size={16} />
                        Save
                      </button>
                      <button
                        onClick={cancelEdit}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all duration-300 ${
                          darkMode 
                            ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        <X size={16} />
                        Cancel
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => startEdit(selectedBlog)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all duration-300 ${
                        darkMode 
                          ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      <Edit size={16} />
                      Edit
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Blog Content */}
            <article className="max-w-none">
              {editingBlog === selectedBlog?.id ? (
                <div className="space-y-6">
                  <div>
                    <label className={`block text-sm font-semibold mb-3 ${
                      darkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>Excerpt Summary</label>
                    <textarea
                      value={selectedBlog.excerpt}
                      onChange={(e) => {
                        setSelectedBlog({
                          ...selectedBlog,
                          excerpt: e.target.value
                        });
                      }}
                      rows={3}
                      className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:border-primary-green resize-none ${
                        darkMode 
                          ? 'bg-gray-700 border-green-600 text-white' 
                          : 'border-primary-green/30 text-gray-900'
                      }`}
                      placeholder="Write a compelling excerpt that summarizes your blog..."
                    />
                  </div>
                  <div>
                    <label className={`block text-sm font-semibold mb-3 ${
                      darkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>Blog Content</label>
                    <textarea
                      value={selectedBlog.content}
                      onChange={(e) => {
                        setSelectedBlog({
                          ...selectedBlog,
                          content: e.target.value
                        });
                      }}
                      rows={15}
                      className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:border-primary-green font-mono resize-none leading-relaxed ${
                        darkMode 
                          ? 'bg-gray-700 border-green-600 text-white' 
                          : 'border-primary-green/30 text-gray-900'
                      }`}
                      placeholder="Write your amazing story here... (Supports basic markdown: **bold**, *italic*, ## headings)"
                    />
                  </div>
                </div>
              ) : (
                <div className="prose prose-lg max-w-none">
                  {selectedBlog.excerpt && (
                    <div className={`border-l-4 p-6 rounded-r-2xl mb-8 ${
                      darkMode 
                        ? 'bg-gradient-to-r from-green-900/20 to-green-800/10 border-green-600' 
                        : 'bg-gradient-to-r from-primary-green/5 to-accent-green/5 border-primary-green'
                    }`}>
                      <p className={`text-lg leading-relaxed font-medium italic ${
                        darkMode ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        "{selectedBlog.excerpt}"
                      </p>
                    </div>
                  )}
                  <div 
                    className={`leading-relaxed text-lg space-y-6 ${
                      darkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}
                    dangerouslySetInnerHTML={{ 
                      __html: selectedBlog.content
                        ?.replace(/\n\n/g, '</p><p class="my-6 leading-relaxed">')
                        ?.replace(/^##\s+(.*$)/gm, '</p><h2 class="text-3xl font-bold mt-12 mb-6 pb-2 border-b">$1</h2><p>')
                        ?.replace(/^###\s+(.*$)/gm, '</p><h3 class="text-2xl font-semibold mt-10 mb-4">$1</h3><p>')
                        ?.replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold">$1</strong>')
                        ?.replace(/\*(.*?)\*/g, '<em class="italic">$1</em>') || ''
                    }}
                  />
                </div>
              )}
            </article>
          </div>
        </div>
      </div>
    </div>
  </div>
)}

      {/* Enhanced Footer */}
      <footer className="bg-gradient-to-r from-primary-green to-accent-green text-egg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-3xl font-bold text-light-green mb-6">Kapangan Wonders</h3>
              <p className="text-light-green/80 leading-relaxed">
                Uncovering the hidden treasures, rich culture, and breathtaking beauty of Kapangan, Benguet through authentic local stories.
              </p>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-6">Explore More</h4>
              <ul className="space-y-3">
                <li><Link href="/tourist-spots" className="text-light-green/80 hover:text-egg-white transition-colors duration-300 flex items-center gap-2 group">
                  <div className="w-1 h-1 bg-light-green rounded-full group-hover:scale-150 transition-transform"></div>
                  Tourist Spots
                </Link></li>
                <li><Link href="/blogs" className="text-light-green/80 hover:text-egg-white transition-colors duration-300 flex items-center gap-2 group">
                  <div className="w-1 h-1 bg-light-green rounded-full group-hover:scale-150 transition-transform"></div>
                  Local Blogs
                </Link></li>
                <li><Link href="/contact" className="text-light-green/80 hover:text-egg-white transition-colors duration-300 flex items-center gap-2 group">
                  <div className="w-1 h-1 bg-light-green rounded-full group-hover:scale-150 transition-transform"></div>
                  Get in Touch
                </Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-6">Support</h4>
              <ul className="space-y-3">
                <li><Link href="/contact" className="text-light-green/80 hover:text-egg-white transition-colors duration-300">Help Center</Link></li>
                <li><Link href="/contact" className="text-light-green/80 hover:text-egg-white transition-colors duration-300">Contact Us</Link></li>
                <li><Link href="/signin" className="text-light-green/80 hover:text-egg-white transition-colors duration-300">Community Login</Link></li>
                <li><Link href="/signup" className="text-light-green/80 hover:text-egg-white transition-colors duration-300">Join Our Community</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-6">Connect With Us</h4>
              <div className="flex space-x-4 mb-6">
                <a href="#" className="bg-white/10 hover:bg-white/20 p-3 rounded-xl transition-all duration-300 transform hover:scale-110 hover:rotate-12 group">
                  <Facebook size={20} className="group-hover:text-blue-400 transition-colors" />
                </a>
                <a href="#" className="bg-white/10 hover:bg-white/20 p-3 rounded-xl transition-all duration-300 transform hover:scale-110 hover:rotate-12 group">
                  <Twitter size={20} className="group-hover:text-blue-400 transition-colors" />
                </a>
                <a href="#" className="bg-white/10 hover:bg-white/20 p-3 rounded-xl transition-all duration-300 transform hover:scale-110 hover:rotate-12 group">
                  <Instagram size={20} className="group-hover:text-pink-500 transition-colors" />
                </a>
                <a href="#" className="bg-white/10 hover:bg-white/20 p-3 rounded-xl transition-all duration-300 transform hover:scale-110 hover:rotate-12 group">
                  <Youtube size={20} className="group-hover:text-red-500 transition-colors" />
                </a>
              </div>
              <p className="text-light-green/70 text-sm">
                Join our community and stay updated with the latest stories from Kapangan.
              </p>
            </div>
          </div>
          <div className="border-t border-light-green/20 mt-12 pt-8 text-center text-light-green/80">
            <p className="text-lg">&copy; 2024 Kapangan Wonders. Crafted with 💚 for our beautiful community.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}