'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/firebase/config';
import { collection, query, where, getDocs, addDoc, updateDoc, deleteDoc, doc, Timestamp, orderBy } from 'firebase/firestore';
import { BookOpen, Plus, Edit, Trash2, Save, X, Calendar, Eye } from 'lucide-react';

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
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingBlog, setEditingBlog] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    excerpt: '',
    category: 'Tourism',
    tags: '',
    status: 'draft' as 'draft' | 'published'
  });

  useEffect(() => {
    if (barangayAdminData?.barangayName) {
      fetchBlogs();
    }
  }, [barangayAdminData]);

  const fetchBlogs = async () => {
    try {
      setLoading(true);
      const blogsRef = collection(db, 'blogs');
      const blogsQuery = query(
        blogsRef,
        where('barangay', '==', barangayAdminData?.barangayName),
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
    try {
      const tagsArray = formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag);
      
      await addDoc(collection(db, 'blogs'), {
        title: formData.title,
        content: formData.content,
        excerpt: formData.excerpt,
        category: formData.category,
        tags: tagsArray,
        status: formData.status,
        barangay: barangayAdminData?.barangayName,
        author: currentUser?.uid,
        authorName: currentUser?.displayName || 'Barangay Admin',
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
        status: 'draft'
      });
      fetchBlogs();
    } catch (error) {
      console.error('Error adding blog:', error);
      alert('Failed to add blog');
    }
  };

  const handleUpdateBlog = async (blogId: string) => {
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
        updatedAt: Timestamp.now()
      });
      setEditingBlog(null);
      setFormData({
        title: '',
        content: '',
        excerpt: '',
        category: 'Tourism',
        tags: '',
        status: 'draft'
      });
      fetchBlogs();
    } catch (error) {
      console.error('Error updating blog:', error);
      alert('Failed to update blog');
    }
  };

  const handleDeleteBlog = async (blogId: string) => {
    if (!confirm('Are you sure you want to delete this blog post?')) return;
    
    try {
      await deleteDoc(doc(db, 'blogs', blogId));
      fetchBlogs();
    } catch (error) {
      console.error('Error deleting blog:', error);
      alert('Failed to delete blog');
    }
  };

  const startEdit = (blog: Blog) => {
    setEditingBlog(blog.id);
    setFormData({
      title: blog.title,
      content: blog.content,
      excerpt: blog.excerpt,
      category: blog.category,
      tags: blog.tags.join(', '),
      status: blog.status
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
      status: 'draft'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading blogs...
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="p-6 bg-white border-b flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <BookOpen size={28} />
            Blogs
          </h1>
          <p className="text-gray-600 mt-1">
            Manage blog posts for {barangayAdminData?.barangayName}
          </p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition flex items-center gap-2"
        >
          <Plus size={20} />
          New Blog Post
        </button>
      </div>

      <div className="p-6">
        {/* Add Form Modal */}
        {showAddForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
              <h2 className="text-xl font-bold mb-4">Create New Blog Post</h2>
              <form onSubmit={handleAddBlog} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Title *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Excerpt *
                  </label>
                  <textarea
                    value={formData.excerpt}
                    onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                    required
                    rows={2}
                    placeholder="Brief summary of the blog post..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Content *
                  </label>
                  <textarea
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    required
                    rows={10}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Category *
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    >
                      <option value="Tourism">Tourism</option>
                      <option value="Culture">Culture</option>
                      <option value="Events">Events</option>
                      <option value="News">News</option>
                      <option value="Guide">Guide</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Status
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as 'draft' | 'published' })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    >
                      <option value="draft">Draft</option>
                      <option value="published">Published</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tags (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={formData.tags}
                    onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                    placeholder="e.g., travel, adventure, kapangan"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
                <div className="flex gap-2 justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddForm(false);
                      cancelEdit();
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition"
                  >
                    Create Blog Post
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Blogs List */}
        <div className="space-y-4">
          {blogs.map((blog) => (
            <div key={blog.id} className="bg-white rounded-lg shadow-md overflow-hidden">
              {editingBlog === blog.id ? (
                <div className="p-6">
                  <form onSubmit={(e) => { e.preventDefault(); handleUpdateBlog(blog.id); }} className="space-y-4">
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg"
                      placeholder="Title"
                    />
                    <textarea
                      value={formData.excerpt}
                      onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg"
                      rows={2}
                      placeholder="Excerpt"
                    />
                    <textarea
                      value={formData.content}
                      onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg"
                      rows={8}
                      placeholder="Content"
                    />
                    <div className="grid grid-cols-3 gap-4">
                      <select
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        className="px-4 py-2 border rounded-lg"
                      >
                        <option value="Tourism">Tourism</option>
                        <option value="Culture">Culture</option>
                        <option value="Events">Events</option>
                        <option value="News">News</option>
                        <option value="Guide">Guide</option>
                      </select>
                      <select
                        value={formData.status}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value as 'draft' | 'published' })}
                        className="px-4 py-2 border rounded-lg"
                      >
                        <option value="draft">Draft</option>
                        <option value="published">Published</option>
                      </select>
                      <input
                        type="text"
                        value={formData.tags}
                        onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                        className="px-4 py-2 border rounded-lg"
                        placeholder="Tags"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="submit"
                        className="flex-1 bg-green-500 text-white py-2 rounded-lg hover:bg-green-600 transition flex items-center justify-center gap-2"
                      >
                        <Save size={18} />
                        Save Changes
                      </button>
                      <button
                        type="button"
                        onClick={cancelEdit}
                        className="flex-1 bg-gray-500 text-white py-2 rounded-lg hover:bg-gray-600 transition flex items-center justify-center gap-2"
                      >
                        <X size={18} />
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              ) : (
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-xl font-semibold text-gray-800">{blog.title}</h3>
                        <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                          {blog.category}
                        </span>
                        <span
                          className={`px-2 py-1 text-xs rounded-full ${
                            blog.status === 'published'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {blog.status}
                        </span>
                      </div>
                      <p className="text-gray-600 mb-3">{blog.excerpt}</p>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <Calendar size={14} />
                          {blog.createdAt?.toDate?.()?.toLocaleDateString() || 'N/A'}
                        </div>
                        <div className="flex items-center gap-1">
                          <Eye size={14} />
                          {blog.views || 0} views
                        </div>
                        <div>By {blog.authorName}</div>
                      </div>
                      {blog.tags && blog.tags.length > 0 && (
                        <div className="flex gap-2 mt-3">
                          {blog.tags.map((tag, index) => (
                            <span key={index} className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2 ml-4">
                      <button
                        onClick={() => startEdit(blog)}
                        className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
                      >
                        <Edit size={18} />
                      </button>
                      <button
                        onClick={() => handleDeleteBlog(blog.id)}
                        className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {blogs.length === 0 && (
          <div className="text-center py-12">
            <BookOpen size={48} className="mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500 text-lg">No blog posts yet</p>
            <p className="text-gray-400 text-sm">Click "New Blog Post" to create your first blog post</p>
          </div>
        )}
      </div>
    </div>
  );
}
