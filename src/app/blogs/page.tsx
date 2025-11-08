'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/firebase/config';
import { collection, query, where, getDocs, addDoc, updateDoc, deleteDoc, doc, setDoc, Timestamp, orderBy, getDoc } from 'firebase/firestore';
import { BookOpen, Plus, Edit, Trash2, Save, X, Calendar, Eye, ArrowLeft } from 'lucide-react';
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
  tags: string[];
  status: 'draft' | 'published';
  views: number;
  imageUrl?: string;
  createdAt: any;
  updatedAt: any;
}

export default function Blogs() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { currentUser, isBarangayAdmin, barangayAdminData } = useAuth();
  
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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Check if the current user is a barangay admin from the same barangay as the blog
  const isAuthor = (blog: Blog) => {
    // Get barangay name from either barangayAdminData.barangay or barangayAdminData.data.barangayName
    const adminBarangay = barangayAdminData?.barangayName || barangayAdminData?.data?.barangayName;
    const isFromSameBarangay = adminBarangay === blog.barangay;
    
    console.log('isAuthor check:', {
      blogId: blog.id,
      currentUserUid: currentUser?.uid,
      barangayAdminData: barangayAdminData, // Log the full barangayAdminData
      adminBarangay,
      blogBarangay: blog.barangay,
      isFromSameBarangay
    });
    
    return isFromSameBarangay && isBarangayAdmin;
  };

  // Function to open blog in modal
  const openBlogModal = (blog: Blog, editMode = false) => {
    setSelectedBlog(blog);
    setShowBlogModal(true);
    document.body.style.overflow = 'hidden'; // Prevent background scrolling
    
    if (editMode) {
      startEdit(blog);
    }
  };

  // Function to close blog modal
  const closeBlogModal = () => {
    setShowBlogModal(false);
    setSelectedBlog(null);
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

  const categories = ["All", "Tourism", "Culture", "Events", "News", "Guide", "Where to Stay", "Where to Eat"];

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
  
  // Sample blog data for 'Where to Eat' and 'Where to Stay' categories
  const sampleBlogs: Blog[] = [
    {
      id: 'sample-eat-1',
      title: 'Local Delicacies in Kapangan',
      content: 'Discover the best local dishes in Kapangan...',
      excerpt: 'A guide to the most delicious local dishes in Kapangan',
      category: 'Where to Eat',
      tags: ['food', 'local cuisine', 'restaurants'],
      status: 'published',
      views: 0,
      barangay: 'Kapangan',
      author: 'system',
      authorName: 'Kapangan Wonders',
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    },
    {
      id: 'sample-stay-1',
      title: 'Best Places to Stay in Kapangan',
      content: 'Find the perfect accommodation for your stay in Kapangan...',
      excerpt: 'Top accommodations and homestays in Kapangan',
      category: 'Where to Stay',
      tags: ['accommodation', 'hotels', 'homestays'],
      status: 'published',
      views: 0,
      barangay: 'Kapangan',
      author: 'system',
      authorName: 'Kapangan Wonders',
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    }
  ];

  // Function to ensure all sample blogs for 'Where to Eat' and 'Where to Stay' are imported into Firestore if not present
  const initializeSampleBlogs = async () => {
    try {
      const blogsRef = collection(db, 'blogs');
      const querySnapshot = await getDocs(blogsRef);
      const existingTitles = new Set(querySnapshot.docs.map(doc => doc.data().title));
      // Only add sample blogs that do not exist by title
      const missingSamples = sampleBlogs.filter(
        (blog) => (blog.category === 'Where to Eat' || blog.category === 'Where to Stay') && !existingTitles.has(blog.title)
      );
      if (missingSamples.length > 0) {
        const batch = [];
        for (const blog of missingSamples) {
          // Use addDoc to let Firestore generate a unique ID
          batch.push(addDoc(blogsRef, {
            ...blog,
            id: '', // Will be updated after creation
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now()
          }));
        }
        // Wait for all docs to be added, then update their 'id' field to match Firestore's generated ID
        const addedDocs = await Promise.all(batch);
        const updateBatch = [];
        for (let i = 0; i < addedDocs.length; i++) {
          const docRef = addedDocs[i];
          updateBatch.push(updateDoc(docRef, { id: docRef.id }));
        }
        await Promise.all(updateBatch);
        console.log('Sample "Where to Eat" and "Where to Stay" blogs added successfully');
        fetchBlogs(); // Refresh the blogs list
      }
    } catch (error) {
      console.error('Error initializing sample blogs:', error);
    }
  };

  // Load blogs and initialize sample blogs on component mount
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        await initializeSampleBlogs();
        await fetchBlogs();
      } catch (error) {
        console.error('Error initializing data:', error);
        toast.error('Failed to load blog data');
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, []);

  // Merge sample blogs with fetched blogs (avoid duplicates by id)
  const getAllBlogs = () => {
    // If a blog with the same id exists in db, skip the sample
    const dbIds = new Set(blogs.map((b) => b.id));
    return [
      ...blogs,
      ...sampleBlogs.filter((sample) => !dbIds.has(sample.id))
    ];
  };

  useEffect(() => {
    // Filter blogs based on category
    let result = getAllBlogs();
    if (selectedCategory !== 'All') {
      result = result.filter(blog => blog.category === selectedCategory);
    }
    // Sort so that sample blogs for 'Where to Eat' and 'Where to Stay' appear at the top
    if (selectedCategory === 'Where to Eat' || selectedCategory === 'Where to Stay') {
      result = [
        ...result.filter(b => b.id.startsWith('sample-')),
        ...result.filter(b => !b.id.startsWith('sample-'))
      ];
    }
    setFilteredBlogs(result);
  }, [blogs, selectedCategory, isBarangayAdmin]);

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
          tags: Array.isArray(data.tags) ? data.tags : [],
          status: data.status || 'draft',
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
    if (!isBarangayAdmin) return;
    
    try {
      const blogRef = doc(db, 'blogs', blogId);
      await updateDoc(blogRef, {
        title: selectedBlog?.title,
        content: selectedBlog?.content,
        excerpt: selectedBlog?.excerpt,
        category: selectedBlog?.category,
        tags: selectedBlog?.tags,
        status: selectedBlog?.status,
        imageUrl: selectedBlog?.imageUrl,
        updatedAt: Timestamp.now()
      });
      // Update selectedBlog locally so detail view reflects edits immediately
      setSelectedBlog(prev => prev ? ({
        ...prev,
        title: selectedBlog?.title,
        content: selectedBlog?.content,
        excerpt: selectedBlog?.excerpt,
        category: selectedBlog?.category,
        tags: selectedBlog?.tags,
        status: selectedBlog?.status,
        imageUrl: selectedBlog?.imageUrl,
        updatedAt: Timestamp.now()
      } as Blog) : prev);

      setEditingBlog(null);
      fetchBlogs();
    } catch (error) {
      console.error('Error updating blog:', error);
      alert('Failed to update blog');
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
        const updateWithPermanentImage = {
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
    } catch (error) {
      console.error('Error deleting blog:', error);
      alert('Failed to delete blog');
    }
  };

  const startEdit = (blog: Blog) => {
    if (!isBarangayAdmin) return false;
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
                        <span>Barangay {post.barangay}</span>
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
                  {isBarangayAdmin && isAuthor(post) && (
                    <div className="px-6 py-3 bg-gray-50 border-t border-gray-100 flex justify-end">
                      {/* Delete button removed as per request */}
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
            </div>
          )}
        </div>

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
                    onClick={() => {
                      const fromDashboard = searchParams.get('from') === 'dashboard' || editingBlog === selectedBlog?.id;
                      console.log('From dashboard or editing:', { fromDashboard, editingBlog, selectedBlogId: selectedBlog?.id });
                      
                      if (fromDashboard) {
                        router.push('/dashboard');
                        closeBlogModal();
                      } else {
                        closeBlogModal();
                      }
                    }}
                    className="flex items-center gap-1 text-primary-green hover:text-accent-green font-medium transition-colors duration-200"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    {searchParams.get('from') === 'dashboard' || editingBlog === selectedBlog?.id ? 'Back to Dashboard' : 'Back to Blogs'}
                  </button>
                  
                  {isBarangayAdmin && isAuthor(selectedBlog) && editingBlog === selectedBlog?.id && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleUpdateBlog(selectedBlog.id)}
                        className="flex items-center gap-1 bg-primary-green text-egg-white px-3 py-1 rounded-md text-sm font-medium hover:bg-green-700 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Save
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="flex items-center gap-1 bg-gray-100 text-primary-green px-3 py-1 rounded-md text-sm font-medium hover:bg-gray-200 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        Cancel
                      </button>
                    </div>
                  )}
                </div>

                {editingBlog === selectedBlog?.id ? (
                  <input
                    type="text"
                    value={selectedBlog?.title || ''}
                    onChange={(e) => {
                      if (selectedBlog) {
                        setSelectedBlog({
                          ...selectedBlog,
                          title: e.target.value
                        });
                      }
                    }}
                    className="w-full mt-2 text-2xl md:text-3xl font-bold text-gray-900 border border-border-green rounded px-3 py-2"
                  />
                ) : (
                  <h1 className="text-2xl md:text-3xl font-bold text-gray-900 line-clamp-2 mt-2">
                    {selectedBlog?.title}
                  </h1>
                )}
              </div>
            </div>
            
            <div className="flex flex-col md:flex-row h-[calc(100vh-120px)] overflow-hidden">
              {/* Left Side - Image and Basic Info */}
              <div className="w-full md:w-1/2 h-full overflow-y-auto p-6 md:p-8 border-r border-gray-200">
                {/* Featured Image */}
                <div className="relative">
                  <div className="w-full h-64 md:h-80 lg:h-96 rounded-xl bg-gray-100 relative overflow-hidden">
                    {selectedBlog?.imageUrl ? (
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
                        <span className="text-white text-2xl font-semibold">
                          {selectedBlog?.category || 'No Image'}
                        </span>
                      </div>
                    )}
                    {editingBlog === selectedBlog?.id && (
                      <div className="absolute bottom-4 right-4 flex gap-2">
                        <label
                          htmlFor="blog-image-upload"
                          className={`bg-white/90 hover:bg-white text-primary-green px-3 py-1.5 rounded-md text-sm font-medium cursor-pointer transition-colors shadow-md ${isUploading ? 'opacity-60 pointer-events-none' : ''}`}
                        >
                          {isUploading ? 'Uploading...' : 'Change Image'}
                        </label>
                        {selectedBlog?.imageUrl && (
                          <button
                            type="button"
                            onClick={handleRemoveImage}
                            disabled={isUploading}
                            className="bg-red-500/90 hover:bg-red-600 text-white px-3 py-1.5 rounded-md text-sm font-medium disabled:opacity-50 transition-colors shadow-md"
                          >
                            Remove
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
                </div>
                
                {/* Date and Category */}
                <div className="flex items-center gap-3 text-sm text-gray-600 mb-6">
                  <span>
                    {selectedBlog?.createdAt?.toDate 
                      ? selectedBlog?.createdAt.toDate().toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        }) : 'N/A'}
                  </span>
                  <span>•</span>
                  <span className="font-medium">
                    {editingBlog === selectedBlog?.id ? (
                      <select
                        value={selectedBlog?.category || 'Tourism'}
                        onChange={(e) => {
                          if (selectedBlog) {
                            setSelectedBlog({
                              ...selectedBlog,
                              category: e.target.value
                            });
                          }
                        }}
                        className="px-2 py-1 border border-border-green rounded text-sm"
                      >
                        <option value="Tourism">Tourism</option>
                        <option value="Culture">Culture</option>
                        <option value="Events">Events</option>
                        <option value="News">News</option>
                        <option value="Guide">Guide</option>
                        <option value="Where to Stay">Where to Stay</option>
                        <option value="Where to Eat">Where to Eat</option>
                      </select>
                    ) : (
                      selectedBlog?.category
                    )}
                  </span>
                </div>
                
                {/* Author Info */}
                <div className="flex items-center gap-4 pt-4 border-t border-gray-100 mt-6">
                  <div className="h-12 w-12 rounded-full bg-gray-200 flex items-center justify-center text-gray-500">
                    {selectedBlog?.barangay.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Barangay {selectedBlog?.barangay}</p>
                    <p className="text-sm text-gray-500">Barangay Admin</p>
                  </div>
                </div>
                
                {/* Tags */}
                {editingBlog === selectedBlog?.id ? (
                  <div className="mt-6">
                    <h3 className="text-sm font-medium text-gray-500 mb-2">Tags (comma separated)</h3>
                    <input
                      type="text"
                      value={selectedBlog?.tags?.join(', ') || ''}
                      onChange={(e) => {
                        if (selectedBlog) {
                          setSelectedBlog({
                            ...selectedBlog,
                            tags: e.target.value.split(',').map(tag => tag.trim())
                          });
                        }
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      placeholder="travel, adventure, kapangan"
                    />
                  </div>
                ) : (
                  selectedBlog?.tags && selectedBlog?.tags.length > 0 && (
                    <div className="mt-6">
                      <h3 className="text-sm font-medium text-gray-500 mb-2">Tags</h3>
                      <div className="flex flex-wrap gap-2">
                        {selectedBlog?.tags.map((tag, index) => (
                          <span key={index} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )
                )}
              </div>
              
              {/* Right Side - Content */}
              <div className="w-full md:w-1/2 h-full overflow-y-auto p-6 md:p-8">
                {/* Blog Content */}
                <article className="prose max-w-none text-gray-700 leading-relaxed">
                  {editingBlog === selectedBlog?.id ? (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-500 mb-2">Excerpt</label>
                        <textarea
                          value={selectedBlog?.excerpt || ''}
                          onChange={(e) => {
                            if (selectedBlog) {
                              setSelectedBlog({
                                ...selectedBlog,
                                excerpt: e.target.value
                              });
                            }
                          }}
                          rows={3}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-500 mb-2">Content</label>
                        <textarea
                          value={selectedBlog?.content || ''}
                          onChange={(e) => {
                            if (selectedBlog) {
                              setSelectedBlog({
                                ...selectedBlog,
                                content: e.target.value
                              });
                            }
                          }}
                          rows={12}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg font-mono"
                        />
                      </div>
                    </div>
                  ) : (
                    <>
                      {selectedBlog?.excerpt && (
                        <p className="text-lg text-gray-700 mb-8 leading-relaxed font-medium">
                          {selectedBlog.excerpt}
                        </p>
                      )}
                      <div 
                        className="prose-lg max-w-none"
                        dangerouslySetInnerHTML={{ 
                          __html: selectedBlog?.content
                            ?.replace(/\n\n/g, '</p><p class="my-6 text-gray-700 leading-relaxed">')
                            ?.replace(/^##\s+(.*$)/gm, '</p><h2 class="text-2xl font-bold text-gray-900 mt-12 mb-6 pb-2">$1</h2><p>')
                            ?.replace(/^###\s+(.*$)/gm, '</p><h3 class="text-xl font-semibold text-gray-900 mt-10 mb-4">$1</h3><p>')
                            ?.replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-gray-900">$1</strong>')
                            ?.replace(/\*(.*?)\*/g, '<em class="italic">$1</em>') || ''
                        }}
                      />
                    </>
                  )}
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
