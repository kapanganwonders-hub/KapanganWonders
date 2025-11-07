'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/firebase/config';
import { collection, query, where, getDocs, deleteDoc, doc, Timestamp, orderBy, addDoc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { client, storage, uploadFile } from '@/lib/appwrite';
import { BookOpen, Trash2, Calendar, Eye, Edit, Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';

interface Blog {
  id: string;
  title: string;
  content: string;
  barangay: string;
  author: string;
  authorName: string;
  category: string;
  tags: string[];
  status: 'draft' | 'published';
  views: number;
  createdAt: Timestamp | Date;
  updatedAt: Timestamp | Date;
  imageUrl?: string;
}

export default function BlogsPage() {
  const { currentUser, barangayAdminData } = useAuth();
  const router = useRouter();
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: 'News',
    imageUrl: ''
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (barangayAdminData?.barangayName) {
      fetchBlogs();
    }
  }, [barangayAdminData]);

  const fetchBlogs = async (): Promise<void> => {
    try {
      setLoading(true);
      const blogsRef = collection(db, 'blogs');
      
      // For barangay admin, fetch all blogs from their barangay regardless of status
      const blogsQuery = query(
        blogsRef,
        where('barangay', '==', barangayAdminData?.barangayName)
      );
      
      const blogsSnapshot = await getDocs(blogsQuery);
      let blogsData = blogsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Blog));
      
      setBlogs(blogsData);
    } catch (error) {
      console.error('Error fetching blogs:', error);
      toast.error('Failed to load blogs. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !barangayAdminData) return;
    
    if (!formData.imageUrl) {
      toast.error('Please upload a featured image');
      return;
    }
    
    setUploading(true);

    try {
      const blogData = {
        title: formData.title,
        content: formData.content,
        category: formData.category,
        imageUrl: formData.imageUrl,
        author: currentUser.uid,
        authorName: currentUser.displayName || 'Anonymous',
        barangay: barangayAdminData.barangayName,
        views: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      
      // Save to Firestore
      const blogsRef = collection(db, 'blogs');
      await addDoc(blogsRef, blogData);
      
      // Reset form and hide it
      setFormData({
        title: '',
        content: '',
        category: 'News',
        imageUrl: ''
      });
      setShowForm(false);
      
      // Refresh the blogs list
      await fetchBlogs();
      
      toast.success('Blog post created successfully!');
    } catch (error) {
      console.error('Error creating blog:', error);
      toast.error('Failed to save blog post. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) {
      console.log('No file selected');
      return;
    }
    
    const file = e.target.files[0];
    console.log('Selected file:', file);
    
    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      const errorMsg = `Invalid file type: ${file.type}. Allowed types: ${validTypes.join(', ')}`;
      console.error(errorMsg);
      toast.error('Please upload a valid image file (JPEG, PNG, WebP, or GIF)');
      return;
    }
    
    // Validate file size (5MB limit)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      const errorMsg = `File too large: ${(file.size / (1024 * 1024)).toFixed(2)}MB. Max size: 5MB`;
      console.error(errorMsg);
      toast.error('Image size should be less than 5MB');
      return;
    }
    
    setUploading(true);
    
    try {
      // Verify Appwrite client is properly initialized
      if (!client || !storage) {
        console.error('Appwrite client not initialized:', { client, storage });
        throw new Error('Appwrite client not properly initialized');
      }
      
      console.log('Appwrite client config:', {
        endpoint: client.config.endpoint,
        project: client.config.project,
        bucketId: '69062d080010accbfb9e' // Your bucket ID
      });
      
      console.log('Starting file upload...', {
        name: file.name,
        size: file.size,
        type: file.type,
        bucketId: '69062d080010accbfb9e'
      });
      
      // Upload to Appwrite Storage
      const fileData = await uploadFile(file, 'blog-images');
      
      if (!fileData) {
        throw new Error('No response received from uploadFile');
      }
      
      console.log('Upload response:', fileData);
      
      if (!fileData.$id || !fileData.url) {
        throw new Error('Incomplete response from uploadFile. Missing ID or URL.');
      }
      
      console.log('File uploaded successfully:', {
        fileId: fileData.$id,
        url: fileData.url,
        name: fileData.name,
        size: fileData.size,
        type: fileData.mimeType
      });
      
      setFormData(prev => ({
        ...prev,
        imageUrl: fileData.url
      }));
      
      toast.success('Image uploaded successfully');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to upload image';
      console.error('Upload error details:', {
        error,
        message: errorMessage,
        name: error instanceof Error ? error.name : 'UnknownError',
        stack: error instanceof Error ? error.stack : undefined,
        file: {
          name: file.name,
          size: file.size,
          type: file.type
        },
        timestamp: new Date().toISOString()
      });
      
      toast.error(`Upload failed: ${errorMessage}`);
    } finally {
      setUploading(false);
      // Reset file input to allow re-uploading the same file if it fails
      e.target.value = '';
    }
  };

  const handleDeleteBlog = async (blogId: string): Promise<void> => {
    if (!window.confirm('Are you sure you want to delete this blog post?')) {
      return;
    }
    
    try {
      await deleteDoc(doc(db, 'blogs', blogId));
      await fetchBlogs();
      toast.success('Blog post deleted successfully');
    } catch (error) {
      console.error('Error deleting blog:', error);
      toast.error('Failed to delete blog post');
    }
  };

  const formatDate = (date: any): string => {
    if (!date) return '';
    
    try {
      let d: Date;
      if (date instanceof Timestamp) {
        d = date.toDate();
      } else if (date.seconds) {
        d = new Date(date.seconds * 1000);
      } else {
        d = new Date(date);
      }
      
      return d.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      return '';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Blog Posts</h1>
            <button
              onClick={() => setShowForm(!showForm)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Plus className="h-4 w-4 mr-2" />
              {showForm ? 'Cancel' : 'Add New Blog'}
            </button>
          </div>
          
          {showForm && (
            <div className="bg-white p-6 rounded-lg shadow-md mb-6">
              <h2 className="text-xl font-semibold mb-4">Create New Blog Post</h2>
              <form onSubmit={handleSubmit}>
                <div className="mb-4">
                  <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                    Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="title"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Featured Image
                  </label>
                  <div className="mt-1 flex items-center">
                    <label className="cursor-pointer bg-white py-2 px-3 border border-gray-300 rounded-md shadow-sm text-sm leading-4 font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                      Choose Image
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="hidden"
                      />
                    </label>
                    {formData.imageUrl && (
                      <div className="ml-4 relative">
                        <img
                          src={formData.imageUrl}
                          alt="Preview"
                          className="h-16 w-16 object-cover rounded-md"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setFormData(prev => ({ ...prev, imageUrl: '' }));
                            setImageFile(null);
                          }}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
                        >
                          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-gray-500">Recommended size: 1200x630px. Max file size: 5MB</p>
                </div>

                <div className="mb-4">
                  <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-1">
                    Content <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    id="content"
                    name="content"
                    value={formData.content}
                    onChange={handleInputChange}
                    rows={6}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                      Category
                    </label>
                    <select
                      id="category"
                      name="category"
                      value={formData.category}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="Tourism">Tourism</option>
                      <option value="Culture">Culture</option>
                      <option value="Events">Events</option>
                      <option value="News">News</option>
                      <option value="Guide">Guide</option>
                      <option value="Where to Stay">Where to Stay</option>
                      <option value="Where to Eat">Where to Eat</option>
                    </select>
                  </div>
                </div>
                
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={uploading}
                    className={`inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white ${uploading ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
                  >
                    {uploading ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Saving...
                      </>
                    ) : (
                      'Save Blog Post'
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="space-y-6">
              {blogs.map((blog) => (
                <div key={blog.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="p-6">
                    <div className="flex justify-between items-start">
                      <div>
                        <h2 className="text-xl font-semibold text-gray-800">{blog.title}</h2>
                        <div className="flex items-center text-sm text-gray-500 mt-1">
                          <span className="flex items-center">
                            <Calendar className="w-4 h-4 mr-1" />
                            {formatDate(blog.updatedAt || blog.createdAt)}
                          </span>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            // Open the blog in the same page with edit mode
                            window.location.href = `/blogs?id=${blog.id}&edit=true`;
                          }}
                          className="text-blue-600 hover:text-blue-800 p-2 hover:bg-blue-50 rounded-full"
                          title="Edit blog post"
                        >
                          <Edit className="w-5 h-5" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteBlog(blog.id);
                          }}
                          className="text-red-600 hover:text-red-800 p-2 hover:bg-red-50 rounded-full"
                          title="Delete blog post"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                    <p className="mt-3 text-gray-600">{blog.content.substring(0, 200)}{blog.content.length > 200 ? '...' : ''}</p>
                    <div className="mt-4">
                      <span className="text-sm text-gray-500">
                        {blog.views || 0} views • {blog.category}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
              {blogs.length === 0 && !loading && (
                <div className="text-center py-12 bg-white rounded-lg shadow">
                  <BookOpen size={48} className="mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900">No blog posts yet</h3>
                  <p className="mt-1 text-gray-500">There are no blog posts to display.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
