'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/firebase/config';
import { collection, query, where, getDocs, deleteDoc, doc, Timestamp, orderBy } from 'firebase/firestore';
import { BookOpen, Trash2, Calendar, Eye, Edit } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';

interface Blog {
  id: string;
  title: string;
  content: string;
  excerpt: string;
  barangay: string;
  author: string;
  authorName: string;
  category: string;
  tags: string[];
  status: 'draft' | 'published';
  views: number;
  createdAt: any;
  updatedAt: any;
}

export default function BlogsPage() {
  const { currentUser, barangayAdminData } = useAuth();
  const router = useRouter();
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);

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
      })) as Blog[];
      
      // Sort blogs: published first, then by creation date (newest first)
      blogsData = blogsData.sort((a, b) => {
        // First sort by status (published first)
        if (a.status !== b.status) {
          return a.status === 'published' ? -1 : 1;
        }
        // Then sort by creation date (newest first)
        const aDate = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(0);
        const bDate = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(0);
        return bDate.getTime() - aDate.getTime();
      });
      
      setBlogs(blogsData);
    } catch (error) {
      console.error('Error fetching blogs:', error);
      toast.error('Failed to load blogs. Please try again.');
    } finally {
      setLoading(false);
    }
  };


  const handleDeleteBlog = async (blogId: string): Promise<void> => {
    if (!window.confirm('Are you sure you want to delete this blog post?')) {
      return;
    }
    
    try {
      await deleteDoc(doc(db, 'blogs', blogId));
      fetchBlogs();
      toast.success('Blog post deleted successfully');
    } catch (error) {
      console.error('Error deleting blog:', error);
      toast.error('Failed to delete blog post');
    }
  };

  const formatDate = (date: any): string => {
    if (!date) return 'N/A';
    try {
      const d = date?.toDate ? date.toDate() : new Date(date);
      if (isNaN(d.getTime())) return 'Invalid Date';
      return d.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Invalid Date';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading blogs...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Blog Posts</h1>
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
                          <span className="mx-2">•</span>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            blog.status === 'published' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {blog.status === 'published' ? 'Published' : 'Draft'}
                          </span>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/blogs?edit=${blog.id}`);
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
                    <p className="mt-3 text-gray-600">{blog.excerpt}</p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {blog.tags.map((tag, index) => (
                        <span key={index} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                          {tag}
                        </span>
                      ))}
                    </div>
                    <div className="mt-4 flex items-center justify-between">
                      <span className="text-sm text-gray-500">
                        {blog.views || 0} views • {blog.category}
                      </span>
                      <a
                        href={`/blogs/${blog.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline text-sm font-medium flex items-center"
                      >
                        <Eye size={16} className="mr-1" /> View Post
                      </a>
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
