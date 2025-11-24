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
  authorType?: string;
  category: string;
  contactNumber?: string;
  facebookUrl?: string;
  location?: string;
  tags?: string[];
  views: number;
  imageUrl?: string;
  _tempImage?: File;
  createdAt: any;
  updatedAt: any;
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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Check if the current user is authorized to edit the blog
  const isAuthor = (blog: Blog) => {
    // Main admin has full access to all blogs
    if (currentUser?.email === 'kapanganwonders@gmail.com') {
      return true;
    }
    
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
      // Check multiple possible ID fields in privateSpotAdminData
      const adminId = privateSpotAdminData.id || 
                     privateSpotAdminData.uid || 
                     privateSpotAdminData.userId ||
                     currentUser?.uid;
      
      const isAuthor = blog.author === adminId;
      
      console.log('Private Spot Owner isAuthor check:', {
        blogId: blog.id,
        currentUserUid: currentUser?.uid,
        blogAuthor: blog.author,
        privateSpotAdminData: privateSpotAdminData,
        adminId,
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

  const categories = ["All", "Tourism", "Culture", "Events", "Guide", "Where to Stay", "Where to Eat"];

  // Handle URL parameters when component mounts
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const blogId = params.get('id');
    const editParam = params.get('edit');
    
    if (!blogId) return;

    const handleBlogEdit = async () => {
      try {
        // First check if blog exists in the current blogs list
        const existingBlog = blogs.find(blog => blog.id === blogId);
        
        if (existingBlog) {
          setSelectedBlog(existingBlog);
          setShowBlogModal(true);
          
          if (editParam === 'true' && isAuthor(existingBlog)) {
            startEdit(existingBlog);
          }
          
          // Clean up URL
          const cleanUrl = new URL(window.location.href);
          cleanUrl.searchParams.delete('id');
          cleanUrl.searchParams.delete('edit');
          window.history.replaceState({}, '', cleanUrl.toString());
          return;
        }
        
        // If blog not found in existing blogs and it's an admin edit request
        if (editParam === 'true' && currentUser?.email === 'kapanganwonders@gmail.com') {
          const blogDoc = await getDoc(doc(db, 'blogs', blogId));
          
          if (!blogDoc.exists()) {
            toast.error('Blog not found');
            return;
          }
          
          const blogData = blogDoc.data() as Blog;
          const blogWithId = {
            ...blogData,
            id: blogDoc.id
          };
          
          setSelectedBlog(blogWithId);
          setShowBlogModal(true);
          startEdit(blogWithId);
          
          // Clean up URL after successful load
          const cleanUrl = new URL(window.location.href);
          cleanUrl.searchParams.delete('id');
          cleanUrl.searchParams.delete('edit');
          window.history.replaceState({}, '', cleanUrl.toString());
        }
      } catch (error) {
        console.error('Error handling blog edit:', error);
        toast.error('Failed to process edit request');
        
        // Clean up URL on error as well
        const cleanUrl = new URL(window.location.href);
        cleanUrl.searchParams.delete('id');
        cleanUrl.searchParams.delete('edit');
        window.history.replaceState({}, '', cleanUrl.toString());
      }
    };
    
    handleBlogEdit();
  }, [blogs, currentUser]);
  
 

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
          // Explicitly map all fields including imageUrl
          title: data.title || 'Untitled Blog',
          content: data.content || '',
          excerpt: data.excerpt || '',
          category: data.category || 'General',
          views: data.views || 0,
          barangay: data.barangay || 'Kapangan',
          author: data.author || 'system',
          authorName: data.authorName || 'Unknown Author',
          authorBio: data.authorBio || '',
          // Ensure imageUrl is properly included
          imageUrl: data.imageUrl || '',
          // Handle timestamps
          createdAt: data.createdAt || Timestamp.now(),
          updatedAt: data.updatedAt || Timestamp.now()
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
    if ((!isBarangayAdmin && !isPrivateSpotAdmin && currentUser?.email !== 'kapanganwonders@gmail.com') || !selectedBlog) return;
    
    try {
      const blogRef = doc(db, 'blogs', blogId);
      const updateData = {
        title: selectedBlog.title,
        content: selectedBlog.content,
        excerpt: selectedBlog.excerpt,
        category: selectedBlog.category,
        // Include the new fields
        ...(selectedBlog.location && { location: selectedBlog.location }),
        ...(selectedBlog.contactNumber && { contactNumber: selectedBlog.contactNumber }),
        ...(selectedBlog.facebookUrl && { facebookUrl: selectedBlog.facebookUrl }),
        // Ensure we're using the latest image URL and not a temporary one
        imageUrl: selectedBlog._tempImage ? selectedBlog.imageUrl : (selectedBlog.imageUrl || ''),
        updatedAt: Timestamp.now()
      };
      
      await updateDoc(blogRef, updateData);
      
      // Update selectedBlog locally so detail view reflects edits immediately
      setSelectedBlog(prev => {
        if (!prev) return null;
        return {
          ...prev,
          ...updateData,
          _tempImage: undefined // Clear any temporary image after successful update
        };
      });

      // Also update the blogs array to reflect the changes
      setBlogs(prevBlogs => 
        prevBlogs.map(blog => 
          blog.id === blogId 
            ? { ...blog, ...updateData } 
            : blog
        )
      );

      setEditingBlog(null);
      toast.success('Blog updated successfully');
    } catch (error) {
      console.error('Error updating blog:', error);
      alert('Failed to update blog');
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0] || !selectedBlog) return;
    
    const file = e.target.files[0];
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    try {
      setIsUploading(true);
      
      // Create a preview URL for instant display
      const tempUrl = URL.createObjectURL(file);
      
      // Update with temporary URL immediately for instant feedback
      setSelectedBlog(prev => ({
        ...prev!,
        imageUrl: tempUrl,
        _tempImage: file
      }));

      try {
        // Upload the file
        const result = await uploadFile(file, 'blogs');
        if (!result?.url) throw new Error('Failed to get file URL after upload');

        // Clean up the temporary URL
        URL.revokeObjectURL(tempUrl);
        
        const fileUrl = result.url;
        
        // If there was a previous image, delete it (but only if it's not the same as the new one)
        const oldImage = selectedBlog.imageUrl;
        if (oldImage && typeof oldImage === 'string' && oldImage.includes('appwrite.io') && oldImage !== fileUrl) {
          try {
            const fileId = oldImage.split('/files/')[1]?.split('/view')[0];
            if (fileId) {
              await deleteFile(fileId).catch(error => 
                console.error('Error deleting old image:', error)
              );
            }
          } catch (error) {
            console.error('Error in old image cleanup:', error);
            // Continue even if deletion fails
          }
        }
        
        // Update with permanent URL and clear the temp file
        setSelectedBlog(prev => ({
          ...prev!,
          imageUrl: fileUrl,
          _tempImage: undefined
        }));
        
        // Also update the blogs array to reflect the new image
        setBlogs(prevBlogs => 
          prevBlogs.map(blog => 
            blog.id === selectedBlog.id 
              ? { ...blog, imageUrl: fileUrl } 
              : blog
          )
        );
        
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
    if (!blog || (!isBarangayAdmin && !isPrivateSpotAdmin && currentUser?.email !== 'kapanganwonders@gmail.com')) {
      console.log('Not authorized to edit this blog');
      return false;
    }
  
    // Create a clean copy of the blog with ensured imageUrl
    const blogWithImage = {
      ...blog,
      imageUrl: blog.imageUrl || '', // Ensure imageUrl is always defined
      _tempImage: undefined // Reset any temporary image state
    };
    
    setSelectedBlog(blogWithImage);
    setEditingBlog(blog.id);
    
    // Ensure the blog modal is open
    if (!showBlogModal) {
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
      <div className="bg-gradient-to-b from-green-100 to-green-200 text-black py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Kapangan Blogs</h1>
          <p className="text-xl text-gray-800 max-w-3xl mx-auto">
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
                      ? 'bg-primary-green text-egg-white'
                      : 'bg-white/80 text-black hover:bg-white'
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
                    </div>
                    
                    <h2 className="text-xl font-bold text-gray-900 mb-3 line-clamp-2">
                      {post.title}
                    </h2>
                    
                    <p className="text-gray-600 mb-4 line-clamp-3">
                      {post.excerpt}
                    </p>

                    {/* Show location and Facebook URL for Where to Stay/Eat categories */}
                    {(post.category === 'Where to Stay' || post.category === 'Where to Eat') && (
                      <div className="space-y-2 mb-4 text-sm">
                        {post.location && (
                          <div className="flex items-start gap-2 text-gray-700">
                            <svg className="w-4 h-4 mt-0.5 text-primary-green flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            <span>{post.location}</span>
                          </div>
                        )}
                        {post.contactNumber && (
                          <div className="flex items-center gap-2 text-gray-700">
                            <svg className="w-4 h-4 text-primary-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                            </svg>
                            <a href={`tel:${post.contactNumber}`} className="hover:text-primary-green">
                              {post.contactNumber}
                            </a>
                          </div>
                        )}
                        {post.facebookUrl && (
                          <div className="flex items-center gap-2 text-gray-700">
                            <svg className="w-4 h-4 text-primary-green" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" />
                            </svg>
                            <a 
                              href={post.facebookUrl} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline"
                            >
                              Visit Facebook Page
                            </a>
                          </div>
                        )}
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <span>{post.authorName || (post.authorType === 'admin' ? 'Kapangan Tourism' : `Barangay ${post.barangay}`)}</span>
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
        <div className="fixed inset-0 z-50 bg-white overflow-y-auto">
          {/* Modal Header */}
          <div className="sticky top-0 bg-white z-20 border-b border-gray-200 p-4 flex justify-between items-center">
            <button 
              onClick={closeBlogModal}
              className="p-2 rounded-full hover:bg-gray-100"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
            <h2 className="text-xl font-semibold text-gray-800">
              {editingBlog === selectedBlog.id ? 'Edit Blog' : ''}
            </h2>
            <div className="w-10">
              {isAuthor(selectedBlog) && (searchParams?.get('from') === 'dashboard' || searchParams?.get('edit')) && (
                <button
                  onClick={() => {
                    if (editingBlog === selectedBlog.id) {
                      handleUpdateBlog(selectedBlog.id);
                    } else {
                      startEdit(selectedBlog);
                    }
                  }}
                  className="text-primary-green hover:text-accent-green font-medium"
                >
                  {editingBlog === selectedBlog.id ? 'Save' : 'Edit'}
                </button>
              )}
            </div>
          </div>
          
          {/* Main Content */}
          <div className="flex flex-1 overflow-hidden">
            {/* Left Side - Title, Image, and Basic Info */}
            <div className="w-full md:w-2/5 flex flex-col overflow-y-auto p-6 md:p-8 border-r border-gray-200">
                {editingBlog === selectedBlog?.id ? (
                  <>
                    <div className="flex justify-end gap-2 mb-6">
                      <button
                        onClick={() => handleUpdateBlog(selectedBlog.id)}
                        disabled={isUploading}
                        className={`flex items-center gap-1 px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                          isUploading
                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            : 'bg-primary-green text-egg-white hover:bg-green-700'
                        }`}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Save
                      </button>
                      <button
                        onClick={cancelEdit}
                        disabled={isUploading}
                        className={`flex items-center gap-1 px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                          isUploading
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            : 'bg-gray-100 text-primary-green hover:bg-gray-200'
                        }`}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        Cancel
                      </button>
                    </div>
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
                      className="w-full mb-6 text-2xl font-bold text-gray-900 border border-border-green rounded px-3 py-2"
                    />
                  </>
                ) : (
                  <h1 className="text-2xl font-bold text-gray-900 mb-6">
                    {selectedBlog?.title}
                  </h1>
                )}
                
                {/* Featured Image */}
                <div className="relative mb-6">
                  <div className="w-full h-64 rounded-xl bg-gray-100 relative overflow-hidden">
                    {selectedBlog?.imageUrl ? (
                      <Image
                        src={selectedBlog.imageUrl}
                        alt={selectedBlog.title}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, 50vw"
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
                    ) : selectedBlog?._tempImage ? (
                      <img
                        src={URL.createObjectURL(selectedBlog._tempImage)}
                        alt="Preview"
                        className="w-full h-full object-cover"
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
                <div className="flex items-center gap-3 text-sm text-gray-600 mb-4">
                  <span>{selectedBlog?.createdAt?.toDate ? selectedBlog.createdAt.toDate().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'Unknown date'}</span>
                  <span className="text-gray-300">•</span>
                  <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">
                    {selectedBlog?.category}
                  </span>
                </div>

                {/* Business Information - Both View and Edit Modes */}
                {(selectedBlog?.category === 'Where to Stay' || selectedBlog?.category === 'Where to Eat') && (
                  <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                    <h3 className="font-medium text-gray-700 mb-3">Business Information</h3>
                    <div className="space-y-3">
                      {editingBlog === selectedBlog?.id ? (
                        <>
                          <div>
                            <label className="block text-sm font-medium text-gray-500 mb-1">Location</label>
                            <input
                              type="text"
                              value={selectedBlog?.location || ''}
                              onChange={(e) => {
                                if (selectedBlog) {
                                  setSelectedBlog({
                                    ...selectedBlog,
                                    location: e.target.value
                                  });
                                }
                              }}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                              placeholder="Business location"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-500 mb-1">Contact Number</label>
                            <input
                              type="text"
                              value={selectedBlog?.contactNumber || ''}
                              onChange={(e) => {
                                if (selectedBlog) {
                                  setSelectedBlog({
                                    ...selectedBlog,
                                    contactNumber: e.target.value
                                  });
                                }
                              }}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                              placeholder="Contact number"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-500 mb-1">Facebook URL</label>
                            <input
                              type="text"
                              value={selectedBlog?.facebookUrl || ''}
                              onChange={(e) => {
                                if (selectedBlog) {
                                  setSelectedBlog({
                                    ...selectedBlog,
                                    facebookUrl: e.target.value
                                  });
                                }
                              }}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                              placeholder="Facebook page URL"
                            />
                          </div>
                        </>
                      ) : (
                        <>
                          {selectedBlog?.location && (
                            <div className="flex items-start">
                              <svg className="w-5 h-5 text-gray-400 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                              <span className="text-gray-700">{selectedBlog.location}</span>
                            </div>
                          )}
                          {selectedBlog?.contactNumber && (
                            <div className="flex items-center">
                              <svg className="w-5 h-5 text-gray-400 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                              </svg>
                              <a href={`tel:${selectedBlog.contactNumber}`} className="text-primary-green hover:underline">
                                {selectedBlog.contactNumber}
                              </a>
                            </div>
                          )}
                          {selectedBlog?.facebookUrl && (
                            <div className="flex items-center">
                              <svg className="w-5 h-5 text-gray-400 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                                <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" />
                              </svg>
                              <a 
                                href={selectedBlog.facebookUrl.startsWith('http') ? selectedBlog.facebookUrl : `https://${selectedBlog.facebookUrl}`} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-primary-green hover:underline"
                              >
                                {selectedBlog.facebookUrl.replace(/^https?:\/\//, '')}
                              </a>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                )} 
                
                {/* Author Info */}
                <div className="flex items-center gap-4 pt-4 border-t border-gray-100 mt-6">
                  <div className="h-12 w-12 rounded-full bg-gray-200 flex items-center justify-center text-gray-500">
                    {selectedBlog?.authorType === 'admin' ? 'A' : selectedBlog?.barangay?.charAt(0).toUpperCase() || 'B'}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">
                      {selectedBlog?.authorType === 'admin' ? 'Kapangan Tourism' : `Barangay ${selectedBlog?.barangay || ''}`}
                    </p>
                    <p className="text-sm text-gray-500">
                      {selectedBlog?.authorType === 'admin' ? 'Administrator' : 'Barangay Admin'}
                    </p>
                  </div>
                </div>
                
              </div>
            {/* Right Side - Content */}
            <div className="w-full md:w-3/5 flex flex-col overflow-y-auto p-6 md:p-8">
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
      )}

    </div>
  );
}