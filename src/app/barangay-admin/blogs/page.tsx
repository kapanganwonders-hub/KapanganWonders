'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/firebase/config';
import { collection, query, where, getDocs, deleteDoc, doc, Timestamp, orderBy, addDoc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { client, storage, uploadFile } from '@/lib/appwrite';
import { BookOpen, Trash2, Calendar, Eye, Edit, Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Alert, AlertTitle, AlertDescription } from "@/components/lightswind/alert"
import ConfirmationDialog from '@/components/ui/confirmation-dialog';

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
    excerpt: '',
    content: '',
    category: 'News',
    imageUrl: '',
    status: 'draft' as const,
    tags: [] as string[],
    tagInput: ''
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [editingBlog, setEditingBlog] = useState<Blog | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [blogToDelete, setBlogToDelete] = useState<{id: string, title: string} | null>(null);
  const [alert, setAlert] = useState<{type: 'success' | 'destructive' | 'info' | 'warning', message: string} | null>(null);

  useEffect(() => {
    if (currentUser) {
      fetchBlogs();
    }
    
    // Auto-hide alert after 5 seconds
    if (alert) {
      const timer = setTimeout(() => {
        setAlert(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [currentUser, alert]);

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
      setAlert({ type: 'destructive', message: 'Failed to load blogs. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentUser) return;
    
    try {
      setIsSubmitting(true);
      
      const blogData = {
        title: formData.title,
        excerpt: formData.excerpt,
        content: formData.content,
        category: formData.category,
        barangay: barangayAdminData?.barangayName || currentUser.barangay || '',
        author: barangayAdminData?.id || currentUser.uid,
        authorName: barangayAdminData?.name || currentUser.name || 'Barangay Admin',
        authorType: 'barangay_admin',
        imageUrl: formData.imageUrl || '',
        createdAt: editingBlog ? editingBlog.createdAt : serverTimestamp(),
        updatedAt: serverTimestamp(),
        views: editingBlog?.views || 0,
      };
      
      if (editingBlog) {
        await updateDoc(doc(db, 'blogs', editingBlog.id), blogData);
        setAlert({ type: 'success', message: 'Blog updated successfully' });
      } else {
        await addDoc(collection(db, 'blogs'), blogData);
        setAlert({ type: 'success', message: 'Blog created successfully' });
      }
      
      setShowForm(false);
      setFormData({
        title: '',
        excerpt: '',
        content: '',
        category: 'News',
        imageUrl: '',
        status: 'draft',
        tags: [],
        tagInput: ''
      });
      setEditingBlog(null);
      fetchBlogs();
    } catch (error) {
      console.error('Error saving blog:', error);
      setAlert({ type: 'destructive', message: 'Failed to save blog' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => {
      // Handle different input types
      const newValue = e.target.type === 'checkbox' 
        ? (e.target as HTMLInputElement).checked 
        : value;
      
      return {
        ...prev,
        [name]: newValue
      };
    });
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
      setAlert({ type: 'destructive', message: 'Please upload a valid image file (JPEG, PNG, WebP, or GIF)' });
      return;
    }
    
    // Validate file size (5MB limit)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      const errorMsg = `File too large: ${(file.size / (1024 * 1024)).toFixed(2)}MB. Max size: 5MB`;
      console.error(errorMsg);
      setAlert({ type: 'destructive', message: 'Image size should be less than 5MB' });
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
      
      setAlert({ type: 'success', message: 'Image uploaded successfully' });
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
      
      setAlert({ type: 'destructive', message: `Upload failed: ${errorMessage}` });
    } finally {
      setUploading(false);
      // Reset file input to allow re-uploading the same file if it fails
      e.target.value = '';
    }
  };

  const handleDeleteBlog = async () => {
    if (!currentUser || !blogToDelete) return;
    
    try {
      setIsDeleting(true);
      await deleteDoc(doc(db, 'blogs', blogToDelete.id));
      setBlogs(blogs.filter(blog => blog.id !== blogToDelete.id));
      setAlert({ type: 'success', message: 'Blog deleted successfully' });
    } catch (error) {
      console.error('Error deleting blog:', error);
      setAlert({ type: 'destructive', message: 'Failed to delete blog' });
    } finally {
      setIsDeleting(false);
      setBlogToDelete(null);
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
      {alert && (
        <div className="fixed bottom-6 right-6 z-50 max-w-md w-full">
          <div className={`bg-white rounded-lg border-l-4 ${
            alert.type === 'success' ? 'border-green-500' : 
            alert.type === 'destructive' ? 'border-red-500' :
            alert.type === 'warning' ? 'border-yellow-500' : 'border-blue-500'
          } shadow-lg`}>
            <Alert variant={alert.type} withIcon className="bg-white">
              <AlertTitle className="font-medium">
                {alert.type === 'success' ? 'Success!' : 
                 alert.type === 'destructive' ? 'Error' : 
                 alert.type.charAt(0).toUpperCase() + alert.type.slice(1)}
              </AlertTitle>
              <AlertDescription>{alert.message}</AlertDescription>
            </Alert>
          </div>
        </div>
      )}
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
                  <label htmlFor="excerpt" className="block text-sm font-medium text-gray-700 mb-1">
                    Excerpt <span className="text-gray-500">(optional)</span>
                  </label>
                  <textarea
                    id="excerpt"
                    name="excerpt"
                    value={formData.excerpt}
                    onChange={handleInputChange}
                    rows={3}
                    maxLength={300}
                    placeholder="A short summary or teaser for your blog post (max 300 characters)"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    {formData.excerpt.length}/300 characters
                  </p>
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
                  
                  <div>
                    <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                      Status
                    </label>
                    <select
                      id="status"
                      name="status"
                      value={formData.status}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="draft">Draft</option>
                      <option value="published">Published</option>
                    </select>
                  </div>
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

                        </button>
                      </div>
                    )}
                    <p className="text-xs text-gray-500 ml-4">Recommended size: 1200x630px. Max file size: 5MB</p>
                  </div>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tags
                  </label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {formData.tags.map((tag, index) => (
                      <span 
                        key={index}
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => {
                            setFormData(prev => ({
                              ...prev,
                              tags: prev.tags.filter((_, i) => i !== index)
                            }));
                          }}
                          className="ml-1.5 inline-flex items-center justify-center h-4 w-4 rounded-full text-blue-400 hover:bg-blue-200 hover:text-blue-500 focus:outline-none"
                        >
                          <span className="sr-only">Remove tag</span>
                          <svg className="h-2 w-2" stroke="currentColor" fill="none" viewBox="0 0 8 8">
                            <path strokeLinecap="round" strokeWidth="1.5" d="M1 1l6 6m0-6L1 7" />
                          </svg>
                        </button>
                      </span>
                    ))}
                  </div>
                  <div className="flex">
                    <input
                      type="text"
                      value={formData.tagInput}
                      onChange={(e) => setFormData(prev => ({ ...prev, tagInput: e.target.value }))}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ',') {
                          e.preventDefault();
                          const tag = formData.tagInput.trim();
                          if (tag && !formData.tags.includes(tag)) {
                            setFormData(prev => ({
                              ...prev,
                              tags: [...prev.tags, tag],
                              tagInput: ''
                            }));
                          }
                        }
                      }}
                      placeholder="Add tags (press enter or comma to add)"
                      className="flex-1 min-w-0 block w-full px-3 py-2 rounded-md border border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const tag = formData.tagInput.trim();
                        if (tag && !formData.tags.includes(tag)) {
                          setFormData(prev => ({
                            ...prev,
                            tags: [...prev.tags, tag],
                            tagInput: ''
                          }));
                        }
                      }}
                      className="ml-2 inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      Add
                    </button>
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
                    disabled={uploading || isSubmitting}
                    className={`inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white ${uploading || isSubmitting ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
                  >
                    {uploading || isSubmitting ? (
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
                            setBlogToDelete({ id: blog.id, title: blog.title });
                          }}
                          disabled={isDeleting}
                          className="text-red-500 hover:text-red-700"
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
      <ConfirmationDialog
        isOpen={!!blogToDelete}
        onClose={() => setBlogToDelete(null)}
        onConfirm={handleDeleteBlog}
        title="Delete Blog"
        message={`Are you sure you want to delete the blog "${blogToDelete?.title}"? This action cannot be undone.`}
        confirmText="Delete Blog"
        cancelText="Cancel"
      />
    </div>
  );
}
